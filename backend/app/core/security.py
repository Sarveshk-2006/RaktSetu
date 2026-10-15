"""
RAKTSETU - Security & Cryptographic Utilities
Implements password hashing (PBKDF2-HMAC-SHA256 with 100,000 iterations),
JWT token issuance and decoding, and in-memory brute force protection.
Zero plaintext passwords, zero hardcoded credentials.
"""

import hashlib
import hmac
import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, Tuple
import jwt

from app.core.config import settings

# In-memory failed login tracking for brute-force rate-limiting
# Maps username -> (failed_count, locked_until_datetime)
_LOGIN_ATTEMPTS: Dict[str, Tuple[int, Optional[datetime]]] = {}
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_MINUTES = 15


def hash_password(password: str) -> str:
    """
    Hashes a password using PBKDF2-HMAC-SHA256 with a 16-byte cryptographically secure salt.
    Format: pbkdf2_sha256$100000$<salt_hex>$<hash_hex>
    """
    salt = os.urandom(16)
    iterations = 100_000
    derived = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
    return f"pbkdf2_sha256${iterations}${salt.hex()}${derived.hex()}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plain-text password against a hashed password using constant-time comparison.
    """
    try:
        parts = hashed_password.split("$")
        if len(parts) != 4 or parts[0] != "pbkdf2_sha256":
            return False
        iterations = int(parts[1])
        salt = bytes.fromhex(parts[2])
        expected_hash = bytes.fromhex(parts[3])

        computed_hash = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt, iterations)
        return hmac.compare_digest(computed_hash, expected_hash)
    except Exception:
        return False


def create_access_token(
    subject: str,
    role: str,
    full_name: str,
    organisation_id: Optional[int] = None,
    expires_delta: Optional[timedelta] = None,
    expires_minutes: Optional[int] = None,
) -> str:
    """
    Generates a cryptographically signed JWT access token.
    """
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    elif expires_minutes:
        expire = now + timedelta(minutes=expires_minutes)
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    payload = {
        "sub": subject,
        "role": role,
        "full_name": full_name,
        "name": full_name,
        "org_id": organisation_id,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "iss": "raktsetu-auth",
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> Dict[str, Any]:
    """
    Decodes and validates a JWT access token.
    Raises jwt.ExpiredSignatureError or jwt.InvalidTokenError on failure.
    """
    return jwt.decode(
        token,
        settings.SECRET_KEY,
        algorithms=[settings.ALGORITHM],
        issuer="raktsetu-auth",
        options={"require": ["exp", "sub", "role"]},
    )


def record_failed_login(username: str) -> bool:
    """
    Records a failed login attempt. Returns True if account is now locked.
    """
    now = datetime.now(timezone.utc)
    count, locked_until = _LOGIN_ATTEMPTS.get(username, (0, None))

    if locked_until and locked_until > now:
        return True

    count += 1
    if count >= MAX_FAILED_ATTEMPTS:
        locked_until = now + timedelta(minutes=LOCKOUT_MINUTES)
        _LOGIN_ATTEMPTS[username] = (count, locked_until)
        return True

    _LOGIN_ATTEMPTS[username] = (count, None)
    return False


def is_account_locked(username: str) -> Tuple[bool, Optional[int]]:
    """
    Checks if an account is locked due to repeated failed login attempts.
    Returns (is_locked, remaining_minutes).
    """
    now = datetime.now(timezone.utc)
    count, locked_until = _LOGIN_ATTEMPTS.get(username, (0, None))

    if locked_until and locked_until > now:
        remaining = int((locked_until - now).total_seconds() / 60) + 1
        return True, remaining

    # Clear lockout if expired
    if locked_until and locked_until <= now:
        _LOGIN_ATTEMPTS.pop(username, None)

    return False, None


def clear_failed_login(username: str) -> None:
    """Clears failed login attempt counter upon successful authentication."""
    _LOGIN_ATTEMPTS.pop(username, None)
