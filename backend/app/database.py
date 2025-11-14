from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Database URL from environment variable (required in production)
# If not set, will use default for development (should be set via .env file)
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://msp_user:msp_password@postgres:5432/msp_db"  # Fallback for development only
)

# Configure connection pool for production
engine = create_engine(
    DATABASE_URL,
    pool_size=10,  # Number of connections to maintain
    max_overflow=20,  # Maximum number of connections beyond pool_size
    pool_pre_ping=True,  # Verify connections before using
    pool_recycle=3600,  # Recycle connections after 1 hour
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """Dependency for getting database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

