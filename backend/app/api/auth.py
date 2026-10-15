"""
RAKTSETU API — Authentication & Identity Router
Handles secure login, token issuance, session verification, and role inspection.
Includes brute-force prevention and audit logging of security-relevant events.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    record_failed_login,
    is_account_locked,
    clear_failed_login,
)
from app.core.auth import get_current_user, get_current_user_strict, require_roles
from app.models.db_models import User, UserRole, Organisation
from app.services.audit import log_audit_event

router = APIRouter()


# ─── Pydantic Request / Response Schemas ──────────────────────────────────────

class LoginRequest(BaseModel):
    username: str = Field(..., min_length=2, max_length=64)
    password: str = Field(..., min_length=6)


class UserProfileResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    role: str
    organisation_id: Optional[int]
    is_active: bool


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfileResponse


class RegisterUserRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=64)
    email: str = Field(..., min_length=5, max_length=128)
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=2, max_length=128)
    role: str = Field(..., description="Role must be one of UserRole.ALL_ROLES")
    organisation_id: Optional[int] = None


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticates a platform user.
    Enforces brute force protection: locks account after 5 consecutive failures.
    Issues a cryptographically signed JWT token upon success.
    """
    username = payload.username.strip().lower()

    # 1. Check account lockout status
    locked, remaining_minutes = is_account_locked(username)
    if locked:
        log_audit_event(
            db=db,
            actor=username,
            actor_type="Unauthenticated",
            category="Security",
            action="LOGIN_BLOCKED_LOCKOUT",
            entity_type="User",
            entity_id=username,
            outcome="Failure",
            safe_metadata={"reason": "Account locked due to excessive failed attempts"},
        )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account is temporarily locked due to repeated failed logins. Try again in {remaining_minutes} minutes.",
        )

    # 2. Query user from database
    user = db.query(User).filter(User.username == username).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        is_now_locked = record_failed_login(username)
        log_audit_event(
            db=db,
            actor=username,
            actor_type="Unauthenticated",
            category="Security",
            action="LOGIN_FAILED",
            entity_type="User",
            entity_id=username,
            outcome="Failure",
            safe_metadata={"locked": is_now_locked},
        )
        db.commit()

        detail = "Invalid username or password"
        if is_now_locked:
            detail = "Invalid credentials. Account is now locked for 15 minutes due to too many failed attempts."

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Contact platform administrator.",
        )

    # 3. Successful authentication: clear failure count & record audit
    clear_failed_login(username)
    token = create_access_token(
        subject=user.username,
        role=user.role,
        full_name=user.full_name,
        organisation_id=user.organisation_id,
    )

    log_audit_event(
        db=db,
        actor=user.full_name,
        actor_type=user.role,
        category="Security",
        action="LOGIN_SUCCESS",
        entity_type="User",
        entity_id=user.username,
        outcome="Success",
        safe_metadata={"role": user.role, "org_id": user.organisation_id},
    )
    db.commit()

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserProfileResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            organisation_id=user.organisation_id,
            is_active=user.is_active,
        ),
    )


@router.get("/me", response_model=UserProfileResponse)
async def get_me(current_user: User = Depends(get_current_user_strict)):
    """
    Returns authenticated user profile from verified token.
    Strictly requires authentication.
    """
    return UserProfileResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        organisation_id=current_user.organisation_id,
        is_active=current_user.is_active,
    )


@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Logs user logout event in audit ledger.
    """
    log_audit_event(
        db=db,
        actor=current_user.full_name or current_user.username,
        actor_type=current_user.role,
        category="Security",
        action="LOGOUT",
        entity_type="User",
        entity_id=current_user.username,
        outcome="Success",
    )
    db.commit()
    return {"status": "logged_out", "message": "Session terminated successfully"}


@router.get("/roles")
async def list_roles():
    """
    Returns defined platform roles and their authorization capabilities.
    """
    return {
        "roles": [
            {
                "role": UserRole.ADMIN,
                "title": "Platform Administrator",
                "permissions": ["all_access", "user_management", "audit_verification", "incident_override"],
            },
            {
                "role": UserRole.HOSPITAL_OPERATOR,
                "title": "Hospital / Blood-Bank Clinical Operator",
                "permissions": ["create_incident", "clinical_verification", "confirm_fulfilment", "close_incident"],
            },
            {
                "role": UserRole.INCIDENT_OPERATOR,
                "title": "Authorised Incident & Mobilisation Operator",
                "permissions": ["launch_waves", "advance_waves", "record_responses", "cancel_incident"],
            },
            {
                "role": UserRole.ORG_COORDINATOR,
                "title": "Verified Organisation Coordinator",
                "permissions": ["view_partner_capacity", "manage_org_donors", "view_active_demands"],
            },
            {
                "role": UserRole.AUDITOR,
                "title": "Read-Only Compliance Auditor",
                "permissions": ["view_audit_trail", "verify_hash_chain", "view_incidents_read_only", "view_analytics"],
            },
        ]
    }


@router.post("/users", response_model=UserProfileResponse)
async def create_user(
    payload: RegisterUserRequest,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    """
    Creates a new operational user. Strictly restricted to Platform Administrators.
    """
    if payload.role not in UserRole.ALL_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role '{payload.role}'. Must be one of: {UserRole.ALL_ROLES}",
        )

    # Check username / email uniqueness
    existing = db.query(User).filter((User.username == payload.username.lower()) | (User.email == payload.email.lower())).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this username or email already exists",
        )

    new_user = User(
        username=payload.username.lower(),
        email=payload.email.lower(),
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        role=payload.role,
        organisation_id=payload.organisation_id,
        is_active=True,
    )
    db.add(new_user)
    db.flush()

    log_audit_event(
        db=db,
        actor=current_user.full_name,
        actor_type=current_user.role,
        category="Administration",
        action="CREATE_USER",
        entity_type="User",
        entity_id=new_user.username,
        outcome="Success",
        safe_metadata={"assigned_role": new_user.role},
    )
    db.commit()

    return UserProfileResponse(
        id=new_user.id,
        username=new_user.username,
        email=new_user.email,
        full_name=new_user.full_name,
        role=new_user.role,
        organisation_id=new_user.organisation_id,
        is_active=new_user.is_active,
    )
