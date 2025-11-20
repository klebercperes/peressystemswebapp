from fastapi import FastAPI, Depends, HTTPException, status, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List
import uuid
from datetime import date, datetime
import os

from app.database import get_db, engine, Base
from app import models, schemas
from app.auth import get_current_active_user, get_user_by_username, get_user_by_email
from app.auth_routes import router as auth_router
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.logging_config import setup_logging, get_logger
from app.middleware import RequestIDMiddleware, LoggingMiddleware
from app.security_headers import SecurityHeadersMiddleware
from app.sentry_config import init_sentry

# Initialize Sentry error tracking (if configured)
sentry_enabled = init_sentry()

# Setup structured logging
setup_logging()
logger = get_logger(__name__)

if sentry_enabled:
    logger.info("Sentry error tracking enabled")
else:
    logger.info("Sentry not configured (set SENTRY_DSN to enable)")

# Database tables are created via Alembic migrations
# Run: alembic upgrade head
# DO NOT use Base.metadata.create_all() in production

app = FastAPI(title="Peres Systems MSP API", version="1.0.0")

# Add middleware (order matters - security headers last)
app.add_middleware(RequestIDMiddleware)
app.add_middleware(LoggingMiddleware)
app.add_middleware(SecurityHeadersMiddleware)

# Initialize rate limiter
# Using IP address as the key for rate limiting
# In production with multiple servers, consider using Redis for distributed rate limiting
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Add validation error handler for better error messages
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors with detailed messages"""
    request_id = getattr(request.state, "request_id", "unknown")
    body_str = None
    try:
        body = await request.body()
        body_str = body.decode('utf-8') if body else None
    except:
        pass
    
    errors_list = exc.errors()
    # Convert errors to a serializable format
    serializable_errors = []
    for error in errors_list:
        serializable_errors.append({
            "loc": error.get("loc", []),
            "msg": str(error.get("msg", "")),
            "type": str(error.get("type", ""))
        })
    
    logger.error(
        "Request validation error",
        extra={
            "request_id": request_id,
            "path": request.url.path,
            "method": request.method,
            "errors": str(errors_list),
            "body": body_str
        }
    )
    return JSONResponse(
        status_code=422,
        content={"detail": serializable_errors}
    )

# CORS middleware - configure from environment variables
# Default origins (no hardcoded IPs - use environment variables)
DEFAULT_CORS_ORIGINS = "http://localhost:5173,http://localhost:3000,http://frontend:5173"
CORS_ORIGINS = os.getenv("CORS_ORIGINS", DEFAULT_CORS_ORIGINS).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept", "Cache-Control", "Pragma", "Expires"],
    expose_headers=["Content-Type"],
)

# Get rate limits from environment variables
API_RATE_LIMIT = os.getenv("API_RATE_LIMIT", "100/minute")  # General API rate limit

# Include auth router (after limiter is set up)
app.include_router(auth_router)

# Share limiter with auth router - set app state after router is included
from app.auth_routes import limiter as auth_limiter
auth_limiter.app = app  # Share the app state for rate limiting

# ========== CLIENT ENDPOINTS ==========

@app.get("/api/clients", response_model=List[schemas.ClientResponse])
@limiter.limit(API_RATE_LIMIT)
def get_clients(
    request: Request,
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get all clients"""
    clients = db.query(models.Client).offset(skip).limit(limit).all()
    return [
        {
            "id": c.id,
            "name": c.name,
            "abn": c.abn,
            "contactPerson": c.contact_person,
            "email": c.email,
            "address": c.address,
            "phone": c.phone,
            "mobilePhone": c.mobile_phone,
            "joinDate": c.join_date,
            "details": c.details,
        }
        for c in clients
    ]

@app.get("/api/clients/{client_id}", response_model=schemas.ClientResponse)
@limiter.limit(API_RATE_LIMIT)
def get_client(
    request: Request,
    client_id: str, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get a single client by ID"""
    client = db.query(models.Client).filter(models.Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return {
        "id": client.id,
        "name": client.name,
        "abn": client.abn,
        "contactPerson": client.contact_person,
        "email": client.email,
        "address": client.address,
        "phone": client.phone,
        "mobilePhone": client.mobile_phone,
        "joinDate": client.join_date,
        "details": client.details,
    }

@app.post("/api/clients", response_model=schemas.ClientResponse, status_code=201)
@limiter.limit(API_RATE_LIMIT)
def create_client(
    request: Request,
    client: schemas.ClientCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Create a new client"""
    client_id = f"cli-{uuid.uuid4().hex[:8]}"
    db_client = models.Client(
        id=client_id,
        name=client.name,
        abn=client.abn,
        contact_person=client.contactPerson or '',  # Use empty string if not provided (deprecated field)
        email=client.email,
        address=client.address,
        phone=client.phone,
        mobile_phone=client.mobilePhone,
        join_date=date.today(),
        details=client.details,
    )
    db.add(db_client)
    db.commit()
    db.refresh(db_client)
    # Convert to response format
    return {
        "id": db_client.id,
        "name": db_client.name,
        "abn": db_client.abn,
        "contactPerson": db_client.contact_person,
        "email": db_client.email,
        "address": db_client.address,
        "phone": db_client.phone,
        "mobilePhone": db_client.mobile_phone,
        "joinDate": db_client.join_date,
        "details": db_client.details,
    }

@app.put("/api/clients/{client_id}", response_model=schemas.ClientResponse)
@limiter.limit(API_RATE_LIMIT)
def update_client(
    request: Request,
    client_id: str, 
    client_update: schemas.ClientUpdate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Update a client"""
    db_client = db.query(models.Client).filter(models.Client.id == client_id).first()
    if not db_client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    update_data = client_update.model_dump(exclude_unset=True)
    contact_person_updated = False
    new_contact_person = None
    
    # Map camelCase to snake_case
    if "contactPerson" in update_data:
        new_contact_person = update_data.pop("contactPerson")
        db_client.contact_person = new_contact_person
        contact_person_updated = True
    if "mobilePhone" in update_data:
        db_client.mobile_phone = update_data.pop("mobilePhone")
    if "phone" in update_data:
        db_client.phone = update_data.pop("phone")
    
    # Handle remaining fields (name, abn, email, address, details)
    for field, value in update_data.items():
        if hasattr(db_client, field):
            setattr(db_client, field, value)
    
    db.commit()
    
    # If contact_person was updated, also update the corresponding user's full_name
    # This keeps the Dashboard welcome message in sync with the client's contact person
    if contact_person_updated and db_client.email:
        db_user = db.query(models.User).filter(models.User.email == db_client.email).first()
        if db_user:
            db_user.full_name = new_contact_person
            db.commit()
            logger.info(
                f"Synced user full_name with client contact_person",
                extra={"client_id": db_client.id, "user_id": db_user.id, "new_name": new_contact_person}
            )
    
    db.refresh(db_client)
    return {
        "id": db_client.id,
        "name": db_client.name,
        "abn": db_client.abn,
        "contactPerson": db_client.contact_person,
        "email": db_client.email,
        "address": db_client.address,
        "phone": db_client.phone,
        "mobilePhone": db_client.mobile_phone,
        "joinDate": db_client.join_date,
        "details": db_client.details,
    }

@app.delete("/api/clients/{client_id}", status_code=204)
@limiter.limit(API_RATE_LIMIT)
def delete_client(
    request: Request,
    client_id: str, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Delete a client"""
    db_client = db.query(models.Client).filter(models.Client.id == client_id).first()
    if not db_client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    db.delete(db_client)
    db.commit()
    return None

# ========== USER ENDPOINTS ==========

# CRITICAL: /api/users/me must come FIRST, before any /api/users/{user_id} routes
# Otherwise FastAPI will match "me" as a user_id parameter and route to admin-only endpoint
@app.put("/api/users/me", response_model=schemas.UserResponse)
@limiter.limit(API_RATE_LIMIT)
def update_current_user(
    request: Request,
    user_update: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Update current user's own profile - any authenticated user can update their own profile"""
    request_id = getattr(request.state, "request_id", "unknown")
    logger.info(
        "Updating current user profile",
        extra={
            "request_id": request_id,
            "user_id": current_user.id,
            "username": current_user.username
        }
    )
    
    # Users can only update certain fields on their own profile
    # Prevent changing sensitive fields like is_superuser, role, is_active
    update_data = user_update.model_dump(exclude_unset=True)
    
    logger.debug(f"Update data received: {list(update_data.keys())}", extra={"request_id": request_id})
    
    # Only allow updating: username, email, full_name
    allowed_fields = {'username', 'email', 'full_name'}
    restricted_fields = {'is_superuser', 'is_active', 'role', 'client_id', 'email_verified'}
    
    # Check if trying to update restricted fields
    for field in restricted_fields:
        if field in update_data:
            logger.warning(
                f"Attempted to update restricted field: {field}",
                extra={"request_id": request_id, "user_id": current_user.id, "field": field}
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Cannot update {field}. Contact an administrator."
            )
    
    # Update allowed fields
    updated_fields = []
    for field, value in update_data.items():
        if field in allowed_fields and hasattr(current_user, field):
            setattr(current_user, field, value)
            updated_fields.append(field)
    
    if not updated_fields:
        logger.warning(
            "No valid fields to update",
            extra={"request_id": request_id, "user_id": current_user.id, "update_data": list(update_data.keys())}
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid fields provided for update. Allowed fields: username, email, full_name"
        )
    
    db.commit()
    db.refresh(current_user)
    
    logger.info(
        "User profile updated successfully",
        extra={
            "request_id": request_id,
            "user_id": current_user.id,
            "updated_fields": updated_fields
        }
    )
    
    return current_user

# ========== USER ENDPOINTS (Admin Only) ==========

@app.get("/api/users", response_model=List[schemas.UserResponse])
@limiter.limit(API_RATE_LIMIT)
def get_users(
    request: Request,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get all users (admin only)"""
    # Check if user is admin
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions. Admin access required."
        )
    
    users = db.query(models.User).offset(skip).limit(limit).all()
    return users

@app.post("/api/users", response_model=schemas.UserResponse, status_code=201)
@limiter.limit(API_RATE_LIMIT)
def create_user(
    request: Request,
    user_create: schemas.UserCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Create a new user (admin only)"""
    request_id = getattr(request.state, "request_id", "unknown")
    
    # Check if user is admin
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions. Admin access required."
        )
    
    # Check if username already exists
    if user_create.username:
        existing_user = get_user_by_username(db, username=user_create.username)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already exists"
            )
    
    # Check if email already exists
    existing_user = get_user_by_email(db, email=user_create.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists"
        )
    
    # Create new user
    user_id = f"usr-{uuid.uuid4().hex[:8]}"
    hashed_password = None
    if user_create.password:
        from app.auth import get_password_hash
        hashed_password = get_password_hash(user_create.password)
    else:
        # If no password provided, user will need to set it via password reset
        pass
    
    # Determine role
    user_role = models.UserRole[user_create.role] if user_create.role in ["customer", "team"] else models.UserRole.customer
    
    db_user = models.User(
        id=user_id,
        username=user_create.username,
        email=user_create.email,
        full_name=user_create.full_name,
        hashed_password=hashed_password,
        is_active=True,
        is_superuser=False,  # Admins should explicitly set this via update
        role=user_role,
        email_verified=True,  # Admin-created users are considered verified
        is_approved=True,  # Admin-created users are auto-approved
    )
    db.add(db_user)
    
    # If customer, create Client record if it doesn't exist
    if user_role == models.UserRole.customer:
        existing_client = db.query(models.Client).filter(models.Client.email == user_create.email).first()
        if not existing_client:
            client_id = f"cli-{uuid.uuid4().hex[:8]}"
            db_client = models.Client(
                id=client_id,
                name=user_create.full_name or user_create.username,
                contact_person=user_create.full_name or user_create.username,
                email=user_create.email,
                phone="",
                mobile_phone="",
                join_date=date.today(),
                details=f"Client created by admin: {current_user.username}",
            )
            db.add(db_client)
    
    db.commit()
    db.refresh(db_user)
    
    logger.info(
        "User created by admin",
        extra={
            "request_id": request_id,
            "created_user_id": db_user.id,
            "admin_user_id": current_user.id
        }
    )
    
    return db_user

@app.put("/api/users/{user_id}/approve", response_model=schemas.UserResponse)
@limiter.limit(API_RATE_LIMIT)
def approve_user(
    request: Request,
    user_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Approve a user (admin only)"""
    request_id = getattr(request.state, "request_id", "unknown")
    
    # Check if user is admin
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions. Admin access required."
        )
    
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db_user.is_approved = True
    db.commit()
    db.refresh(db_user)
    
    logger.info(
        "User approved",
        extra={
            "request_id": request_id,
            "approved_user_id": user_id,
            "admin_user_id": current_user.id
        }
    )
    
    return db_user

@app.put("/api/users/{user_id}", response_model=schemas.UserResponse)
@limiter.limit(API_RATE_LIMIT)
def update_user(
    request: Request,
    user_id: str,
    user_update: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Update a user (admin only)"""
    # If user_id is "me", redirect to the current user endpoint
    if user_id == "me":
        # This handles the case where FastAPI matches /api/users/me to this route
        # Instead of requiring admin, allow the user to update their own profile
        update_data = user_update.model_dump(exclude_unset=True)
        allowed_fields = {'username', 'email', 'full_name'}
        restricted_fields = {'is_superuser', 'is_active', 'role', 'client_id', 'email_verified', 'is_approved'}
        
        # Check if trying to update restricted fields
        for field in restricted_fields:
            if field in update_data:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Cannot update {field}. Contact an administrator."
                )
        
        # Update allowed fields
        for field, value in update_data.items():
            if field in allowed_fields and hasattr(current_user, field):
                setattr(current_user, field, value)
        
        db.commit()
        db.refresh(current_user)
        return current_user
    
    # Check if user is admin
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions. Admin access required."
        )
    
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update fields from the request
    update_data = user_update.model_dump(exclude_unset=True)
    
    # Handle password separately (needs hashing)
    if 'password' in update_data:
        password = update_data.pop('password')
        if password:
            from app.auth import get_password_hash
            db_user.hashed_password = get_password_hash(password)
    
    # Update other fields
    for field, value in update_data.items():
        if hasattr(db_user, field):
            setattr(db_user, field, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user

@app.delete("/api/users/{user_id}", status_code=204)
@limiter.limit(API_RATE_LIMIT)
def delete_user(
    request: Request,
    user_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Delete a user (admin only)"""
    request_id = getattr(request.state, "request_id", "unknown")
    
    # Check if user is admin
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions. Admin access required."
        )
    
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent deleting yourself
    if db_user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    # Prevent deleting the last admin
    if db_user.is_superuser:
        admin_count = db.query(models.User).filter(models.User.is_superuser == True).count()
        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete the last admin user"
            )
    
    logger.info(
        "User deleted by admin",
        extra={
            "request_id": request_id,
            "deleted_user_id": user_id,
            "deleted_username": db_user.username,
            "admin_user_id": current_user.id
        }
    )
    
    db.delete(db_user)
    db.commit()
    return None

@app.get("/api/clients/{client_id}/users", response_model=List[schemas.UserResponse])
@limiter.limit(API_RATE_LIMIT)
def get_client_users(
    request: Request,
    client_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get all users/contacts linked to a client (admin only)"""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions. Admin access required."
        )
    
    # Verify client exists
    db_client = db.query(models.Client).filter(models.Client.id == client_id).first()
    if not db_client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Get all users linked to this client
    users = db.query(models.User).filter(models.User.client_id == client_id).all()
    return users

@app.put("/api/users/{user_id}/link-client/{client_id}", response_model=schemas.UserResponse)
@limiter.limit(API_RATE_LIMIT)
def link_user_to_client(
    request: Request,
    user_id: str,
    client_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Link a user/contact to a client (admin only)"""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions. Admin access required."
        )
    
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db_client = db.query(models.Client).filter(models.Client.id == client_id).first()
    if not db_client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    db_user.client_id = client_id
    db.commit()
    db.refresh(db_user)
    return db_user

@app.put("/api/users/{user_id}/unlink-client", response_model=schemas.UserResponse)
@limiter.limit(API_RATE_LIMIT)
def unlink_user_from_client(
    request: Request,
    user_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Unlink a user/contact from their client (admin only)"""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions. Admin access required."
        )
    
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db_user.client_id = None
    db.commit()
    db.refresh(db_user)
    return db_user

# ========== CONTACT ENDPOINT ==========

@app.post("/api/contact", status_code=200)
@limiter.limit("5/hour")  # Rate limit contact form submissions
async def contact_form(
    request: Request,
    contact_data: dict,
    db: Session = Depends(get_db)
):
    """Handle contact form submissions"""
    try:
        from app.email_service import send_contact_email
        
        name = contact_data.get('name', '')
        email = contact_data.get('email', '')
        phone = contact_data.get('phone', '')
        subject = contact_data.get('subject', 'General Inquiry')
        message = contact_data.get('message', '')
        
        # Validate required fields
        if not name or not email or not message:
            raise HTTPException(
                status_code=400,
                detail="Name, email, and message are required"
            )
        
        # Send email
        email_sent = await send_contact_email(name, email, phone, subject, message)
        
        if not email_sent:
            logger.warning(
                "Contact form submission failed - email not sent",
                extra={
                    "request_id": getattr(request.state, "request_id", "unknown"),
                    "email": email,
                    "subject": subject
                }
            )
            raise HTTPException(
                status_code=500,
                detail="Failed to send message. Please check SMTP configuration or try again later."
            )
        
        logger.info(
            "Contact form submission",
            extra={
                "request_id": getattr(request.state, "request_id", "unknown"),
                "email": email,
                "subject": subject
            }
        )
        
        return {"message": "Your message has been sent successfully. We'll get back to you soon!"}
    except Exception as e:
        logger.error(
            f"Error sending contact email: {str(e)}",
            extra={"request_id": getattr(request.state, "request_id", "unknown")}
        )
        raise HTTPException(
            status_code=500,
            detail="Failed to send message. Please try again later."
        )


@app.post("/api/whatsapp/send", status_code=200)
@limiter.limit("10/minute")  # Rate limit WhatsApp messages
async def send_whatsapp(
    request: Request,
    whatsapp_data: dict,
    db: Session = Depends(get_db)
):
    """Send WhatsApp message via WhatsApp Business API"""
    try:
        from app.whatsapp_service import send_whatsapp_message
        
        phone = whatsapp_data.get('phone', '')
        message = whatsapp_data.get('message', '')
        
        # Validate required fields
        if not phone or not message:
            raise HTTPException(
                status_code=400,
                detail="Phone and message are required"
            )
        
        # Send WhatsApp message
        result = await send_whatsapp_message(phone, message)
        
        # Check if sending failed
        if result.get("status") == "error":
            logger.warning(
                "WhatsApp message failed to send",
                extra={
                    "request_id": getattr(request.state, "request_id", "unknown"),
                    "phone": phone,
                    "error": result.get("message")
                }
            )
            raise HTTPException(
                status_code=500,
                detail=result.get("message", "Failed to send WhatsApp message")
            )
        
        logger.info(
            "WhatsApp message sent",
            extra={
                "request_id": getattr(request.state, "request_id", "unknown"),
                "phone": phone,
                "status": result.get("status")
            }
        )
        
        return {
            "status": result.get("status", "sent"),
            "reply": result.get("reply"),
            "message": result.get("message", "Message sent successfully")
        }
    except HTTPException:
        # Re-raise HTTP exceptions (they already have proper error messages)
        raise
    except Exception as e:
        logger.error(
            f"Error sending WhatsApp message: {str(e)}",
            extra={"request_id": getattr(request.state, "request_id", "unknown")}
        )
        # Include the actual error message if it's informative
        error_detail = str(e)
        if "WhatsApp API" in error_detail or "expired" in error_detail.lower() or "token" in error_detail.lower():
            detail = error_detail
        else:
            detail = f"Failed to send WhatsApp message: {error_detail}. Please try the contact form or email us."
        raise HTTPException(
            status_code=500,
            detail=detail
        )


@app.get("/api/whatsapp/webhook")
@limiter.limit("100/minute")
async def whatsapp_webhook_verify(request: Request):
    """WhatsApp webhook verification (GET request)"""
    # Read query parameters directly from request (handles hub.mode, hub.verify_token, hub.challenge)
    query_params = request.query_params
    hub_mode = query_params.get("hub.mode")
    hub_verify_token = query_params.get("hub.verify_token")
    hub_challenge = query_params.get("hub.challenge")
    
    # Debug: log the full URL and query string
    full_url = str(request.url)
    query_string = str(request.query_params)
    
    verify_token = os.getenv("WHATSAPP_VERIFY_TOKEN", "")
    
    logger.info(
        f"WhatsApp webhook verification attempt - URL: {full_url}, Query: {query_string}",
        extra={
            "request_id": getattr(request.state, "request_id", "unknown"),
            "hub_mode": hub_mode,
            "has_token": bool(hub_verify_token),
            "token_match": hub_verify_token == verify_token if hub_verify_token else False,
            "full_url": full_url,
            "query_string": query_string
        }
    )
    
    if hub_mode == "subscribe" and hub_verify_token == verify_token:
        logger.info("WhatsApp webhook verified successfully", extra={"request_id": getattr(request.state, "request_id", "unknown")})
        # Return the challenge as integer (required by WhatsApp)
        return int(hub_challenge) if hub_challenge and hub_challenge.isdigit() else 200
    
    logger.warning(
        f"WhatsApp webhook verification failed - mode: {hub_mode}, token_match: {hub_verify_token == verify_token if hub_verify_token else 'N/A'}",
        extra={"request_id": getattr(request.state, "request_id", "unknown")}
    )
    raise HTTPException(status_code=403, detail="Forbidden")


@app.post("/api/whatsapp/webhook")
@limiter.limit("100/minute")
async def whatsapp_webhook_receive(
    request: Request,
    db: Session = Depends(get_db)
):
    """Receive WhatsApp messages via webhook (POST request)"""
    try:
        data = await request.json()
        
        # Handle WhatsApp webhook events
        if data.get("object") == "whatsapp_business_account":
            entries = data.get("entry", [])
            for entry in entries:
                changes = entry.get("changes", [])
                for change in changes:
                    value = change.get("value", {})
                    
                    # Handle incoming messages
                    messages = value.get("messages", [])
                    for message in messages:
                        from_number = message.get("from", "")
                        message_text = message.get("text", {}).get("body", "")
                        message_id = message.get("id", "")
                        message_type = message.get("type", "unknown")
                        
                        logger.info(
                            "WhatsApp message received",
                            extra={
                                "request_id": getattr(request.state, "request_id", "unknown"),
                                "from": from_number,
                                "message_id": message_id,
                                "type": message_type
                            }
                        )
                        
                        # Log message content (for text messages only)
                        if message_type == "text" and message_text:
                            logger.info(
                                f"WhatsApp message content: {message_text[:100]}",
                                extra={"request_id": getattr(request.state, "request_id", "unknown")}
                            )
                    
                    # Handle status updates (delivered, read, sent, etc.)
                    statuses = value.get("statuses", [])
                    for status in statuses:
                        message_id = status.get("id", "")
                        status_type = status.get("status", "")
                        recipient = status.get("recipient_id", "")
                        
                        logger.info(
                            f"WhatsApp message status: {status_type}",
                            extra={
                                "request_id": getattr(request.state, "request_id", "unknown"),
                                "message_id": message_id,
                                "recipient": recipient,
                                "status": status_type
                            }
                        )
        
        return {"status": "ok"}
    except Exception as e:
        logger.error(
            f"Error processing WhatsApp webhook: {str(e)}",
            extra={"request_id": getattr(request.state, "request_id", "unknown")},
            exc_info=True
        )
        return {"status": "error", "message": str(e)}

# ========== BUSINESS SETTINGS ENDPOINTS ==========

@app.get("/api/business-settings", response_model=schemas.BusinessSettingsResponse)
@limiter.limit(API_RATE_LIMIT)
def get_business_settings(
    request: Request,
    db: Session = Depends(get_db)
):
    """Get business settings (public endpoint)"""
    settings = db.query(models.BusinessSettings).first()
    if not settings:
        # Return default empty settings
        return {
            "id": str(uuid.uuid4()),
            "trading_name": None,
            "business_name": None,
            "abn": None,
            "company_logo_url": None,
            "address_line1": None,
            "address_line2": None,
            "city": None,
            "state": None,
            "postcode": None,
            "country": "Australia",
            "phone_number": None,
            "mobile_number": None,
            "email_contact": None,
            "linkedin_url": None,
            "instagram_url": None,
            "facebook_url": None,
            "twitter_url": None,
            "updated_at": datetime.now(),
            "created_at": datetime.now()
        }
    return settings

@app.put("/api/business-settings", response_model=schemas.BusinessSettingsResponse)
@limiter.limit("10/minute")
def update_business_settings(
    request: Request,
    settings_update: schemas.BusinessSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Update business settings (admin only)"""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can update business settings"
        )
    
    settings = db.query(models.BusinessSettings).first()
    
    if not settings:
        # Create new settings
        settings = models.BusinessSettings(
            id=str(uuid.uuid4()),
            **settings_update.model_dump(exclude_unset=True)
        )
        db.add(settings)
    else:
        # Update existing settings
        update_data = settings_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(settings, field, value)
    
    db.commit()
    db.refresh(settings)
    
    logger.info(
        "Business settings updated",
        extra={
            "request_id": getattr(request.state, "request_id", "unknown"),
            "user_id": current_user.id
        }
    )
    
    return settings

# ========== TICKET ENDPOINTS ==========

@app.get("/api/tickets", response_model=List[schemas.TicketResponse])
@limiter.limit(API_RATE_LIMIT)
def get_tickets(
    request: Request,
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get all tickets"""
    tickets = db.query(models.Ticket).offset(skip).limit(limit).all()
    return [
        {
            "id": t.id,
            "clientId": t.client_id,
            "title": t.title,
            "description": t.description,
            "status": t.status,
            "createdDate": t.created_date,
            "resolvedDate": t.resolved_date,
        }
        for t in tickets
    ]

@app.get("/api/tickets/{ticket_id}", response_model=schemas.TicketResponse)
@limiter.limit(API_RATE_LIMIT)
def get_ticket(
    request: Request,
    ticket_id: str, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get a single ticket by ID"""
    ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return {
        "id": ticket.id,
        "clientId": ticket.client_id,
        "title": ticket.title,
        "description": ticket.description,
        "status": ticket.status,
        "createdDate": ticket.created_date,
        "resolvedDate": ticket.resolved_date,
    }

@app.get("/api/clients/{client_id}/tickets", response_model=List[schemas.TicketResponse])
@limiter.limit(API_RATE_LIMIT)
def get_tickets_by_client(
    request: Request,
    client_id: str, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get all tickets for a specific client"""
    tickets = db.query(models.Ticket).filter(models.Ticket.client_id == client_id).all()
    return [
        {
            "id": t.id,
            "clientId": t.client_id,
            "title": t.title,
            "description": t.description,
            "status": t.status,
            "createdDate": t.created_date,
            "resolvedDate": t.resolved_date,
        }
        for t in tickets
    ]

@app.post("/api/tickets", response_model=schemas.TicketResponse, status_code=201)
@limiter.limit(API_RATE_LIMIT)
def create_ticket(
    request: Request,
    ticket: schemas.TicketCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Create a new ticket"""
    # Verify client exists
    client = db.query(models.Client).filter(models.Client.id == ticket.clientId).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    ticket_id = f"tkt-{uuid.uuid4().hex[:8]}"
    db_ticket = models.Ticket(
        id=ticket_id,
        client_id=ticket.clientId,
        title=ticket.title,
        description=ticket.description,
        status=ticket.status,
        created_date=datetime.now(),
    )
    db.add(db_ticket)
    db.commit()
    db.refresh(db_ticket)
    return {
        "id": db_ticket.id,
        "clientId": db_ticket.client_id,
        "title": db_ticket.title,
        "description": db_ticket.description,
        "status": db_ticket.status,
        "createdDate": db_ticket.created_date,
        "resolvedDate": db_ticket.resolved_date,
    }

@app.put("/api/tickets/{ticket_id}", response_model=schemas.TicketResponse)
@limiter.limit(API_RATE_LIMIT)
def update_ticket(
    request: Request,
    ticket_id: str, 
    ticket_update: schemas.TicketUpdate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Update a ticket"""
    db_ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if not db_ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    update_data = ticket_update.model_dump(exclude_unset=True)
    
    # Map camelCase to snake_case
    if "clientId" in update_data:
        db_ticket.client_id = update_data.pop("clientId")
    
    # Handle status changes and resolved_date
    if "status" in update_data:
        new_status = update_data["status"]
        is_resolved = new_status in [models.TicketStatus.Completed, models.TicketStatus.Closed]
        was_resolved = db_ticket.status in [models.TicketStatus.Completed, models.TicketStatus.Closed]
        
        if is_resolved and not was_resolved:
            db_ticket.resolved_date = datetime.now()
        elif not is_resolved and was_resolved:
            db_ticket.resolved_date = None
        db_ticket.status = new_status
        update_data.pop("status")
    
    for field, value in update_data.items():
        setattr(db_ticket, field, value)
    
    db.commit()
    db.refresh(db_ticket)
    return {
        "id": db_ticket.id,
        "clientId": db_ticket.client_id,
        "title": db_ticket.title,
        "description": db_ticket.description,
        "status": db_ticket.status,
        "createdDate": db_ticket.created_date,
        "resolvedDate": db_ticket.resolved_date,
    }

@app.delete("/api/tickets/{ticket_id}", status_code=204)
@limiter.limit(API_RATE_LIMIT)
def delete_ticket(
    request: Request,
    ticket_id: str, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Delete a ticket"""
    db_ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if not db_ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    db.delete(db_ticket)
    db.commit()
    return None

# ========== ASSET ENDPOINTS ==========

@app.get("/api/assets", response_model=List[schemas.AssetResponse])
@limiter.limit(API_RATE_LIMIT)
def get_assets(
    request: Request,
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get all assets"""
    assets = db.query(models.Asset).offset(skip).limit(limit).all()
    return [
        {
            "id": a.id,
            "clientId": a.client_id,
            "name": a.name,
            "type": a.type,
            "purchaseDate": a.purchase_date,
            "warrantyEndDate": a.warranty_end_date,
            "notes": a.notes,
        }
        for a in assets
    ]

@app.get("/api/assets/{asset_id}", response_model=schemas.AssetResponse)
@limiter.limit(API_RATE_LIMIT)
def get_asset(
    request: Request,
    asset_id: str, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get a single asset by ID"""
    asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return {
        "id": asset.id,
        "clientId": asset.client_id,
        "name": asset.name,
        "type": asset.type,
        "purchaseDate": asset.purchase_date,
        "warrantyEndDate": asset.warranty_end_date,
        "notes": asset.notes,
    }

@app.get("/api/clients/{client_id}/assets", response_model=List[schemas.AssetResponse])
@limiter.limit(API_RATE_LIMIT)
def get_assets_by_client(
    request: Request,
    client_id: str, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get all assets for a specific client"""
    assets = db.query(models.Asset).filter(models.Asset.client_id == client_id).all()
    return [
        {
            "id": a.id,
            "clientId": a.client_id,
            "name": a.name,
            "type": a.type,
            "purchaseDate": a.purchase_date,
            "warrantyEndDate": a.warranty_end_date,
            "notes": a.notes,
        }
        for a in assets
    ]

@app.post("/api/assets", response_model=schemas.AssetResponse, status_code=201)
@limiter.limit(API_RATE_LIMIT)
def create_asset(
    request: Request,
    asset: schemas.AssetCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Create a new asset"""
    # Verify client exists
    client = db.query(models.Client).filter(models.Client.id == asset.clientId).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    asset_id = f"ast-{uuid.uuid4().hex[:8]}"
    db_asset = models.Asset(
        id=asset_id,
        client_id=asset.clientId,
        name=asset.name,
        type=asset.type,
        purchase_date=asset.purchaseDate,
        warranty_end_date=asset.warrantyEndDate,
        notes=asset.notes,
    )
    db.add(db_asset)
    db.commit()
    db.refresh(db_asset)
    return {
        "id": db_asset.id,
        "clientId": db_asset.client_id,
        "name": db_asset.name,
        "type": db_asset.type,
        "purchaseDate": db_asset.purchase_date,
        "warrantyEndDate": db_asset.warranty_end_date,
        "notes": db_asset.notes,
    }

@app.put("/api/assets/{asset_id}", response_model=schemas.AssetResponse)
@limiter.limit(API_RATE_LIMIT)
def update_asset(
    request: Request,
    asset_id: str, 
    asset_update: schemas.AssetUpdate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Update an asset"""
    db_asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not db_asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    update_data = asset_update.model_dump(exclude_unset=True)
    
    # Map camelCase to snake_case
    if "clientId" in update_data:
        client_id = update_data.pop("clientId")
        # Verify the new client exists
        client = db.query(models.Client).filter(models.Client.id == client_id).first()
        if not client:
            raise HTTPException(status_code=404, detail="Client not found")
        db_asset.client_id = client_id
    
    if "purchaseDate" in update_data:
        db_asset.purchase_date = update_data.pop("purchaseDate")
    if "warrantyEndDate" in update_data:
        db_asset.warranty_end_date = update_data.pop("warrantyEndDate")
    
    for field, value in update_data.items():
        setattr(db_asset, field, value)
    
    db.commit()
    db.refresh(db_asset)
    return {
        "id": db_asset.id,
        "clientId": db_asset.client_id,
        "name": db_asset.name,
        "type": db_asset.type,
        "purchaseDate": db_asset.purchase_date,
        "warrantyEndDate": db_asset.warranty_end_date,
        "notes": db_asset.notes,
    }

@app.delete("/api/assets/{asset_id}", status_code=204)
@limiter.limit(API_RATE_LIMIT)
def delete_asset(
    request: Request,
    asset_id: str, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Delete an asset"""
    db_asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not db_asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    db.delete(db_asset)
    db.commit()
    return None

@app.get("/")
def root():
    """Health check endpoint - no rate limit for monitoring"""
    logger.info("Root endpoint accessed", extra={"endpoint": "/"})
    return {"message": "Peres Systems MSP API", "status": "running"}

@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    """Enhanced health check endpoint with database connectivity test"""
    try:
        # Test database connection
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    return {
        "status": "healthy",
        "service": "Peres Systems MSP API",
        "database": db_status,
        "timestamp": datetime.now().isoformat(),
    }

@app.get("/favicon.ico")
def favicon():
    """Return 204 No Content for favicon requests"""
    from fastapi import Response
    return Response(status_code=204)

# ========== SERVICE ENDPOINTS ==========

@app.get("/api/services", response_model=List[schemas.ServiceResponse])
@limiter.limit(API_RATE_LIMIT)
def get_services(
    request: Request,
    active_only: bool = False,
    db: Session = Depends(get_db)
):
    """Get all services (public endpoint - no auth required)"""
    query = db.query(models.Service)
    if active_only:
        query = query.filter(models.Service.is_active == True)
    services = query.order_by(models.Service.order.asc(), models.Service.title.asc()).all()
    return services

@app.get("/api/services/{service_id}", response_model=schemas.ServiceResponse)
@limiter.limit(API_RATE_LIMIT)
def get_service(
    request: Request,
    service_id: str,
    db: Session = Depends(get_db)
):
    """Get a specific service by ID (public endpoint - no auth required)"""
    service = db.query(models.Service).filter(models.Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return service

@app.post("/api/services", response_model=schemas.ServiceResponse, status_code=201)
@limiter.limit(API_RATE_LIMIT)
def create_service(
    request: Request,
    service: schemas.ServiceCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Create a new service (admin only)"""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Only admins can create services")
    
    db_service = models.Service(
        title=service.title,
        description=service.description,
        image_url=service.image_url,
        icon_name=service.icon_name,
        order=service.order or "0",
        is_active=service.is_active if service.is_active is not None else True,
    )
    db.add(db_service)
    db.commit()
    db.refresh(db_service)
    return db_service

@app.put("/api/services/{service_id}", response_model=schemas.ServiceResponse)
@limiter.limit(API_RATE_LIMIT)
def update_service(
    request: Request,
    service_id: str,
    service_update: schemas.ServiceUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Update a service (admin only)"""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Only admins can update services")
    
    db_service = db.query(models.Service).filter(models.Service.id == service_id).first()
    if not db_service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    update_data = service_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_service, field, value)
    
    db.commit()
    db.refresh(db_service)
    return db_service

@app.delete("/api/services/{service_id}", status_code=204)
@limiter.limit(API_RATE_LIMIT)
def delete_service(
    request: Request,
    service_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Delete a service (admin only)"""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Only admins can delete services")
    
    db_service = db.query(models.Service).filter(models.Service.id == service_id).first()
    if not db_service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    db.delete(db_service)
    db.commit()
    return None

