#!/usr/bin/env python3
"""
Migration script to add role and google_id columns to users table.
Run this once to update existing database.
"""

from sqlalchemy import text
from app.database import engine

def migrate():
    """Add role and google_id columns to users table"""
    with engine.connect() as conn:
        # Check if role column exists
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='users' AND column_name='role'
        """))
        role_exists = result.fetchone() is not None
        
        if not role_exists:
            print("Adding 'role' column to users table...")
            # Add role column with default value 'customer'
            conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN role VARCHAR(20) DEFAULT 'customer' NOT NULL
            """))
            # Update existing users: superusers become 'team', others stay 'customer'
            conn.execute(text("""
                UPDATE users 
                SET role = CASE 
                    WHEN is_superuser = true THEN 'team' 
                    ELSE 'customer' 
                END
            """))
            print("✅ Added 'role' column")
        else:
            print("⚠️  'role' column already exists")
        
        # Check if google_id column exists
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='users' AND column_name='google_id'
        """))
        google_id_exists = result.fetchone() is not None
        
        if not google_id_exists:
            print("Adding 'google_id' column to users table...")
            conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN google_id VARCHAR(255) UNIQUE
            """))
            print("✅ Added 'google_id' column")
        else:
            print("⚠️  'google_id' column already exists")
        
        # Make hashed_password nullable (for OAuth users)
        result = conn.execute(text("""
            SELECT is_nullable 
            FROM information_schema.columns 
            WHERE table_name='users' AND column_name='hashed_password'
        """))
        if result.fetchone()[0] == 'NO':
            print("Making 'hashed_password' nullable...")
            conn.execute(text("""
                ALTER TABLE users 
                ALTER COLUMN hashed_password DROP NOT NULL
            """))
            print("✅ Made 'hashed_password' nullable")
        else:
            print("⚠️  'hashed_password' is already nullable")
        
        conn.commit()
        print("\n✅ Migration complete!")

if __name__ == "__main__":
    migrate()

