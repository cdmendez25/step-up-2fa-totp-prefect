"""API Step-Up 2FA (TOTP) + Prefect.

    uv run uvicorn app.main:app --reload --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes import auth, mfa, vault_api
from app.vault import vault

app = FastAPI(title="Step-Up 2FA (TOTP) + Prefect", version="1.0.0")

# Solo tu web puede llamar a la API desde el navegador.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.web_origin],
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth.router)
app.include_router(mfa.router)
app.include_router(vault_api.router)


@app.get("/health", tags=["health"])
def health() -> dict:
    return {"ok": True, "secret_vault": vault.name}
