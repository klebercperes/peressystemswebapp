#!/usr/bin/env python3
"""
Interactive script to create an administrator user.
"""

import getpass
import uuid
from sqlalchemy.orm import Session

from app.database import SessionLocal, engine, Base
from app import models
from app.auth import get_password_hash, get_user_by_username, get_user_by_email

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)


def create_admin_user():
    """Interactive function to create an administrator user"""
    db: Session = SessionLocal()
    try:
        print("=" * 50)
        print("Create Administrator Account")
        print("=" * 50)
        print()
        
        # Get username
        username = input("Enter username: ").strip()
        if not username:
            print("❌ Username cannot be empty!")
            return False
        
        # Check if username exists
        existing_user = get_user_by_username(db, username)
        if existing_user:
            print(f"❌ Username '{username}' already exists!")
            return False
        
        # Get email
        email = input("Enter email: ").strip()
        if not email:
            print("❌ Email cannot be empty!")
            return False
        
        # Check if email exists
        existing_user = get_user_by_email(db, email)
        if existing_user:
            print(f"❌ Email '{email}' already exists!")
            return False
        
        # Get full name (optional)
        full_name = input("Enter full name (optional): ").strip() or None
        
        # Get password
        while True:
            password = getpass.getpass("Enter password: ")
            if len(password) < 8:
                print("⚠️  Password must be at least 8 characters long.")
                continue
            
            password_confirm = getpass.getpass("Confirm password: ")
            if password != password_confirm:
                print("❌ Passwords do not match! Please try again.")
                continue
            
            break
        
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
        
        print()
        print("=" * 50)
        print("✅ Administrator user created successfully!")
        print("=" * 50)
        print(f"Username: {username}")
        print(f"Email: {email}")
        print(f"Full Name: {admin_user.full_name}")
        print(f"User ID: {admin_user.id}")
        print(f"Is Superuser: {admin_user.is_superuser}")
        print()
        print("⚠️  Keep these credentials secure!")
        print("=" * 50)
        
        return True
        
    except KeyboardInterrupt:
        print("\n\n❌ Cancelled by user.")
        db.rollback()
        return False
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating admin user: {e}")
        return False
    finally:
        db.close()


if __name__ == "__main__":
    create_admin_user()

