"""SecretVault: quién genera y descifra el secreto TOTP (patrón Ports & Adapters).

    RemoteSecretVault → llama al contenedor secret-service (imagen en ECR).
                        La llave privada ML-KEM vive SOLO en el contenedor.
    LocalSecretVault  → mismo cifrado, pero dentro del backend. Plan B si Docker falla.

Las dos usan la MISMA llave (MLKEM_PRIVATE_KEY), así que puedes cambiar de una a
otra sin que los usuarios tengan que volver a escanear el QR.
"""

from typing import Protocol

import httpx

from app import pqc, totp
from app.config import settings


class SecretVault(Protocol):
    name: str

    def generate(self) -> tuple[str, dict]:
        """Devuelve (secreto en Base32, paquete cifrado para guardar en la base)."""
        ...

    def decrypt(self, encrypted: dict) -> str: ...


class LocalSecretVault:
    name = "local (dentro del backend)"

    def __init__(self, private_key_b64: str) -> None:
        self._key = pqc.load_private_key(private_key_b64)

    def generate(self) -> tuple[str, dict]:
        secret = totp.generate_secret()
        return secret, pqc.encrypt(self._key, secret.encode())

    def decrypt(self, encrypted: dict) -> str:
        return pqc.decrypt(self._key, encrypted).decode()


class RemoteSecretVault:
    name = "secret-service (contenedor)"

    def __init__(self, base_url: str) -> None:
        self._http = httpx.Client(base_url=base_url, timeout=5)

    def generate(self) -> tuple[str, dict]:
        response = self._http.post("/secrets")
        response.raise_for_status()
        data = response.json()
        return data["secret_b32"], data["encrypted"]

    def decrypt(self, encrypted: dict) -> str:
        response = self._http.post("/secrets/decrypt", json=encrypted)
        response.raise_for_status()
        return response.json()["secret_b32"]


def _build_vault() -> SecretVault:
    if settings.secret_service_url:
        return RemoteSecretVault(settings.secret_service_url)
    if settings.mlkem_private_key:
        return LocalSecretVault(settings.mlkem_private_key)
    raise RuntimeError("Configura SECRET_SERVICE_URL (contenedor) o MLKEM_PRIVATE_KEY (modo local) en el .env.")


vault: SecretVault = _build_vault()
