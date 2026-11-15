from __future__ import annotations

from typing import Annotated, Any

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import InvalidTokenError
from sqlmodel import select

from app.api.v1.dependencies.database import DatabaseSession
from app.config import settings
from app.db.models.user import User

bearer_scheme = HTTPBearer(auto_error=False)


def decode_access_token(token: str) -> dict[str, Any]:
    try:
        return jwt.decode(
            token,
            settings.auth_jwt_secret,
            algorithms=["HS256"],
            audience=settings.auth_audience,
            issuer=settings.auth_issuer,
        )
    except InvalidTokenError as error:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED) from error


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    db: DatabaseSession,
) -> User:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)

    claims = decode_access_token(credentials.credentials)

    subject = claims.get("sub")
    email = claims.get("email")
    name = claims.get("name")
    if not isinstance(subject, str) or not isinstance(email, str):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)

    user = db.exec(select(User).where(User.auth_id == subject)).one_or_none()
    if user is None:
        user = User(
            auth_id=subject,
            email=email,
            name=name if isinstance(name, str) else email,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
