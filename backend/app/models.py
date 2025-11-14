from sqlalchemy import Column, String, Date, DateTime, ForeignKey, Enum as SQLEnum, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum

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

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

