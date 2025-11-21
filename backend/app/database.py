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
# Replace container name with service name for Docker networking
if DATABASE_URL and 'msp_postgres' in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace('msp_postgres', 'postgres')

engine = create_engine(
    DATABASE_URL,
    pool_size=10,  # Number of connections to maintain
    max_overflow=20,  # Maximum number of connections beyond pool_size
    pool_pre_ping=True,  # Verify connections before using (reconnects if stale)
    pool_recycle=3600,  # Recycle connections after 1 hour
    connect_args={
        "connect_timeout": 10,  # Connection timeout in seconds
        "keepalives": 1,  # Enable TCP keepalives
        "keepalives_idle": 30,  # Start keepalives after 30 seconds of idle
        "keepalives_interval": 10,  # Send keepalive every 10 seconds
        "keepalives_count": 5,  # Number of keepalives before considering connection dead
    }
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

