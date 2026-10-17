"""
RAKTSETU - Administrative User Provisioning CLI
Allows authorized deployment operators to provision administrators and operators
without relying on insecure development seed accounts or hardcoded credentials.

Usage:
    python -m app.cli.create_admin --username ops.admin --email ops@raktsetu.org --role admin --full-name "Operations Administrator"
"""

import sys
import argparse
import getpass
import re
from app.core.database import SessionLocal
from app.models.db_models import User, UserRole
from app.core.security import hash_password
from app.services.audit import log_audit_event


def validate_password_strength(password: str) -> None:
    if len(password) < 12:
        raise ValueError("Password must be at least 12 characters long.")
    if not re.search(r"[A-Z]", password):
        raise ValueError("Password must contain at least one uppercase letter.")
    if not re.search(r"[a-z]", password):
        raise ValueError("Password must contain at least one lowercase letter.")
    if not re.search(r"\d", password):
        raise ValueError("Password must contain at least one digit.")
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        raise ValueError("Password must contain at least one special character.")


def main():
    parser = argparse.ArgumentParser(description="Provision an administrative user for RAKTSETU")
    parser.add_argument("--username", required=True, help="Unique username (e.g. coord.sharma)")
    parser.add_argument("--email", required=True, help="Email address of the user")
    parser.add_argument("--full-name", required=True, help="Full name of the user")
    parser.add_argument(
        "--role",
        default=UserRole.ADMIN,
        choices=UserRole.ALL_ROLES,
        help="RBAC Role to grant",
    )
    parser.add_argument("--password", help="Password (if not provided, will prompt interactively)")

    args = parser.parse_args()

    username = args.username.strip().lower()
    email = args.email.strip().lower()
    password = args.password

    if not password:
        password = getpass.getpass(f"Enter password for {username}: ")
        confirm = getpass.getpass("Confirm password: ")
        if password != confirm:
            print("ERROR: Passwords do not match.", file=sys.stderr)
            sys.exit(1)

    try:
        validate_password_strength(password)
    except ValueError as e:
        print(f"ERROR: {str(e)}", file=sys.stderr)
        sys.exit(1)

    db = SessionLocal()
    try:
        existing = db.query(User).filter((User.username == username) | (User.email == email)).first()
        if existing:
            print(f"User with username '{username}' or email '{email}' already exists. Updating credentials...", file=sys.stderr)
            existing.hashed_password = hash_password(password)
            existing.full_name = args.full_name
            existing.role = args.role
            existing.is_active = True
        else:
            new_user = User(
                username=username,
                email=email,
                full_name=args.full_name,
                role=args.role,
                hashed_password=hash_password(password),
                is_active=True,
            )
            db.add(new_user)

        log_audit_event(
            db=db,
            actor="CLI_PROVISIONER",
            actor_type="System",
            category="Security",
            action="AdminUserProvisioned",
            entity_type="User",
            entity_id=username,
            outcome="Success",
            safe_metadata={"role": args.role, "email": email},
        )
        db.commit()
        print(f"SUCCESS: User '{username}' provisioned with role '{args.role}'.")
    except Exception as e:
        db.rollback()
        print(f"ERROR: Failed to provision user: {str(e)}", file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
