"""secret-service: genera y custodia el secreto TOTP con cifrado post-cuántico.

La llave privada ML-KEM-768 entra por la variable MLKEM_PRIVATE_KEY al arrancar
el contenedor: nunca va dentro de la imagen y nunca sale de este proceso.

No tiene autenticación propia, así que solo debe exponerse en la red local
(127.0.0.1), nunca en internet.

    uvicorn main:app --host 0.0.0.0 --port 8001
"""

import base64
import os
import secrets

from cryptography.exceptions import InvalidTag
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel

import pqc


def _load_private_key():
    value = os.getenv("MLKEM_PRIVATE_KEY", "").strip()
    if not value:
        raise RuntimeError("Falta MLKEM_PRIVATE_KEY: pásala al correr el contenedor (docker run --env-file ...).")
    return pqc.load_private_key(value)


PRIVATE_KEY = _load_private_key()

app = FastAPI(title="secret-service", version="1.0.0")


class EncryptedSecret(BaseModel):
    alg: str
    kem_ciphertext: str
    nonce: str
    ciphertext: str


@app.get("/health")
def health() -> dict:
    return {"ok": True, "alg": pqc.ALG}


@app.post("/secrets")
def create_secret() -> dict:
    """Secreto TOTP nuevo (20 bytes = 160 bits, en Base32) y su versión cifrada."""
    secret = base64.b32encode(secrets.token_bytes(20)).decode().rstrip("=")
    return {"secret_b32": secret, "encrypted": pqc.encrypt(PRIVATE_KEY, secret.encode())}


@app.post("/secrets/decrypt")
def decrypt_secret(package: EncryptedSecret) -> dict:
    if package.alg != pqc.ALG:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Algoritmo no soportado: {package.alg}")
    try:
        secret = pqc.decrypt(PRIVATE_KEY, package.model_dump()).decode()
    except (InvalidTag, ValueError) as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Paquete cifrado inválido o alterado.") from exc
    return {"secret_b32": secret}
