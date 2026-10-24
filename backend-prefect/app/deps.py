"""Dependencias de FastAPI: exigir un Bearer token con el scope correcto."""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.security import InvalidToken, decode_token

_bearer = HTTPBearer(auto_error=False)


def require_scope(scope: str):
    def dependency(credentials: HTTPAuthorizationCredentials | None = Depends(_bearer)) -> dict:
        if credentials is None:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Falta el header Authorization: Bearer <token>.")
        try:
            return decode_token(credentials.credentials, scope)
        except InvalidToken as exc:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, str(exc)) from exc

    return dependency
