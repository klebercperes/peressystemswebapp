from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date, datetime
from app.models import TicketStatus, AssetType

# Client Schemas
class ClientBase(BaseModel):
    name: str
    abn: Optional[str] = None
    contactPerson: str
    email: EmailStr
    address: Optional[str] = None
    phone: Optional[str] = None
    mobilePhone: Optional[str] = None
    details: Optional[str] = None

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "name": "Innovate Corp",
                "abn": "53 004 085 616",
                "contactPerson": "Alice Johnson",
                "email": "alice@innovate.com",
                "phone": "123-456-7890",
                "mobilePhone": "0412 345 678",
                "address": "123 Innovation Dr, Tech City",
                "details": "VIP client"
            }
        }

class ClientCreate(ClientBase):
    pass

class ClientUpdate(BaseModel):
    name: Optional[str] = None
    abn: Optional[str] = None
    contactPerson: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    mobilePhone: Optional[str] = None
    details: Optional[str] = None

    class Config:
        populate_by_name = True

class ClientResponse(ClientBase):
    id: str
    joinDate: date
    
    class Config:
        from_attributes = True
        populate_by_name = True

# Asset Schemas
class AssetBase(BaseModel):
    clientId: str
    name: str
    type: AssetType
    purchaseDate: date
    warrantyEndDate: date
    notes: Optional[str] = None

    class Config:
        populate_by_name = True

class AssetCreate(AssetBase):
    pass

class AssetUpdate(BaseModel):
    clientId: Optional[str] = None
    name: Optional[str] = None
    type: Optional[AssetType] = None
    purchaseDate: Optional[date] = None
    warrantyEndDate: Optional[date] = None
    notes: Optional[str] = None

    class Config:
        populate_by_name = True

class AssetResponse(AssetBase):
    id: str
    
    class Config:
        from_attributes = True
        populate_by_name = True

# Ticket Schemas
class TicketBase(BaseModel):
    clientId: str
    title: str
    description: str
    status: TicketStatus = TicketStatus.Open

    class Config:
        populate_by_name = True

class TicketCreate(TicketBase):
    pass

class TicketUpdate(BaseModel):
    clientId: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TicketStatus] = None

    class Config:
        populate_by_name = True

class TicketResponse(TicketBase):
    id: str
    createdDate: datetime
    resolvedDate: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        populate_by_name = True

