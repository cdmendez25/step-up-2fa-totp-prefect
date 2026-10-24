"""Aprovisionamiento del 2FA: NONE → PENDING_VERIFICATION → ACTIVE."""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, SecretStr

from app import db
from app.config import settings
from app.deps import require_scope
from app.flows import confirm_mfa_flow, provision_mfa_flow
from app.security import SCOPE_MFA_SETUP, SCOPE_MFA_VERIFY, issue_pre_auth_token

router = APIRouter(prefix="/mfa", tags=["mfa"])
setup_scope = require_scope(SCOPE_MFA_SETUP)


class ConfirmRequest(BaseModel):
    code: str = Field(min_length=6, max_length=6)


def _prefect_url(state) -> str:
    return f"{settings.prefect_ui_url}/runs/flow-run/{state.state_details.flow_run_id}"


@router.get("/status")
def mfa_status(claims: dict = Depends(setup_scope)) -> dict:
    config = db.get_mfa_config(claims["sub"])
    return {"status": config["status"] if config else "NONE"}


@router.post("/setup")
def setup(claims: dict = Depends(setup_scope)) -> dict:
    """Genera el secreto (cifrado con ML-KEM) y la URI del QR. Estado → PENDING_VERIFICATION."""
    config = db.get_mfa_config(claims["sub"])
    if config and config["status"] == "ACTIVE":
        raise HTTPException(status.HTTP_409_CONFLICT, "El 2FA ya está activo.")

    state = provision_mfa_flow(claims["sub"], claims["username"], return_state=True)
    if not state.is_completed():
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, f"No se pudo generar el secreto: {state.result(raise_on_failure=False)}")
    return {**state.result(), "prefect_url": _prefect_url(state)}


@router.post("/confirm")
def confirm(body: ConfirmRequest, claims: dict = Depends(setup_scope)) -> dict:
    """Primer código válido → ACTIVE + códigos de respaldo + un pre_auth_token para el verify-2fa."""
    state = confirm_mfa_flow(claims["sub"], claims["username"], SecretStr(body.code), return_state=True)
    if not state.is_completed():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(state.result(raise_on_failure=False)))
    return {
        **state.result(),
        "pre_auth_token": issue_pre_auth_token(claims["sub"], claims["username"], SCOPE_MFA_VERIFY),
        "prefect_url": _prefect_url(state),
    }
