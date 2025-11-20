#!/usr/bin/env python3
"""
Migration script to add email verification fields to User model
"""
from sqlalchemy import text
from app.database import engine
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrate():
    """Add email verification columns to users table"""
    with engine.connect() as conn:
        try:
            # Check if columns already exist
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'users' 
                AND column_name IN ('email_verified', 'verification_token', 'verification_token_expires')
            """))
            existing_columns = [row[0] for row in result]
            
            # Make username nullable
            if 'username' not in existing_columns or True:  # Always check
                try:
                    conn.execute(text("ALTER TABLE users ALTER COLUMN username DROP NOT NULL"))
                    logger.info("✅ Made username column nullable")
                except Exception as e:
                    logger.warning(f"Username column update: {e}")
            
            # Add email_verified column
            if 'email_verified' not in existing_columns:
                conn.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT TRUE
                """))
                logger.info("✅ Added email_verified column")
            else:
                logger.info("⏭️  email_verified column already exists")
            
            # Add verification_token column
            if 'verification_token' not in existing_columns:
                conn.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN verification_token VARCHAR UNIQUE
                """))
                logger.info("✅ Added verification_token column")
            else:
                logger.info("⏭️  verification_token column already exists")
            
            # Add verification_token_expires column
            if 'verification_token_expires' not in existing_columns:
                conn.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN verification_token_expires TIMESTAMP WITH TIME ZONE
                """))
                logger.info("✅ Added verification_token_expires column")
            else:
                logger.info("⏭️  verification_token_expires column already exists")
            
            # Create index on verification_token if it doesn't exist
            try:
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS ix_users_verification_token 
                    ON users(verification_token)
                """))
                logger.info("✅ Created index on verification_token")
            except Exception as e:
                logger.warning(f"Index creation: {e}")
            
            conn.commit()
            logger.info("\n✅ Migration complete!")
            return True
            
        except Exception as e:
            conn.rollback()
            logger.error(f"❌ Migration failed: {e}")
            return False

if __name__ == "__main__":
    success = migrate()
    exit(0 if success else 1)

