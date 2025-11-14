from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
import uuid
import os
import logging

from app.database import get_db
from app import models, schemas
from app.auth import (
    authenticate_user,
    create_access_token,
    get_current_active_user,
    get_user_by_username,
    get_user_by_email,
    get_password_hash,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.logging_config import get_logger

logger = get_logger(__name__)

# Get rate limits from environment variables
AUTH_RATE_LIMIT = os.getenv("AUTH_RATE_LIMIT", "5/minute")  # Stricter for auth endpoints
REGISTER_RATE_LIMIT = os.getenv("REGISTER_RATE_LIMIT", "3/hour")  # Very strict for registration

# Create limiter instance for auth routes
# This will share state with the main app limiter when included
limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/api/auth", tags=["authentication"])


@router.post("/register", response_model=schemas.UserResponse, status_code=201)
@limiter.limit(REGISTER_RATE_LIMIT)
def register(request: Request, user: schemas.UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    request_id = getattr(request.state, "request_id", "unknown")
    logger.info("User registration attempt", extra={"request_id": request_id, "username": user.username, "email": user.email})
    
    # Check if username already exists
    db_user = get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Check if email already exists
    db_user = get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if this is the first user (make them admin)
    user_count = db.query(models.User).count()
    is_first_user = user_count == 0
    
    # Create new user
    user_id = f"usr-{uuid.uuid4().hex[:8]}"
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        id=user_id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        hashed_password=hashed_password,
        is_active=True,
        is_superuser=is_first_user,  # First user becomes admin automatically
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    logger.info("User registered successfully", extra={"request_id": request_id, "user_id": db_user.id, "username": db_user.username, "is_superuser": db_user.is_superuser})
    return db_user


@router.post("/login", response_model=schemas.Token)
@limiter.limit(AUTH_RATE_LIMIT)
def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Login and get access token"""
    request_id = getattr(request.state, "request_id", "unknown")
    logger.info("Login attempt", extra={"request_id": request_id, "username": form_data.username})
    
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        logger.warning("Login failed - invalid credentials", extra={"request_id": request_id, "username": form_data.username})
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    logger.info("Login successful", extra={"request_id": request_id, "user_id": user.id, "username": user.username})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=schemas.UserResponse)
@limiter.limit(AUTH_RATE_LIMIT)
def read_users_me(request: Request, current_user: models.User = Depends(get_current_active_user)):
    """Get current user information"""
    return current_user

