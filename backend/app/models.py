from sqlalchemy import Column, String, Date, DateTime, ForeignKey, Enum as SQLEnum, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum
import uuid

class TicketStatus(str, enum.Enum):
    Open = "Open"
    InProgress = "In Progress"
    Paused = "Paused"
    Completed = "Completed"
    Canceled = "Canceled"
    Closed = "Closed"

class AssetType(str, enum.Enum):
    Laptop = "Laptop"
    Desktop = "Desktop"
    Server = "Server"
    Printer = "Printer"
    Router = "Router"
    Other = "Other"

class Client(Base):
    __tablename__ = "clients"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    abn = Column(String)
    contact_person = Column(String, nullable=False)
    email = Column(String, nullable=False, index=True)
    address = Column(String)
    phone = Column(String)
    mobile_phone = Column(String)
    join_date = Column(Date, nullable=False)
    details = Column(String)
    
    # Relationships
    assets = relationship("Asset", back_populates="client", cascade="all, delete-orphan")
    tickets = relationship("Ticket", back_populates="client", cascade="all, delete-orphan")
    users = relationship("User", back_populates="client")  # Users/Contacts linked to this client

class Asset(Base):
    __tablename__ = "assets"
    
    id = Column(String, primary_key=True, index=True)
    client_id = Column(String, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    type = Column(SQLEnum(AssetType), nullable=False)
    purchase_date = Column(Date, nullable=False)
    warranty_end_date = Column(Date, nullable=False)
    notes = Column(String)
    
    # Relationships
    client = relationship("Client", back_populates="assets")

class Ticket(Base):
    __tablename__ = "tickets"
    
    id = Column(String, primary_key=True, index=True)
    client_id = Column(String, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    status = Column(SQLEnum(TicketStatus), nullable=False, default=TicketStatus.Open)
    created_date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    resolved_date = Column(DateTime(timezone=True))
    
    # Relationships
    client = relationship("Client", back_populates="tickets")

class UserRole(str, enum.Enum):
    customer = "customer"
    team = "team"

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=True, index=True)  # Nullable for email-only signup
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=True)  # Nullable for OAuth users and email-only signup
    full_name = Column(String)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    role = Column(SQLEnum(UserRole), default=UserRole.customer, nullable=False)  # customer or team
    client_id = Column(String, ForeignKey("clients.id", ondelete="SET NULL"), nullable=True, index=True)  # Link user to client (contact)
    google_id = Column(String, unique=True, nullable=True, index=True)  # For Google OAuth
    email_verified = Column(Boolean, default=False, nullable=False)  # Email verification status
    verification_token = Column(String, unique=True, nullable=True, index=True)  # Email verification token
    verification_token_expires = Column(DateTime(timezone=True), nullable=True)  # Token expiration
    password_reset_token = Column(String, unique=True, nullable=True, index=True)  # Password reset token
    password_reset_token_expires = Column(DateTime(timezone=True), nullable=True)  # Password reset token expiration
    is_approved = Column(Boolean, default=False, nullable=False)  # Admin approval status - new users need approval
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    client = relationship("Client", back_populates="users")

class BusinessSettings(Base):
    __tablename__ = "business_settings"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    trading_name = Column(String)
    business_name = Column(String)
    abn = Column(String)
    company_logo_url = Column(String)  # URL to logo image
    address_line1 = Column(String)
    address_line2 = Column(String)
    city = Column(String)
    state = Column(String)
    postcode = Column(String)
    country = Column(String, default="Australia")
    phone_number = Column(String)
    mobile_number = Column(String)
    email_contact = Column(String)
    linkedin_url = Column(String)
    instagram_url = Column(String)
    facebook_url = Column(String)
    twitter_url = Column(String)  # X/Twitter
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

class Service(Base):
    __tablename__ = "services"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False, index=True)
    description = Column(String, nullable=False)
    image_url = Column(String, nullable=False)  # URL to service image
    icon_name = Column(String)  # Icon identifier (e.g., "cloud", "shield", "database")
    order = Column(String, default="0")  # Display order (as string for flexibility)
    is_active = Column(Boolean, default=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

