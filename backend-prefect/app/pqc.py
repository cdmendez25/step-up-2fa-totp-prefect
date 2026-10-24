"""Cifrado híbrido post-cuántico para guardar el secreto TOTP en reposo.

    KEM  · ML-KEM-768 (FIPS 203): con la llave pública se "encapsula" una llave
           compartida de 32 bytes; solo la llave privada puede recuperarla.
    KDF  · HKDF-SHA256: convierte esa llave compartida en la llave de AES.
    DEM  · AES-256-GCM: cifra el secreto y detecta cualquier alteración.

Copia idéntica en secret-service/pqc.py. Si cambias una, cambia la otra.
"""

import base64
import os

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric.mlkem import MLKEM768PrivateKey
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.hkdf import HKDF

ALG = "ML-KEM-768+HKDF-SHA256+AES-256-GCM"
# Contexto que amarra la llave derivada a este uso concreto.
CONTEXT = b"step-up-2fa/totp-secret/v1"


def _b64(data: bytes) -> str:
    return base64.b64encode(data).decode()


def _unb64(data: str) -> bytes:
    return base64.b64decode(data)


def generate_private_key_b64() -> str:
    """Nueva llave privada ML-KEM-768, exportada como su semilla en Base64."""
    return _b64(MLKEM768PrivateKey.generate().private_bytes_raw())


def load_private_key(private_key_b64: str) -> MLKEM768PrivateKey:
    return MLKEM768PrivateKey.from_seed_bytes(_unb64(private_key_b64))


def _aes_key(shared_secret: bytes) -> bytes:
    return HKDF(algorithm=hashes.SHA256(), length=32, salt=None, info=CONTEXT).derive(shared_secret)


def encrypt(private_key: MLKEM768PrivateKey, plaintext: bytes) -> dict:
    shared_secret, kem_ciphertext = private_key.public_key().encapsulate()
    nonce = os.urandom(12)  # nunca se repite para la misma llave
    ciphertext = AESGCM(_aes_key(shared_secret)).encrypt(nonce, plaintext, CONTEXT)
    return {
        "alg": ALG,
        "kem_ciphertext": _b64(kem_ciphertext),
        "nonce": _b64(nonce),
        "ciphertext": _b64(ciphertext),
    }


def decrypt(private_key: MLKEM768PrivateKey, package: dict) -> bytes:
    """Lanza cryptography.exceptions.InvalidTag si el paquete fue alterado."""
    shared_secret = private_key.decapsulate(_unb64(package["kem_ciphertext"]))
    return AESGCM(_aes_key(shared_secret)).decrypt(
        _unb64(package["nonce"]), _unb64(package["ciphertext"]), CONTEXT
    )
