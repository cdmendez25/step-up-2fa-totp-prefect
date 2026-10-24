"""Recorre el flujo completo de la API con los flows reales de Prefect."""

import time

import pytest
from fastapi.testclient import TestClient

from app import totp


@pytest.fixture
def client(fake_db, prefect_server):
    from app.main import app

    return TestClient(app)


def _bearer(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def test_full_step_up_flow(client, fake_db):
    # --- Registro y login (paso 1) ---
    assert client.post("/auth/register", json={"username": "carlos", "email": "c@uni.edu", "password": "contrasena-larga"}).status_code == 201
    assert client.post("/auth/login", json={"username": "carlos", "password": "mala"}).status_code == 401

    login = client.post("/auth/login", json={"username": "carlos", "password": "contrasena-larga"}).json()
    assert login["mfa_status"] == "NONE" and login["scope"] == "mfa:setup"
    setup_token = login["pre_auth_token"]

    # Un pre_auth_token NUNCA abre la bóveda.
    assert client.get("/api/boveda-secreta", headers=_bearer(setup_token)).status_code == 401

    # --- Aprovisionamiento: NONE → PENDING_VERIFICATION ---
    setup = client.post("/mfa/setup", headers=_bearer(setup_token)).json()
    assert setup["status"] == "PENDING_VERIFICATION"
    assert setup["otpauth_uri"].startswith("otpauth://totp/")
    secret = setup["secret"]
    stored = fake_db.mfa[next(iter(fake_db.users))]["secret_ciphertext"]
    assert secret not in str(stored), "la base solo debe guardar el secreto CIFRADO"

    # --- Confirmación: PENDING_VERIFICATION → ACTIVE ---
    assert client.post("/mfa/confirm", headers=_bearer(setup_token), json={"code": "000000"}).status_code == 400
    confirm = client.post("/mfa/confirm", headers=_bearer(setup_token), json={"code": totp.generate_totp(secret)}).json()
    assert confirm["status"] == "ACTIVE"
    assert len(confirm["backup_codes"]) == 8
    verify_token = confirm["pre_auth_token"]

    # --- Paso 2: verify-2fa con el código de la ventana siguiente (C+1) ---
    next_code = totp.generate_totp(secret, time.time() + totp.PERIOD)
    ok = client.post("/auth/verify-2fa", json={"pre_auth_token": verify_token, "code": next_code})
    assert ok.status_code == 200, ok.text
    body = ok.json()
    assert body["matched_window"] == 1
    assert [t["state"] for t in body["pipeline"]] == ["completed"] * 4

    # --- Replay: el mismo código otra vez falla EXACTAMENTE en la task 2 ---
    replay = client.post("/auth/verify-2fa", json={"pre_auth_token": verify_token, "code": next_code})
    assert replay.status_code == 401
    detail = replay.json()["detail"]
    assert detail["error"] == "ReplayAttackDetected"
    assert [t["state"] for t in detail["pipeline"]] == ["completed", "failed", "skipped", "skipped"]

    # --- La bóveda con el access_token ---
    vault = client.get("/api/boveda-secreta", headers=_bearer(body["access_token"]))
    assert vault.status_code == 200
    assert vault.json()["claims"]["mfa_verified"] is True

    # --- Código de respaldo (BackupCodeStrategy) y su único uso ---
    login2 = client.post("/auth/login", json={"username": "carlos", "password": "contrasena-larga"}).json()
    assert login2["scope"] == "mfa:verify"
    backup = confirm["backup_codes"][0]
    used = client.post("/auth/verify-2fa", json={"pre_auth_token": login2["pre_auth_token"], "code": backup, "factor": "backup"})
    assert used.status_code == 200, used.text
    assert used.json()["matched_window"] is None
    assert len(fake_db.unused_backup_codes(next(iter(fake_db.users)))) == 7

    # --- Código inválido: falla en la task 3 ---
    wrong = client.post("/auth/verify-2fa", json={"pre_auth_token": login2["pre_auth_token"], "code": "123456"})
    assert wrong.status_code == 401
    assert wrong.json()["detail"]["error"] == "InvalidSecondFactor"
    assert [t["state"] for t in wrong.json()["detail"]["pipeline"]] == ["completed", "completed", "failed", "skipped"]
