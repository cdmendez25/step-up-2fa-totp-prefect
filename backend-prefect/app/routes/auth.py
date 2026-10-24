"""Registro, login (paso 1 del Step-Up) y verificación del segundo factor (paso 2)."""

from typing import Literal

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field, SecretStr

from app import db
from app.config import settings
from app.flows import VERIFY_TASKS, failed_task_index, verify_2fa_flow
from app.security import (
    SCOPE_MFA_SETUP,
    SCOPE_MFA_VERIFY,
    hash_secret,
    issue_pre_auth_token,
    verify_secret,
)

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=40, pattern=r"^[a-zA-Z0-9_.-]+$")
    email: str = Field(min_length=5, max_length=120, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    username: str
    password: str


class VerifyRequest(BaseModel):
    pre_auth_token: str
    code: str = Field(min_length=6, max_length=12)
    factor: Literal["totp", "backup"] = "totp"


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest) -> dict:
    try:
        user = db.create_user(body.username, body.email.lower(), hash_secret(body.password))
    except db.DatabaseError as exc:
        if exc.status_code == status.HTTP_409_CONFLICT:
            raise HTTPException(status.HTTP_409_CONFLICT, "Ese usuario o correo ya existe.") from exc
        raise
    return {"id": user["id"], "username": user["username"]}


@router.post("/login")
def login(body: LoginRequest) -> dict:
    """Paso 1: usuario y contraseña. NO da acceso a la bóveda, solo un pre_auth_token."""
    user = db.find_user(body.username.strip())
    if not user or not verify_secret(user["password_hash"], body.password):
        # Mismo mensaje en ambos casos: no revela si el usuario existe.
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Usuario o contraseña incorrectos.")

    config = db.get_mfa_config(user["id"])
    mfa_status = config["status"] if config else "NONE"
    scope = SCOPE_MFA_VERIFY if mfa_status == "ACTIVE" else SCOPE_MFA_SETUP
    return {
        "pre_auth_token": issue_pre_auth_token(user["id"], user["username"], scope),
        "token_type": "bearer",
        "scope": scope,
        "mfa_status": mfa_status,
        "expires_in": settings.pre_auth_ttl_seconds,
        "username": user["username"],
    }


def _pipeline(failed_index: int | None) -> list[dict]:
    """Estado de cada task para que la web pinte el PipelinePanel."""
    tasks = []
    for index, name in enumerate(VERIFY_TASKS):
        if failed_index is None or index < failed_index:
            state = "completed"
        elif index == failed_index:
            state = "failed"
        else:
            state = "skipped"
        tasks.append({"name": name, "state": state})
    return tasks


@router.post("/verify-2fa")
def verify_2fa(body: VerifyRequest) -> dict:
    """Paso 2: ejecuta el flow de Prefect con las 4 tasks observables."""
    state = verify_2fa_flow(
        SecretStr(body.pre_auth_token), SecretStr(body.code), body.factor, return_state=True
    )
    flow_run_id = str(state.state_details.flow_run_id)
    prefect_url = f"{settings.prefect_ui_url}/runs/flow-run/{flow_run_id}"

    if state.is_completed():
        result = state.result()
        pipeline = _pipeline(None)
        pipeline[2]["detail"] = result["detail"]
        return {
            "access_token": result["access_token"],
            "token_type": "bearer",
            "matched_window": result["window"],
            "flow_run_id": flow_run_id,
            "prefect_url": prefect_url,
            "pipeline": pipeline,
        }

    error = state.result(raise_on_failure=False)
    failed_index = failed_task_index(error)
    pipeline = _pipeline(failed_index)
    if failed_index is not None:
        pipeline[failed_index]["detail"] = f"{type(error).__name__}: {error}"
    raise HTTPException(
        status.HTTP_401_UNAUTHORIZED,
        {
            "message": str(error),
            "error": type(error).__name__,
            "flow_run_id": flow_run_id,
            "prefect_url": prefect_url,
            "pipeline": pipeline,
        },
    )
