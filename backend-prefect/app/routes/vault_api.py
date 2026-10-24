"""La ruta protegida: solo entra un access_token con mfa_verified: true."""

from fastapi import APIRouter, Depends, HTTPException, status

from app.deps import require_scope
from app.security import SCOPE_VAULT

router = APIRouter(prefix="/api", tags=["vault"])

SECRET_MESSAGE = (
    "Si estás leyendo esto, pasaste por los dos factores: algo que sabes (tu contraseña) "
    "y algo que tienes (tu teléfono)."
)


@router.get("/boveda-secreta")
def secret_vault(claims: dict = Depends(require_scope(SCOPE_VAULT))) -> dict:
    if claims.get("mfa_verified") is not True:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Esta ruta exige un access_token con mfa_verified: true.")
    public_claims = {k: claims[k] for k in ("sub", "username", "mfa_verified", "amr", "iat", "exp")}
    return {"message": SECRET_MESSAGE, "claims": public_claims}
