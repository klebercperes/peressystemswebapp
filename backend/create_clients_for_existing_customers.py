#!/usr/bin/env python3
"""
Script to create Client records for existing customer users who don't have one.
Run this to fix customers who signed up before the auto-client-creation feature.
"""

from sqlalchemy.orm import Session
from datetime import date
import uuid

from app.database import SessionLocal
from app import models

def create_clients_for_customers():
    """Create Client records for customer users without one"""
    db: Session = SessionLocal()
    try:
        # Get all customer users
        customer_users = db.query(models.User).filter(models.User.role == models.UserRole.customer).all()
        
        created_count = 0
        skipped_count = 0
        
        print("=" * 60)
        print("Creating Client records for existing customers")
        print("=" * 60)
        print()
        
        for user in customer_users:
            # Check if client already exists for this email
            existing_client = db.query(models.Client).filter(models.Client.email == user.email).first()
            
            if existing_client:
                print(f"⏭️  Skipped: {user.email} (Client already exists: {existing_client.id})")
                skipped_count += 1
                continue
            
            # Create new client
            client_id = f"cli-{uuid.uuid4().hex[:8]}"
            client_name = user.full_name or user.username
            
            db_client = models.Client(
                id=client_id,
                name=client_name,
                contact_person=client_name,
                email=user.email,
                phone="",  # Can be updated later
                mobile_phone="",
                join_date=date.today(),
                details=f"Client record created for existing customer user: {user.id}",
            )
            db.add(db_client)
            created_count += 1
            print(f"✅ Created: {user.email} → Client ID: {client_id}")
        
        db.commit()
        
        print()
        print("=" * 60)
        print(f"✅ Complete!")
        print(f"   Created: {created_count} client(s)")
        print(f"   Skipped: {skipped_count} client(s) (already exist)")
        print("=" * 60)
        
        return created_count > 0
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    success = create_clients_for_customers()
    exit(0 if success else 1)

