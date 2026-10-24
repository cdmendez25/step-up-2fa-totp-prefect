"""Flows de Prefect: cada paso de seguridad es una task observable.

Las flechas del grafo en Prefect UI salen de pasar el resultado de una task como
argumento de la siguiente. Por eso cada task devuelve lo que la siguiente necesita.

El token y el código viajan como SecretStr: Prefect los muestra como ********
en la UI en vez de dejarlos a la vista.
"""

from prefect import flow, get_run_logger, task
from prefect.cache_policies import NO_CACHE
from pydantic import SecretStr

from app import db, totp
from app.config import settings
from app.replay_cache import replay_cache
from app.security import (
    SCOPE_MFA_VERIFY,
    InvalidToken,
    decode_token,
    issue_access_token,
)
from app.strategies import new_backup_codes, strategy_for
from app.vault import vault

VERIFY_TASKS = [
    "validate_pre_auth_state",
    "check_anti_replay_cache",
    "execute_mfa_strategy",
    "issue_elevated_session",
]


class InvalidPreAuthState(Exception):
    """Task 1 falla: token temporal inválido, expirado o 2FA no activo."""


class ReplayAttackDetected(Exception):
    """Task 2 falla: el código ya se usó en los últimos 90 s."""


class InvalidSecondFactor(Exception):
    """Task 3 falla: el código no es válido para la estrategia elegida."""


def _mask(code: str) -> str:
    return code[:2] + "*" * max(len(code) - 2, 0)


# =====================================================================
# Verificación del segundo factor (sección 4 de la guía)
# =====================================================================

@task(name="validate_pre_auth_state", cache_policy=NO_CACHE)
def validate_pre_auth_state(pre_auth_token: SecretStr) -> dict:
    logger = get_run_logger()
    try:
        claims = decode_token(pre_auth_token.get_secret_value(), SCOPE_MFA_VERIFY)
    except InvalidToken as exc:
        raise InvalidPreAuthState(str(exc)) from exc

    config = db.get_mfa_config(claims["sub"])
    if not config or config["status"] != "ACTIVE":
        raise InvalidPreAuthState("El usuario no tiene el 2FA en estado ACTIVE.")

    logger.info("pre_auth_token válido para '%s' (scope %s)", claims["username"], claims["scope"])
    return {"user_id": claims["sub"], "username": claims["username"]}


@task(name="check_anti_replay_cache", cache_policy=NO_CACHE)
def check_anti_replay_cache(user: dict, code: SecretStr) -> dict:
    logger = get_run_logger()
    value = code.get_secret_value().strip()
    seconds_ago = replay_cache.seconds_since_use(user["user_id"], value)
    if seconds_ago is not None:
        raise ReplayAttackDetected(
            f"(user {user['username']}, {_mask(value)}) ya se usó hace {seconds_ago:.0f} s. Ataque de repetición bloqueado."
        )
    logger.info("El código no se ha usado en los últimos 90 s")
    return user


@task(name="execute_mfa_strategy", cache_policy=NO_CACHE)
def execute_mfa_strategy(user: dict, code: SecretStr, factor: str) -> dict:
    logger = get_run_logger()
    strategy = strategy_for(factor)
    result = strategy.verify(user["user_id"], code.get_secret_value())
    if not result.ok:
        raise InvalidSecondFactor(result.detail)

    if result.window is not None:
        reloj = {-1: "atrasado", 0: "sincronizado", 1: "adelantado"}[result.window]
        logger.info("%s · el reloj del celular está %s", result.detail, reloj)
    else:
        logger.info(result.detail)
    return {**user, "factor": factor, "amr": strategy.amr, "window": result.window,
            "backup_code_id": result.backup_code_id, "detail": result.detail}


@task(name="issue_elevated_session", cache_policy=NO_CACHE)
def issue_elevated_session(verified: dict, code: SecretStr) -> dict:
    logger = get_run_logger()
    replay_cache.mark_used(verified["user_id"], code.get_secret_value().strip())
    if verified["backup_code_id"]:
        db.mark_backup_code_used(verified["backup_code_id"])
        logger.info("Código de respaldo marcado como usado (un solo uso)")

    token = issue_access_token(verified["user_id"], verified["username"], verified["amr"])
    logger.info("Código marcado como usado en la caché anti-replay · access_token emitido con mfa_verified=true")
    return {"access_token": token, "window": verified["window"], "detail": verified["detail"]}


@flow(name="verify_2fa_flow")
def verify_2fa_flow(pre_auth_token: SecretStr, code: SecretStr, factor: str = "totp") -> dict:
    user = validate_pre_auth_state(pre_auth_token)
    fresh_user = check_anti_replay_cache(user, code)
    verified = execute_mfa_strategy(fresh_user, code, factor)
    return issue_elevated_session(verified, code)


def failed_task_index(error: BaseException) -> int | None:
    """En qué task se detuvo el flow, según el tipo de error."""
    return {InvalidPreAuthState: 0, ReplayAttackDetected: 1, InvalidSecondFactor: 2}.get(type(error))


# =====================================================================
# Aprovisionamiento: NONE → PENDING_VERIFICATION → ACTIVE (Process Manager)
# =====================================================================

@task(name="generate_encrypted_secret", cache_policy=NO_CACHE)
def generate_encrypted_secret() -> dict:
    logger = get_run_logger()
    secret, encrypted = vault.generate()
    logger.info("Secreto de 160 bits generado y cifrado con %s vía %s", encrypted["alg"], vault.name)
    return {"secret": secret, "encrypted": encrypted}


@task(name="store_pending_configuration", cache_policy=NO_CACHE)
def store_pending_configuration(user: dict, generated: dict) -> dict:
    logger = get_run_logger()
    db.save_pending_mfa(user["user_id"], generated["encrypted"])
    logger.info("Supabase guarda solo el secreto CIFRADO · estado → PENDING_VERIFICATION")
    return {**user, "secret": generated["secret"]}


@task(name="build_provisioning_uri", cache_policy=NO_CACHE)
def build_provisioning_uri(pending: dict) -> dict:
    uri = totp.provisioning_uri(pending["secret"], pending["username"], settings.issuer)
    get_run_logger().info("URI otpauth:// lista para el QR")
    return {
        "status": "PENDING_VERIFICATION",
        "secret": pending["secret"],
        "otpauth_uri": uri,
        "issuer": settings.issuer,
        "account_name": pending["username"],
    }


@flow(name="provision_mfa_flow")
def provision_mfa_flow(user_id: str, username: str) -> dict:
    user = {"user_id": user_id, "username": username}
    generated = generate_encrypted_secret()
    pending = store_pending_configuration(user, generated)
    return build_provisioning_uri(pending)


@task(name="verify_first_code", cache_policy=NO_CACHE)
def verify_first_code(user: dict, code: SecretStr) -> dict:
    logger = get_run_logger()
    config = db.get_mfa_config(user["user_id"])
    if not config or config["status"] != "PENDING_VERIFICATION":
        raise InvalidSecondFactor("No hay un 2FA pendiente de verificación. Pulsa 'Activar 2FA' primero.")

    value = code.get_secret_value().strip()
    window = totp.verify_totp(vault.decrypt(config["secret_ciphertext"]), value)
    if window is None:
        raise InvalidSecondFactor("Código inválido. Revisa que la hora de tu iPhone sea automática.")

    # El código de confirmación también queda quemado: no sirve para el verify-2fa.
    replay_cache.mark_used(user["user_id"], value)
    logger.info("Primer código válido (ventana %s): el QR quedó bien guardado", totp.WINDOW_LABELS[window])
    return user


@task(name="activate_configuration", cache_policy=NO_CACHE)
def activate_configuration(user: dict) -> dict:
    db.activate_mfa(user["user_id"])
    get_run_logger().info("Estado del 2FA: PENDING_VERIFICATION → ACTIVE")
    return user


@task(name="generate_backup_codes", cache_policy=NO_CACHE)
def generate_backup_codes(user: dict) -> list[str]:
    codes, hashes = new_backup_codes()
    db.replace_backup_codes(user["user_id"], hashes)
    get_run_logger().info("%d códigos de respaldo generados · Supabase guarda solo su hash Argon2", len(codes))
    return codes


@flow(name="confirm_mfa_flow")
def confirm_mfa_flow(user_id: str, username: str, code: SecretStr) -> dict:
    user = {"user_id": user_id, "username": username}
    verified = verify_first_code(user, code)
    active = activate_configuration(verified)
    codes = generate_backup_codes(active)
    return {"status": "ACTIVE", "backup_codes": codes}
