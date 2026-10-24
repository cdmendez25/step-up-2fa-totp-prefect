"""Configuración de pruebas: llaves falsas y una base de datos en memoria.

Nada aquí usa tus credenciales reales: las variables se pisan antes de que
app.config se importe.
"""

import os
import uuid

import pytest

from app.pqc import generate_private_key_b64

os.environ.update(
    {
        "DATABASE_URL": "postgresql://pruebas:pruebas@localhost:1/pruebas",
        "JWT_SECRET": "jwt-solo-para-pruebas-" + "x" * 40,
        "SECRET_SERVICE_URL": "",  # fuerza el modo local (LocalSecretVault)
        "MLKEM_PRIVATE_KEY": generate_private_key_b64(),
    }
)


class FakeDatabase:
    """Imita las funciones de app.db guardando todo en diccionarios."""

    def __init__(self) -> None:
        self.users: dict[str, dict] = {}
        self.mfa: dict[str, dict] = {}
        self.backup_codes: list[dict] = []

    def create_user(self, username, email, password_hash):
        from app.db import DatabaseError

        if any(u["username"] == username or u["email"] == email for u in self.users.values()):
            raise DatabaseError(409, "duplicate key")
        user = {"id": str(uuid.uuid4()), "username": username, "email": email, "password_hash": password_hash}
        self.users[user["id"]] = user
        return user

    def find_user(self, identifier):
        field = "email" if "@" in identifier else "username"
        return next((u for u in self.users.values() if u[field] == identifier), None)

    def get_mfa_config(self, user_id):
        config = self.mfa.get(user_id)
        return dict(config) if config else None

    def save_pending_mfa(self, user_id, encrypted_secret):
        self.mfa[user_id] = {"user_id": user_id, "secret_ciphertext": encrypted_secret, "status": "PENDING_VERIFICATION"}
        return self.mfa[user_id]

    def activate_mfa(self, user_id):
        self.mfa[user_id]["status"] = "ACTIVE"

    def replace_backup_codes(self, user_id, code_hashes):
        self.backup_codes = [c for c in self.backup_codes if c["user_id"] != user_id]
        self.backup_codes += [
            {"id": str(uuid.uuid4()), "user_id": user_id, "code_hash": h, "used_at": None} for h in code_hashes
        ]

    def unused_backup_codes(self, user_id):
        return [c for c in self.backup_codes if c["user_id"] == user_id and c["used_at"] is None]

    def mark_backup_code_used(self, code_id):
        next(c for c in self.backup_codes if c["id"] == code_id)["used_at"] = "now"


@pytest.fixture
def fake_db(monkeypatch):
    from app import db

    fake = FakeDatabase()
    for name in (
        "create_user",
        "find_user",
        "get_mfa_config",
        "save_pending_mfa",
        "activate_mfa",
        "replace_backup_codes",
        "unused_backup_codes",
        "mark_backup_code_used",
    ):
        monkeypatch.setattr(db, name, getattr(fake, name))
    return fake


@pytest.fixture(scope="session")
def prefect_server():
    """Servidor de Prefect temporal solo para las pruebas (no toca el tuyo)."""
    from prefect.testing.utilities import prefect_test_harness

    with prefect_test_harness():
        yield
