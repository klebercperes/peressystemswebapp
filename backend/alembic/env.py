from logging.config import fileConfig
import os
import sys

from sqlalchemy import engine_from_config, create_engine
from sqlalchemy import pool

from alembic import context

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Get DATABASE_URL from environment variable (same as app uses)
# Fallback to default if not set (for development)
database_url = os.getenv(
    "DATABASE_URL",
    "postgresql://msp_user:msp_password@postgres:5432/msp_db"
)
config.set_main_option("sqlalchemy.url", database_url)

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Add the app directory to the path so we can import our models
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# Import Base and all models for autogenerate support
from app.database import Base
from app import models

target_metadata = Base.metadata

def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    database_url = os.getenv(
        "DATABASE_URL",
        config.get_main_option("sqlalchemy.url")
    )
    connectable = create_engine(database_url, poolclass=pool.NullPool)
    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
