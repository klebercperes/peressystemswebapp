from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List
import uuid
from datetime import date, datetime
import os

from app.database import get_db, engine, Base
from app import models, schemas
from app.auth import get_current_active_user
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

# CORS middleware - configure from environment variables
# Default origins (no hardcoded IPs - use environment variables)
DEFAULT_CORS_ORIGINS = "http://localhost:5173,http://localhost:3000,http://frontend:5173"
CORS_ORIGINS = os.getenv("CORS_ORIGINS", DEFAULT_CORS_ORIGINS).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept"],
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
        contact_person=client.contactPerson,
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
    # Map camelCase to snake_case
    if "contactPerson" in update_data:
        db_client.contact_person = update_data.pop("contactPerson")
    if "mobilePhone" in update_data:
        db_client.mobile_phone = update_data.pop("mobilePhone")
    
    for field, value in update_data.items():
        setattr(db_client, field, value)
    
    db.commit()
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

