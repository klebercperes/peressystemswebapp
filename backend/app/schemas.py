from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date, datetime
from app.models import TicketStatus, AssetType
import uuid

# Client Schemas
class ClientBase(BaseModel):
    name: str
    abn: Optional[str] = None
    contactPerson: Optional[str] = None  # Deprecated - use linked contacts instead
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

# Authentication Schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: Optional[str] = None  # Optional for email-only signup
    role: Optional[str] = "customer"  # Default to customer for signups

class EmailSignupRequest(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class EmailVerificationRequest(BaseModel):
    token: str
    password: Optional[str] = None  # Optional - can set password during verification

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

class AdminPasswordReset(BaseModel):
    user_id: str
    new_password: str

class UserUpdate(BaseModel):
    """Schema for updating user information"""
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None  # Admin can update password
    is_active: Optional[bool] = None
    is_superuser: Optional[bool] = None
    role: Optional[str] = None
    client_id: Optional[str] = None  # Link user to client (contact)
    email_verified: Optional[bool] = None
    is_approved: Optional[bool] = None  # Admin approval status

    class Config:
        from_attributes = True

# Business Settings Schemas
class BusinessSettingsBase(BaseModel):
    trading_name: Optional[str] = None
    business_name: Optional[str] = None
    abn: Optional[str] = None
    company_logo_url: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postcode: Optional[str] = None
    country: Optional[str] = None
    phone_number: Optional[str] = None
    mobile_number: Optional[str] = None
    email_contact: Optional[EmailStr] = None
    linkedin_url: Optional[str] = None
    instagram_url: Optional[str] = None
    facebook_url: Optional[str] = None
    twitter_url: Optional[str] = None

    class Config:
        from_attributes = True

class BusinessSettingsCreate(BusinessSettingsBase):
    pass

class BusinessSettingsUpdate(BusinessSettingsBase):
    pass

class BusinessSettingsResponse(BusinessSettingsBase):
    id: str
    updated_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True

class UserResponse(UserBase):
    id: str
    is_active: bool
    is_superuser: bool
    role: str
    client_id: Optional[str] = None  # Link to client (contact)
    email_verified: bool
    is_approved: bool  # Admin approval status
    created_at: datetime
    
    class Config:
        from_attributes = True

class GoogleOAuthRequest(BaseModel):
    token: str  # Google ID token

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class LoginRequest(BaseModel):
    """Schema for login with CAPTCHA"""
    username: str
    password: str
    captcha_token: Optional[str] = None  # reCAPTCHA token

class RegisterRequest(BaseModel):
    """Schema for registration with CAPTCHA"""
    username: str
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    captcha_token: Optional[str] = None  # reCAPTCHA token

class TokenData(BaseModel):
    username: Optional[str] = None

# Service Schemas
class ServiceBase(BaseModel):
    title: str
    description: str
    image_url: str
    icon_name: Optional[str] = None
    order: Optional[str] = "0"
    is_active: Optional[bool] = True

    class Config:
        from_attributes = True

class ServiceCreate(ServiceBase):
    pass

class ServiceUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    icon_name: Optional[str] = None
    order: Optional[str] = None
    is_active: Optional[bool] = None

    class Config:
        from_attributes = True

class ServiceResponse(ServiceBase):
    id: str
    updated_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True

