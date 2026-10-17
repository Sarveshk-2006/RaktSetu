"""
RAKTSETU - Authentication & Role-Based Access Control (RBAC) Dependencies
Enforces authentication, role checks, and server-side actor attribution.
Never trusts client-supplied actor strings or roles.
"""

from typing import Optional, List, Callable
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import jwt

from app.core.database import get_db
from app.core.config import settings
from app.core.security import decode_access_token, is_account_locked
from app.models.db_models import User, UserRole

bearer_security = HTTPBearer(auto_error=False)


def get_current_user(
    auth: Optional[HTTPAuthorizationCredentials] = Security(bearer_security),
    db: Session = Depends(get_db),
) -> User:
    """
    Validates JWT Bearer token and retrieves authenticated User from persistence.
    If no token is supplied:
      - In strict mode (settings.AUTH_STRICT=True): raises HTTP 401.
      - In demo/test mode (settings.AUTH_STRICT=False): provides a fallback operational user
        to maintain backward compatibility with preexisting test suites.
    """
    if auth and auth.credentials:
        token = auth.credentials
        try:
            payload = decode_access_token(token)
            username = payload.get("sub")
            if not username:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token claims: subject missing",
                    headers={"WWW-Authenticate": "Bearer"},
                )

            # Check account lockout status
            locked, mins = is_account_locked(username)
            if locked:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Account is temporarily locked due to repeated failed logins. Try again in {mins} minutes.",
                )

            user = db.query(User).filter(User.username == username, User.is_active == True).first()
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User account no longer exists or is disabled",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            return user
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication token has expired. Please log in again.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except jwt.InvalidTokenError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid authentication token: {str(e)}",
                headers={"WWW-Authenticate": "Bearer"},
            )

    # No token provided
    if settings.AUTH_STRICT or settings.ENVIRONMENT.lower() in ["production", "prod"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials required. Fallback authentication is forbidden in production.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # In demo/test mode without Authorization header, fall back to default admin context
    # to maintain backward compatibility with preexisting test suites.
    fallback_user = db.query(User).filter(User.username == "admin").first()
    if fallback_user:
        return fallback_user

    # Ephemeral dev session if DB unseeded
    return User(
        id=9999,
        username="admin.central",
        email="admin@raktsetu.internal",
        hashed_password="ephemeral_dev",
        role=UserRole.ADMIN,
        full_name="Central Node Administrator",
        is_active=True,
    )


def get_current_user_strict(
    auth: Optional[HTTPAuthorizationCredentials] = Security(bearer_security),
    db: Session = Depends(get_db),
) -> User:
    """
    Enforces that a valid Bearer token MUST be present, raising 401 if missing.
    """
    if not auth or not auth.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please provide a valid Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return get_current_user(auth=auth, db=db)


def require_roles(*allowed_roles: str) -> Callable:
    """
    FastAPI dependency factory enforcing that current_user has one of the allowed_roles.
    Raises HTTP 403 Forbidden on role mismatch.
    """
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: role '{current_user.role}' lacks permission for this operation. Allowed roles: {list(allowed_roles)}",
            )
        return current_user

    return role_checker
