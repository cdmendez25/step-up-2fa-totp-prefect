"""Contraseñas (Argon2) y tokens JWT con alcance (scope) para el Step-Up.

    pre_auth_token  → scope mfa:setup  (2FA aún no activo: solo puede configurarlo)
                    → scope mfa:verify (2FA activo: solo puede llamar /auth/verify-2fa)
    access_token    → scope vault:read + mfa_verified: true (entra a la bóveda)
"""

import time
import uuid

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError

from app.config import settings

ALGORITHM = "HS256"
SCOPE_MFA_SETUP = "mfa:setup"
SCOPE_MFA_VERIFY = "mfa:verify"
SCOPE_VAULT = "vault:read"

_hasher = PasswordHasher()


class InvalidToken(Exception):
    pass


def hash_secret(value: str) -> str:
    """Argon2: lento a propósito, para que adivinar por fuerza bruta sea caro."""
    return _hasher.hash(value)


def verify_secret(hashed: str, value: str) -> bool:
    try:
        return _hasher.verify(hashed, value)
    except (VerificationError, InvalidHashError):
        return False


def _issue(claims: dict, ttl_seconds: int) -> str:
    now = int(time.time())
    payload = {**claims, "iat": now, "exp": now + ttl_seconds, "jti": uuid.uuid4().hex}
    return jwt.encode(payload, settings.jwt_secret, algorithm=ALGORITHM)


def issue_pre_auth_token(user_id: str, username: str, scope: str) -> str:
    claims = {"sub": user_id, "username": username, "type": "pre_auth", "scope": scope, "mfa_verified": False}
    return _issue(claims, settings.pre_auth_ttl_seconds)


def issue_access_token(user_id: str, username: str, amr: str) -> str:
    claims = {
        "sub": user_id,
        "username": username,
        "type": "access",
        "scope": SCOPE_VAULT,
        "mfa_verified": True,
        "amr": amr,  # cómo se autenticó: "pwd+totp" o "pwd+backup"
    }
    return _issue(claims, settings.access_ttl_seconds)


def decode_token(token: str, required_scope: str) -> dict:
    """Valida firma y expiración, y que el token sea del tipo justo para esta operación."""
    try:
        claims = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[ALGORITHM],
            options={"require": ["exp", "iat", "sub", "scope"]},
        )
    except jwt.ExpiredSignatureError as exc:
        raise InvalidToken("El token expiró. Vuelve a iniciar sesión.") from exc
    except jwt.InvalidTokenError as exc:
        raise InvalidToken("Token inválido.") from exc
    if claims["scope"] != required_scope:
        raise InvalidToken(f"Este token no sirve para esta operación (se requiere scope {required_scope}).")
    return claims
