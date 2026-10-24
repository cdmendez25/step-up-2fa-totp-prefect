"""Patrón Strategy para el segundo factor.

El flow no sabe CÓMO se valida el código: le pide a la estrategia elegida que lo
haga. Agregar un tercer factor (por ejemplo, una llave física) sería otra clase,
sin tocar el flow.
"""

import secrets
from abc import ABC, abstractmethod
from dataclasses import dataclass

from app import db, totp
from app.security import hash_secret, verify_secret
from app.vault import vault

BACKUP_CODE_COUNT = 8
# Sin caracteres que se confunden al leerlos (0/O, 1/I/L).
_BACKUP_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"


@dataclass
class VerificationResult:
    ok: bool
    detail: str
    window: int | None = None  # solo TOTP: -1, 0 o +1
    backup_code_id: str | None = None  # solo respaldo: cuál consumir


class SecondFactorStrategy(ABC):
    name: str
    amr: str  # cómo queda registrado en el access_token

    @abstractmethod
    def verify(self, user_id: str, code: str) -> VerificationResult: ...


class TOTPStrategy(SecondFactorStrategy):
    name = "TOTPStrategy"
    amr = "pwd+totp"

    def verify(self, user_id: str, code: str) -> VerificationResult:
        config = db.get_mfa_config(user_id)
        secret = vault.decrypt(config["secret_ciphertext"])
        window = totp.verify_totp(secret, code.strip())
        if window is None:
            return VerificationResult(False, "Código TOTP inválido para las ventanas C-1, C y C+1.")
        label = totp.WINDOW_LABELS[window]
        return VerificationResult(True, f"TOTPStrategy → match en ventana {label}", window=window)


class BackupCodeStrategy(SecondFactorStrategy):
    name = "BackupCodeStrategy"
    amr = "pwd+backup"

    def verify(self, user_id: str, code: str) -> VerificationResult:
        candidate = normalize_backup_code(code)
        for row in db.unused_backup_codes(user_id):
            if verify_secret(row["code_hash"], candidate):
                return VerificationResult(True, "BackupCodeStrategy → código de respaldo válido", backup_code_id=row["id"])
        return VerificationResult(False, "Código de respaldo inválido o ya usado.")


def strategy_for(factor: str) -> SecondFactorStrategy:
    return BackupCodeStrategy() if factor == "backup" else TOTPStrategy()


def normalize_backup_code(code: str) -> str:
    return code.strip().upper().replace(" ", "")


def new_backup_codes() -> tuple[list[str], list[str]]:
    """Genera los códigos (se muestran UNA vez) y sus hashes (lo único que se guarda)."""
    codes = [
        "".join(secrets.choice(_BACKUP_ALPHABET) for _ in range(4))
        + "-"
        + "".join(secrets.choice(_BACKUP_ALPHABET) for _ in range(4))
        for _ in range(BACKUP_CODE_COUNT)
    ]
    return codes, [hash_secret(code) for code in codes]
