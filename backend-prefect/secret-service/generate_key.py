"""Genera la llave privada ML-KEM-768 UNA sola vez.

    uv run python secret-service/generate_key.py

Copia la salida a MLKEM_PRIVATE_KEY en backend-prefect/.env. Si la pierdes,
ningún secreto TOTP guardado se puede volver a descifrar.
"""

import pqc

print(pqc.generate_private_key_b64())
