"""
PropInspect AI — Security utilities.
JWT creation/verification, password hashing, and FastAPI dependencies.
"""
import logging
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db

logger = logging.getLogger(__name__)

# ─── Password hashing ────────────────────────────────────────────────────────
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ─── Bearer token extractor ───────────────────────────────────────────────────
bearer_scheme = HTTPBearer(auto_error=False)


# ─── JWT helpers ─────────────────────────────────────────────────────────────

def create_access_token(
    data: dict,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Encode a JWT access token with an optional custom expiry."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta
        if expires_delta is not None
        else timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def verify_token(token: str) -> Optional[dict]:
    """
    Decode and validate a JWT token.
    Returns the payload dict, or None if the token is invalid/expired.
    """
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError as exc:
        logger.debug("Token verification failed: %s", exc)
        return None


# ─── Password helpers ─────────────────────────────────────────────────────────

def get_password_hash(password: str) -> str:
    """Return a bcrypt hash of the plain-text password."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain-text password against the stored bcrypt hash."""
    return pwd_context.verify(plain_password, hashed_password)


# ─── FastAPI dependency ───────────────────────────────────────────────────────

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    """
    FastAPI dependency that extracts and validates the Bearer JWT,
    then returns the corresponding User ORM instance.

    Raises HTTP 401 on missing/invalid token or unknown user.
    """
    # Lazy import to avoid circular imports
    from app.db.models import User  # noqa: PLC0415

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if credentials is None:
        raise credentials_exception

    payload = verify_token(credentials.credentials)
    if payload is None:
        raise credentials_exception

    user_id: Optional[str] = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account",
        )

    return user


def get_current_superuser(current_user=Depends(get_current_user)):
    """Dependency that enforces the caller is a superuser."""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    return current_user


# ─── Signed URL helper (S3/R2) ────────────────────────────────────────────────

def generate_signed_url(bucket: str, key: str, expiry: int = 3600) -> str:
    """
    Generate a pre-signed S3 GET URL for private object access.

    Falls back to a local placeholder URL when USE_LOCAL_STORAGE is True
    or when boto3 credentials are not configured.
    """
    if settings.USE_LOCAL_STORAGE or not settings.S3_ACCESS_KEY_ID:
        return f"/static/{key}"

    try:
        import boto3  # noqa: PLC0415

        s3_client = boto3.client(
            "s3",
            endpoint_url=settings.S3_ENDPOINT_URL,
            aws_access_key_id=settings.S3_ACCESS_KEY_ID,
            aws_secret_access_key=settings.S3_SECRET_ACCESS_KEY,
            region_name=settings.S3_REGION_NAME,
        )
        url = s3_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": bucket, "Key": key},
            ExpiresIn=expiry,
        )
        return url
    except Exception as exc:  # pragma: no cover
        logger.error("Failed to generate signed URL for %s/%s: %s", bucket, key, exc)
        return f"/static/{key}"
