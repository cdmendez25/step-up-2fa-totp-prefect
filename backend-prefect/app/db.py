"""Acceso DIRECTO a PostgreSQL: Supabase es solo la base de datos.

El backend se conecta con psycopg al pooler de Supabase. La Data API (REST) de
Supabase está APAGADA, así que las tablas no están detrás de ninguna URL pública:
la única puerta a los datos es este backend.

Todas las consultas usan parámetros (%s), nunca texto concatenado: eso evita la
inyección SQL.
"""

import threading

import psycopg
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb
from psycopg_pool import ConnectionPool

from app.config import settings


class DatabaseError(Exception):
    def __init__(self, status_code: int, message: str) -> None:
        super().__init__(message)
        self.status_code = status_code


_pool = ConnectionPool(
    settings.database_url,
    min_size=1,
    max_size=5,
    open=False,  # se abre en la primera consulta, no al importar
    kwargs={"row_factory": dict_row, "autocommit": True, "prepare_threshold": None},
)
_open_lock = threading.Lock()
_is_open = False


def _connection():
    global _is_open
    if not _is_open:
        with _open_lock:
            if not _is_open:
                _pool.open(wait=True, timeout=15)
                _is_open = True
    return _pool.connection()


def _one(sql: str, params: tuple = ()) -> dict | None:
    with _connection() as conn:
        return conn.execute(sql, params).fetchone()


def _all(sql: str, params: tuple = ()) -> list[dict]:
    with _connection() as conn:
        return conn.execute(sql, params).fetchall()


def _run(sql: str, params: tuple = ()) -> None:
    with _connection() as conn:
        conn.execute(sql, params)


# ---------- Usuarios ----------

def create_user(username: str, email: str, password_hash: str) -> dict:
    try:
        return _one(
            "insert into users (username, email, password_hash) values (%s, %s, %s) "
            "returning id::text as id, username, email",
            (username, email, password_hash),
        )
    except psycopg.errors.UniqueViolation as exc:
        raise DatabaseError(409, "El usuario o el correo ya existen.") from exc


def find_user(identifier: str) -> dict | None:
    """Busca por correo si trae '@'; si no, por nombre de usuario."""
    # La columna sale de esta lista fija de dos opciones, nunca del texto del usuario.
    column = "email" if "@" in identifier else "username"
    return _one(
        f"select id::text as id, username, email, password_hash from users where {column} = %s",
        (identifier,),
    )


# ---------- Configuración del 2FA (máquina de estados) ----------

def get_mfa_config(user_id: str) -> dict | None:
    return _one(
        "select user_id::text as user_id, secret_ciphertext, status from mfa_config where user_id = %s",
        (user_id,),
    )


def save_pending_mfa(user_id: str, encrypted_secret: dict) -> None:
    """Crea (o reinicia) la configuración en PENDING_VERIFICATION con el secreto cifrado."""
    _run(
        "insert into mfa_config (user_id, secret_ciphertext, status) values (%s, %s, 'PENDING_VERIFICATION') "
        "on conflict (user_id) do update set secret_ciphertext = excluded.secret_ciphertext, "
        "status = 'PENDING_VERIFICATION', created_at = now(), activated_at = null",
        (user_id, Jsonb(encrypted_secret)),
    )


def activate_mfa(user_id: str) -> None:
    _run("update mfa_config set status = 'ACTIVE', activated_at = now() where user_id = %s", (user_id,))


# ---------- Códigos de respaldo (solo se guarda su hash) ----------

def replace_backup_codes(user_id: str, code_hashes: list[str]) -> None:
    with _connection() as conn, conn.transaction():
        conn.execute("delete from backup_codes where user_id = %s", (user_id,))
        with conn.cursor() as cursor:
            cursor.executemany(
                "insert into backup_codes (user_id, code_hash) values (%s, %s)",
                [(user_id, code_hash) for code_hash in code_hashes],
            )


def unused_backup_codes(user_id: str) -> list[dict]:
    return _all(
        "select id::text as id, code_hash from backup_codes where user_id = %s and used_at is null",
        (user_id,),
    )


def mark_backup_code_used(code_id: str) -> None:
    _run("update backup_codes set used_at = now() where id = %s", (code_id,))
