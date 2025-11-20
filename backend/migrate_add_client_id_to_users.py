#!/usr/bin/env python3
"""
Migration script to add client_id column to users table.
This allows linking users (contacts) to clients (customers).
Run this once to update existing database.
"""

from sqlalchemy import text
from app.database import engine

def migrate():
    """Add client_id column to users table"""
    with engine.connect() as conn:
        # Check if client_id column exists
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='users' AND column_name='client_id'
        """))
        client_id_exists = result.fetchone() is not None
        
        if not client_id_exists:
            print("Adding 'client_id' column to users table...")
            # Add client_id column as nullable foreign key
            conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN client_id VARCHAR(255)
            """))
            
            # Add foreign key constraint
            conn.execute(text("""
                ALTER TABLE users 
                ADD CONSTRAINT fk_users_client_id 
                FOREIGN KEY (client_id) 
                REFERENCES clients(id) 
                ON DELETE SET NULL
            """))
            
            # Add index for better query performance
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS ix_users_client_id 
                ON users(client_id)
            """))
            
            print("✅ Added 'client_id' column to users table")
            print("✅ Added foreign key constraint")
            print("✅ Added index on client_id")
        else:
            print("⚠️  'client_id' column already exists")
        
        conn.commit()
        print("Migration completed!")

if __name__ == "__main__":
    migrate()


