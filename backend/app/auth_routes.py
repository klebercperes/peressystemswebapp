from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta, datetime, timezone
import uuid
import os
import logging
import httpx
import secrets

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
from app.email_service import send_verification_email, send_password_reset_email
from datetime import date
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.logging_config import get_logger

logger = get_logger(__name__)

# CAPTCHA verification
RECAPTCHA_SECRET_KEY = os.getenv("RECAPTCHA_SECRET_KEY", "")
RECAPTCHA_SITE_KEY = os.getenv("RECAPTCHA_SITE_KEY", "")

async def verify_recaptcha(token: str) -> bool:
    """Verify reCAPTCHA token with Google's API"""
    if not RECAPTCHA_SECRET_KEY:
        logger.warning("RECAPTCHA_SECRET_KEY not set - CAPTCHA verification disabled")
        return True  # Allow if CAPTCHA is not configured
    
    if not token:
        return False
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://www.google.com/recaptcha/api/siteverify",
                data={
                    "secret": RECAPTCHA_SECRET_KEY,
                    "response": token
                },
                timeout=5.0
            )
            result = response.json()
            return result.get("success", False)
    except Exception as e:
        logger.error(f"CAPTCHA verification error: {e}")
        return False

# Get rate limits from environment variables
AUTH_RATE_LIMIT = os.getenv("AUTH_RATE_LIMIT", "5/minute")  # Stricter for auth endpoints
REGISTER_RATE_LIMIT = os.getenv("REGISTER_RATE_LIMIT", "3/hour")  # Very strict for registration

# Create limiter instance for auth routes
# This will share state with the main app limiter when included
limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/api/auth", tags=["authentication"])

@router.post("/login-debug")
async def login_debug(request: Request):
    """Debug endpoint to see what's being sent to login"""
    request_id = getattr(request.state, "request_id", "unknown")
    try:
        body = await request.body()
        content_type = request.headers.get("content-type", "")
        body_str = body.decode('utf-8') if body else "No body"
        
        logger.info(
            "Login debug request",
            extra={
                "request_id": request_id,
                "content_type": content_type,
                "body": body_str,
                "headers": dict(request.headers)
            }
        )
        
        # Try to parse as JSON
        try:
            import json
            body_json = json.loads(body_str) if body_str else {}
            return {
                "status": "received",
                "content_type": content_type,
                "body": body_json,
                "body_raw": body_str,
                "message": "Check logs for full details"
            }
        except:
            return {
                "status": "received",
                "content_type": content_type,
                "body_raw": body_str,
                "error": "Could not parse as JSON",
                "message": "Check logs for full details"
            }
    except Exception as e:
        logger.error(f"Debug endpoint error: {e}", extra={"request_id": request_id})
        return {"error": str(e)}


@router.post("/register", response_model=schemas.UserResponse, status_code=201)
@limiter.limit(REGISTER_RATE_LIMIT)
async def register(request: Request, register_data: schemas.RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user with password and CAPTCHA"""
    request_id = getattr(request.state, "request_id", "unknown")
    logger.info("User registration attempt", extra={"request_id": request_id, "username": register_data.username, "email": register_data.email})
    
    # Verify CAPTCHA
    if RECAPTCHA_SECRET_KEY:  # Only verify if CAPTCHA is configured
        if not register_data.captcha_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="CAPTCHA verification required"
            )
        captcha_valid = await verify_recaptcha(register_data.captcha_token)
        if not captcha_valid:
            logger.warning("Registration failed - invalid CAPTCHA", extra={"request_id": request_id, "username": register_data.username})
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="CAPTCHA verification failed. Please try again."
            )
    
    if not register_data.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password is required for standard registration. Use /api/auth/signup-email for email-only signup."
        )
    
    # Check if username already exists
    if register_data.username:
        db_user = get_user_by_username(db, username=register_data.username)
        if db_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered"
            )
    
    # Check if email already exists
    db_user = get_user_by_email(db, email=register_data.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if this is the first user (make them admin)
    user_count = db.query(models.User).count()
    is_first_user = user_count == 0
    
    # Determine role - first user becomes team/admin, otherwise use provided role or default to customer
    user_role = models.UserRole.team if is_first_user else models.UserRole.customer
    
    # Create new user
    user_id = f"usr-{uuid.uuid4().hex[:8]}"
    hashed_password = get_password_hash(register_data.password)
    db_user = models.User(
        id=user_id,
        username=register_data.username,
        email=register_data.email,
        full_name=register_data.full_name,
        hashed_password=hashed_password,
        is_active=True,
        is_superuser=is_first_user,  # First user becomes admin automatically
        role=user_role,
        email_verified=True,  # Password signup is considered verified
        is_approved=is_first_user,  # First user is auto-approved, others need admin approval
    )
    db.add(db_user)
    
    # If customer, also create a Client record
    if user_role == models.UserRole.customer:
        # Check if client already exists with this email
        existing_client = db.query(models.Client).filter(models.Client.email == register_data.email).first()
        if not existing_client:
            client_id = f"cli-{uuid.uuid4().hex[:8]}"
            db_client = models.Client(
                id=client_id,
                name=register_data.full_name or register_data.username,  # Use full_name or username as company name
                contact_person=register_data.full_name or register_data.username,
                email=register_data.email,
                phone="",  # Can be updated later
                mobile_phone="",
                join_date=date.today(),
                details=f"Customer account created from user registration",
            )
            db.add(db_client)
            logger.info("Client created for customer", extra={"request_id": request_id, "client_id": client_id, "user_id": db_user.id})
    
    db.commit()
    db.refresh(db_user)
    logger.info("User registered successfully", extra={"request_id": request_id, "user_id": db_user.id, "username": db_user.username, "is_superuser": db_user.is_superuser, "is_approved": db_user.is_approved})
    return db_user


@router.post("/login", response_model=schemas.Token)
@limiter.limit(AUTH_RATE_LIMIT)
async def login(
    request: Request,
    login_data: schemas.LoginRequest,
    db: Session = Depends(get_db)
):
    """Login and get access token with CAPTCHA verification"""
    request_id = getattr(request.state, "request_id", "unknown")
    
    # Debug: Log request details
    content_type = request.headers.get("Content-Type", "")
    logger.warning(
        "🔍 Login request debug",
        extra={
            "request_id": request_id,
            "content_type": content_type,
            "username": login_data.username,
            "has_captcha": bool(login_data.captcha_token)
        }
    )
    
    logger.info("Login attempt", extra={"request_id": request_id, "username": login_data.username, "has_captcha": bool(login_data.captcha_token)})
    
    # Verify CAPTCHA
    if RECAPTCHA_SECRET_KEY:  # Only verify if CAPTCHA is configured
        if not login_data.captcha_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="CAPTCHA verification required"
            )
        captcha_valid = await verify_recaptcha(login_data.captcha_token)
        if not captcha_valid:
            logger.warning("Login failed - invalid CAPTCHA", extra={"request_id": request_id, "username": login_data.username})
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="CAPTCHA verification failed. Please try again."
            )
    
    user = authenticate_user(db, login_data.username, login_data.password)
    if not user:
        logger.warning("Login failed - invalid credentials", extra={"request_id": request_id, "username": login_data.username})
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user is approved (unless they're an admin)
    if not user.is_superuser and not user.is_approved:
        logger.warning("Login failed - user not approved", extra={"request_id": request_id, "user_id": user.id, "username": user.username or user.email})
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is pending admin approval. Please wait for an administrator to approve your account before logging in."
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    # Use email as subject if username is None (for email-only signups)
    token_subject = user.username if user.username else user.email
    access_token = create_access_token(
        data={"sub": token_subject}, expires_delta=access_token_expires
    )
    logger.info("Login successful", extra={"request_id": request_id, "user_id": user.id, "username": user.username or user.email})
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/google", response_model=schemas.Token)
@limiter.limit(AUTH_RATE_LIMIT)
async def google_oauth(
    request: Request,
    oauth_data: schemas.GoogleOAuthRequest,
    db: Session = Depends(get_db)
):
    """Login or register with Google OAuth"""
    request_id = getattr(request.state, "request_id", "unknown")
    
    # Log the received data for debugging
    logger.info("Google OAuth request received", extra={"request_id": request_id, "has_token": bool(oauth_data.token), "token_length": len(oauth_data.token) if oauth_data.token else 0})
    
    try:
        # Verify Google ID token
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://oauth2.googleapis.com/tokeninfo?id_token={oauth_data.token}"
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid Google token"
                )
            google_user = response.json()
        
        google_id = google_user.get("sub")
        email = google_user.get("email")
        name = google_user.get("name", "")
        given_name = google_user.get("given_name", "")
        family_name = google_user.get("family_name", "")
        full_name = name or f"{given_name} {family_name}".strip() or email.split("@")[0]
        
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email not provided by Google"
            )
        
        # Check if user exists by Google ID
        db_user = db.query(models.User).filter(models.User.google_id == google_id).first()
        
        # If not found by Google ID, check by email
        if not db_user:
            db_user = get_user_by_email(db, email)
            if db_user:
                # Link Google ID to existing user
                db_user.google_id = google_id
                db.commit()
                db.refresh(db_user)
        
        # Ensure Client record exists for customer users (even if user already exists)
        if db_user and db_user.role == models.UserRole.customer:
            existing_client = db.query(models.Client).filter(models.Client.email == email).first()
            if not existing_client:
                # Create Client record for existing customer user (e.g., if client was deleted)
                client_id = f"cli-{uuid.uuid4().hex[:8]}"
                db_client = models.Client(
                    id=client_id,
                    name=db_user.full_name or db_user.username,
                    contact_person=db_user.full_name or db_user.username,
                    email=email,
                    phone="",  # Can be updated later
                    mobile_phone="",
                    join_date=date.today(),
                    details=f"Client record recreated for existing customer user: {db_user.id}",
                )
                db.add(db_client)
                db.commit()
                logger.info("Client recreated for existing Google OAuth customer", extra={"request_id": request_id, "client_id": client_id, "user_id": db_user.id})
        
        # If still not found, create new user
        if not db_user:
            username = email.split("@")[0]  # Use email prefix as username
            # Ensure username is unique
            base_username = username
            counter = 1
            while get_user_by_username(db, username):
                username = f"{base_username}{counter}"
                counter += 1
            
            user_id = f"usr-{uuid.uuid4().hex[:8]}"
            db_user = models.User(
                id=user_id,
                username=username,
                email=email,
                full_name=full_name,
                hashed_password=None,  # No password for OAuth users
                is_active=True,
                is_superuser=False,
                role=models.UserRole.customer,  # Google OAuth users are customers
                google_id=google_id,
                is_approved=False,  # New users need admin approval
            )
            db.add(db_user)
            
            # Create Client record for Google OAuth customer
            existing_client = db.query(models.Client).filter(models.Client.email == email).first()
            if not existing_client:
                client_id = f"cli-{uuid.uuid4().hex[:8]}"
                db_client = models.Client(
                    id=client_id,
                    name=full_name or username,  # Use full_name or username as company name
                    contact_person=full_name or username,
                    email=email,
                    phone="",  # Can be updated later
                    mobile_phone="",
                    join_date=date.today(),
                    details=f"Customer account created from Google OAuth",
                )
                db.add(db_client)
                logger.info("Client created for Google OAuth customer", extra={"request_id": request_id, "client_id": client_id, "user_id": db_user.id})
            
            db.commit()
            db.refresh(db_user)
            logger.info("Google OAuth user created", extra={"request_id": request_id, "user_id": db_user.id, "email": email})
        
        if not db_user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive"
            )
        
        # Check if user is approved (unless they're an admin)
        if not db_user.is_superuser and not db_user.is_approved:
            logger.warning("Google OAuth login failed - user not approved", extra={"request_id": request_id, "user_id": db_user.id, "email": email})
            # Provide a more user-friendly message for first-time users
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account has been created but is pending admin approval. Please wait for an administrator to approve your account before logging in. You will be notified once your account is approved."
            )
        
        # Create JWT token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": db_user.username}, expires_delta=access_token_expires
        )
        logger.info("Google OAuth login successful", extra={"request_id": request_id, "user_id": db_user.id, "username": db_user.username})
        return {"access_token": access_token, "token_type": "bearer"}
        
    except httpx.HTTPError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Failed to verify Google token"
        )
    except HTTPException:
        # Re-raise HTTPException as-is (don't convert to 500)
        raise
    except Exception as e:
        logger.error("Google OAuth error", extra={"request_id": request_id, "error": str(e)}, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="OAuth authentication failed"
        )


@router.post("/signup-email", status_code=201)
@limiter.limit(REGISTER_RATE_LIMIT)
async def signup_email(request: Request, signup_data: schemas.EmailSignupRequest, db: Session = Depends(get_db)):
    """Sign up with email only - sends verification email"""
    request_id = getattr(request.state, "request_id", "unknown")
    logger.info("Email-only signup attempt", extra={"request_id": request_id, "email": signup_data.email})
    
    # Check if email already exists
    db_user = get_user_by_email(db, email=signup_data.email)
    if db_user:
        if db_user.email_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered and verified"
            )
        else:
            # Resend verification email for unverified user
            verification_token = secrets.token_urlsafe(32)
            db_user.verification_token = verification_token
            db_user.verification_token_expires = datetime.now(timezone.utc) + timedelta(hours=24)
            db.commit()
            await send_verification_email(signup_data.email, verification_token)
            return {"message": "Verification email sent. Please check your inbox."}
    
    # Check if this is the first user (make them admin)
    user_count = db.query(models.User).count()
    is_first_user = user_count == 0
    
    # Determine role - first user becomes team/admin, otherwise customer
    user_role = models.UserRole.team if is_first_user else models.UserRole.customer
    
    # Generate username from email
    username = signup_data.email.split("@")[0]
    base_username = username
    counter = 1
    while get_user_by_username(db, username):
        username = f"{base_username}{counter}"
        counter += 1
    
    # Generate verification token
    verification_token = secrets.token_urlsafe(32)
    
    # Create new user (unverified)
    user_id = f"usr-{uuid.uuid4().hex[:8]}"
    db_user = models.User(
        id=user_id,
        username=username,
        email=signup_data.email,
        full_name=signup_data.full_name,
        hashed_password=None,  # No password yet
        is_active=False,  # Inactive until verified
        is_superuser=is_first_user,
        role=user_role,
        email_verified=False,
        verification_token=verification_token,
        verification_token_expires=datetime.now(timezone.utc) + timedelta(hours=24),
        is_approved=is_first_user,  # First user is auto-approved, others need admin approval
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Send verification email
    await send_verification_email(signup_data.email, verification_token)
    
    logger.info("Email signup initiated", extra={"request_id": request_id, "user_id": db_user.id, "email": signup_data.email})
    return {"message": "Verification email sent. Please check your inbox to verify your email address."}


@router.post("/verify-email", response_model=schemas.Token)
@limiter.limit(AUTH_RATE_LIMIT)
async def verify_email(request: Request, verification_data: schemas.EmailVerificationRequest, db: Session = Depends(get_db)):
    """Verify email address and optionally set password"""
    request_id = getattr(request.state, "request_id", "unknown")
    
    # Find user by verification token
    db_user = db.query(models.User).filter(
        models.User.verification_token == verification_data.token
    ).first()
    
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token"
        )
    
    # Check if token expired
    if db_user.verification_token_expires and db_user.verification_token_expires < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification token has expired. Please request a new one."
        )
    
    # Verify email
    db_user.email_verified = True
    db_user.is_active = True
    db_user.verification_token = None
    db_user.verification_token_expires = None
    
    # Set password if provided
    if verification_data.password:
        db_user.hashed_password = get_password_hash(verification_data.password)
    
    # If customer, create Client record if it doesn't exist
    if db_user.role == models.UserRole.customer:
        existing_client = db.query(models.Client).filter(models.Client.email == db_user.email).first()
        if not existing_client:
            client_id = f"cli-{uuid.uuid4().hex[:8]}"
            db_client = models.Client(
                id=client_id,
                name=db_user.full_name or db_user.username,
                contact_person=db_user.full_name or db_user.username,
                email=db_user.email,
                phone="",
                mobile_phone="",
                join_date=date.today(),
                details=f"Customer account created from email verification",
            )
            db.add(db_client)
            logger.info("Client created for verified customer", extra={"request_id": request_id, "client_id": client_id, "user_id": db_user.id})
    
    db.commit()
    db.refresh(db_user)
    
    # Create JWT token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": db_user.username or db_user.email}, expires_delta=access_token_expires
    )
    
    logger.info("Email verified successfully", extra={"request_id": request_id, "user_id": db_user.id, "email": db_user.email})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=schemas.UserResponse)
@limiter.limit(AUTH_RATE_LIMIT)
def read_users_me(request: Request, current_user: models.User = Depends(get_current_active_user)):
    """Get current user information"""
    return current_user


@router.post("/forgot-password", status_code=200)
@limiter.limit("5/hour")  # Rate limit password reset requests
async def forgot_password(request: Request, reset_data: schemas.PasswordResetRequest, db: Session = Depends(get_db)):
    """Request password reset - sends reset email"""
    request_id = getattr(request.state, "request_id", "unknown")
    logger.info("Password reset request", extra={"request_id": request_id, "email": reset_data.email})
    
    # Find user by email
    user = get_user_by_email(db, email=reset_data.email)
    if not user:
        # Don't reveal if email exists or not (security best practice)
        logger.warning("Password reset requested for non-existent email", extra={"request_id": request_id, "email": reset_data.email})
        return {"message": "If an account with that email exists, a password reset link has been sent."}
    
    # Generate reset token
    reset_token = secrets.token_urlsafe(32)
    user.password_reset_token = reset_token
    user.password_reset_token_expires = datetime.now(timezone.utc) + timedelta(hours=1)  # 1 hour expiry
    db.commit()
    
    # Send reset email
    email_sent = await send_password_reset_email(user.email, reset_token)
    
    if email_sent:
        logger.info("Password reset email sent", extra={"request_id": request_id, "user_id": user.id, "email": user.email})
    else:
        logger.error("Failed to send password reset email", extra={"request_id": request_id, "user_id": user.id, "email": user.email})
        # Still return success message for security (don't reveal if email failed)
    
    return {"message": "If an account with that email exists, a password reset link has been sent."}


@router.post("/reset-password", status_code=200)
@limiter.limit(AUTH_RATE_LIMIT)
async def reset_password(request: Request, reset_data: schemas.PasswordResetConfirm, db: Session = Depends(get_db)):
    """Reset password using reset token"""
    request_id = getattr(request.state, "request_id", "unknown")
    logger.info("Password reset attempt", extra={"request_id": request_id})
    
    # Find user by reset token
    user = db.query(models.User).filter(
        models.User.password_reset_token == reset_data.token
    ).first()
    
    if not user:
        logger.warning("Invalid password reset token", extra={"request_id": request_id})
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    # Check if token expired
    if user.password_reset_token_expires and user.password_reset_token_expires < datetime.now(timezone.utc):
        logger.warning("Expired password reset token", extra={"request_id": request_id, "user_id": user.id})
        # Clear expired token
        user.password_reset_token = None
        user.password_reset_token_expires = None
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    # Validate password
    if len(reset_data.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long"
        )
    
    # Update password
    user.hashed_password = get_password_hash(reset_data.new_password)
    user.password_reset_token = None
    user.password_reset_token_expires = None
    user.email_verified = True  # Mark as verified if they reset password
    db.commit()
    
    logger.info("Password reset successful", extra={"request_id": request_id, "user_id": user.id})
    return {"message": "Password has been reset successfully. You can now login with your new password."}


@router.post("/admin/reset-password", status_code=200)
@limiter.limit(AUTH_RATE_LIMIT)
async def admin_reset_password(
    request: Request,
    reset_data: schemas.AdminPasswordReset,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Admin endpoint to reset any user's password"""
    request_id = getattr(request.state, "request_id", "unknown")
    
    # Check if current user is admin
    if not current_user.is_superuser:
        logger.warning("Unauthorized password reset attempt", extra={"request_id": request_id, "user_id": current_user.id})
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions. Admin access required."
        )
    
    # Find target user
    target_user = db.query(models.User).filter(models.User.id == reset_data.user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Validate password
    if len(reset_data.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long"
        )
    
    # Update password
    target_user.hashed_password = get_password_hash(reset_data.new_password)
    target_user.password_reset_token = None  # Clear any existing reset tokens
    target_user.password_reset_token_expires = None
    target_user.email_verified = True  # Mark as verified
    db.commit()
    
    logger.info(
        "Admin password reset",
        extra={
            "request_id": request_id,
            "admin_id": current_user.id,
            "target_user_id": target_user.id,
            "target_email": target_user.email
        }
    )
    return {"message": f"Password has been reset successfully for user {target_user.email}"}

