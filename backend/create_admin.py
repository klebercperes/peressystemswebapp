#!/usr/bin/env python3
"""
Script to create an administrator user.
Usage: python create_admin.py [username] [email] [password]
"""

import sys
import uuid
from sqlalchemy.orm import Session

from app.database import SessionLocal, engine, Base
from app import models
from app.auth import get_password_hash, get_user_by_username, get_user_by_email

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)


def create_admin_user(username: str, email: str, password: str, full_name: str = None):
    """Create an administrator user"""
    db: Session = SessionLocal()
    try:
        # Check if username already exists
        existing_user = get_user_by_username(db, username)
        if existing_user:
            print(f"❌ Error: Username '{username}' already exists!")
            return False
        
        # Check if email already exists
        existing_user = get_user_by_email(db, email)
        if existing_user:
            print(f"❌ Error: Email '{email}' already exists!")
            return False
        
        # Create admin user
        user_id = f"usr-{uuid.uuid4().hex[:8]}"
        hashed_password = get_password_hash(password)
        
        admin_user = models.User(
            id=user_id,
            username=username,
            email=email,
            full_name=full_name or "Administrator",
            hashed_password=hashed_password,
            is_active=True,
            is_superuser=True,  # Admin user
        )
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print(f"✅ Administrator user created successfully!")
        print(f"   Username: {username}")
        print(f"   Email: {email}")
        print(f"   Full Name: {admin_user.full_name}")
        print(f"   User ID: {admin_user.id}")
        print(f"   Is Superuser: {admin_user.is_superuser}")
        print(f"\n⚠️  Keep these credentials secure!")
        
        return True
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating admin user: {e}")
        return False
    finally:
        db.close()


def main():
    if len(sys.argv) < 4:
        print("Usage: python create_admin.py <username> <email> <password> [full_name]")
        print("\nExample:")
        print("  python create_admin.py admin admin@example.com SecurePass123 'Admin User'")
        sys.exit(1)
    
    username = sys.argv[1]
    email = sys.argv[2]
    password = sys.argv[3]
    full_name = sys.argv[4] if len(sys.argv) > 4 else None
    
    if len(password) < 8:
        print("⚠️  Warning: Password is less than 8 characters. Consider using a stronger password.")
        response = input("Continue anyway? (y/N): ")
        if response.lower() != 'y':
            print("Cancelled.")
            sys.exit(0)
    
    success = create_admin_user(username, email, password, full_name)
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()

