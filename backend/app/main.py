from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import uuid
from datetime import date, datetime

from app.database import get_db, engine, Base
from app import models, schemas

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Peres Systems MSP API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://10.0.1.122:5173",
        "http://10.0.1.122:3000",
        "http://frontend:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========== CLIENT ENDPOINTS ==========

@app.get("/api/clients", response_model=List[schemas.ClientResponse])
def get_clients(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
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
def get_client(client_id: str, db: Session = Depends(get_db)):
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
def create_client(client: schemas.ClientCreate, db: Session = Depends(get_db)):
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
def update_client(client_id: str, client_update: schemas.ClientUpdate, db: Session = Depends(get_db)):
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
def delete_client(client_id: str, db: Session = Depends(get_db)):
    """Delete a client"""
    db_client = db.query(models.Client).filter(models.Client.id == client_id).first()
    if not db_client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    db.delete(db_client)
    db.commit()
    return None

# ========== TICKET ENDPOINTS ==========

@app.get("/api/tickets", response_model=List[schemas.TicketResponse])
def get_tickets(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
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
def get_ticket(ticket_id: str, db: Session = Depends(get_db)):
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
def get_tickets_by_client(client_id: str, db: Session = Depends(get_db)):
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
def create_ticket(ticket: schemas.TicketCreate, db: Session = Depends(get_db)):
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
def update_ticket(ticket_id: str, ticket_update: schemas.TicketUpdate, db: Session = Depends(get_db)):
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
def delete_ticket(ticket_id: str, db: Session = Depends(get_db)):
    """Delete a ticket"""
    db_ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if not db_ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    db.delete(db_ticket)
    db.commit()
    return None

# ========== ASSET ENDPOINTS ==========

@app.get("/api/assets", response_model=List[schemas.AssetResponse])
def get_assets(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
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
def get_asset(asset_id: str, db: Session = Depends(get_db)):
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
def get_assets_by_client(client_id: str, db: Session = Depends(get_db)):
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
def create_asset(asset: schemas.AssetCreate, db: Session = Depends(get_db)):
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
def update_asset(asset_id: str, asset_update: schemas.AssetUpdate, db: Session = Depends(get_db)):
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
def delete_asset(asset_id: str, db: Session = Depends(get_db)):
    """Delete an asset"""
    db_asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not db_asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    db.delete(db_asset)
    db.commit()
    return None

@app.get("/")
def root():
    """Health check endpoint"""
    return {"message": "Peres Systems MSP API", "status": "running"}

@app.get("/favicon.ico")
def favicon():
    """Return 204 No Content for favicon requests"""
    from fastapi import Response
    return Response(status_code=204)

