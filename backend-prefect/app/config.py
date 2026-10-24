"""Configuración del backend leída de variables de entorno (.env).

Ningún valor secreto vive en el código: si falta algo, el backend no arranca
y te dice qué variable revisar.
"""

import os
from dataclasses import dataclass


def _required(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"Falta la variable {name} en backend-prefect/.env (guíate por .env.example).")
    return value


def _optional(name: str) -> str | None:
    return os.getenv(name, "").strip() or None


@dataclass(frozen=True)
class Settings:
    # Cadena de conexión a PostgreSQL (Supabase → Connect → Session pooler).
    database_url: str
    jwt_secret: str
    # Uno de los dos: el contenedor secret-service, o la llave para cifrar en modo local (plan B).
    secret_service_url: str | None
    mlkem_private_key: str | None
    web_origin: str
    issuer: str = "Boveda 2FA"
    pre_auth_ttl_seconds: int = 300  # 5 min para escribir el código
    access_ttl_seconds: int = 900  # 15 min de sesión elevada
    prefect_ui_url: str = "http://127.0.0.1:4200"


settings = Settings(
    database_url=_required("DATABASE_URL"),
    jwt_secret=_required("JWT_SECRET"),
    secret_service_url=(_optional("SECRET_SERVICE_URL") or "").rstrip("/") or None,
    mlkem_private_key=_optional("MLKEM_PRIVATE_KEY"),
    web_origin=_optional("WEB_ORIGIN") or "http://localhost:5173",
)
