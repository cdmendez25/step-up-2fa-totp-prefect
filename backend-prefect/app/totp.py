"""TOTP (RFC 6238) implementado desde cero.

Solo usa la librería estándar: `base64` para Base32 y `hmac`/`hashlib` para
HMAC-SHA1, como permite la guía. Ninguna librería que entregue el código hecho.

    código = Truncar( HMAC-SHA1( secreto, floor(tiempo_unix / 30) ) )
"""

import base64
import hashlib
import hmac
import secrets
import struct
import time
from urllib.parse import quote, urlencode

PERIOD = 30
DIGITS = 6
# Orden en que se prueban las ventanas: primero la actual (C), luego C-1 y C+1.
WINDOWS = (0, -1, 1)
WINDOW_LABELS = {-1: "C-1", 0: "C", 1: "C+1"}


def generate_secret(num_bytes: int = 20) -> str:
    """20 bytes aleatorios (160 bits, lo que recomienda el RFC 4226) en Base32."""
    return base64.b32encode(secrets.token_bytes(num_bytes)).decode().rstrip("=")


def decode_base32(secret_b32: str) -> bytes:
    """Base32 → bytes. Acepta espacios, minúsculas y secretos sin el relleno '='."""
    cleaned = secret_b32.replace(" ", "").upper()
    padding = "=" * (-len(cleaned) % 8)
    return base64.b32decode(cleaned + padding)


def counter_at(unix_time: float) -> int:
    """Número de la ventana de 30 s en la que cae ese instante."""
    return int(unix_time // PERIOD)


def hotp(key: bytes, counter: int, digits: int = DIGITS) -> str:
    """HOTP (RFC 4226): el corazón del algoritmo."""
    message = struct.pack(">Q", counter)  # 8 bytes big-endian
    digest = hmac.new(key, message, hashlib.sha1).digest()  # 20 bytes

    # Truncamiento dinámico: los últimos 4 bits del hash dicen desde dónde leer.
    offset = digest[-1] & 0x0F
    # 4 bytes desde el offset, con el bit más alto apagado (número positivo de 31 bits).
    number = struct.unpack(">I", digest[offset : offset + 4])[0] & 0x7FFFFFFF

    return str(number % 10**digits).zfill(digits)


def generate_totp(secret_b32: str, unix_time: float | None = None, digits: int = DIGITS) -> str:
    now = time.time() if unix_time is None else unix_time
    return hotp(decode_base32(secret_b32), counter_at(now), digits)


def verify_totp(secret_b32: str, code: str, unix_time: float | None = None) -> int | None:
    """Devuelve la ventana que hizo match (-1, 0 o +1), o None si el código no sirve.

    Aceptar C-1 y C+1 tolera relojes adelantados o atrasados hasta ~30 s.
    """
    now = time.time() if unix_time is None else unix_time
    key = decode_base32(secret_b32)
    counter = counter_at(now)
    for window in WINDOWS:
        # compare_digest compara en tiempo constante (evita ataques de tiempo).
        if hmac.compare_digest(hotp(key, counter + window), code):
            return window
    return None


def provisioning_uri(secret_b32: str, account_name: str, issuer: str) -> str:
    """La URI que va dentro del QR: otpauth://totp/Emisor:cuenta?secret=...&issuer=..."""
    label = quote(f"{issuer}:{account_name}")
    # quote_via=quote: el espacio va como %20. Con el "+" por defecto, las apps
    # Authenticator mostraban "Boveda+2FA" en vez de "Boveda 2FA".
    params = urlencode(
        {"secret": secret_b32, "issuer": issuer, "algorithm": "SHA1", "digits": DIGITS, "period": PERIOD},
        quote_via=quote,
    )
    return f"otpauth://totp/{label}?{params}"
