#!/usr/bin/env python3
"""
Script to create initial services in the database with appropriate images.
Run this after creating the services table.
"""

import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app import models
import uuid

# Unsplash Source URLs - Free, no API key required
# Format: https://source.unsplash.com/featured/{width}x{height}/?{keywords}
# Using specific curated images for better results

SERVICES = [
    {
        "title": "Cloud Solutions",
        "description": "Scalable and secure cloud infrastructure to power your applications. We partner with major providers to offer tailored solutions.",
        "image_url": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=600&fit=crop",
        "icon_name": "cloud",
        "order": "1",
        "is_active": True
    },
    {
        "title": "Cybersecurity",
        "description": "Protect your digital assets with our comprehensive security services, from threat detection to incident response.",
        "image_url": "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=600&fit=crop",
        "icon_name": "shield",
        "order": "2",
        "is_active": True
    },
    {
        "title": "Managed Databases",
        "description": "Expert management of your database systems, ensuring high availability, performance, and security.",
        "image_url": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop",
        "icon_name": "database",
        "order": "3",
        "is_active": True
    },
    {
        "title": "24/7 IT Support",
        "description": "Our dedicated support team is always available to resolve your technical issues and keep your business running smoothly.",
        "image_url": "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop",
        "icon_name": "headphones",
        "order": "4",
        "is_active": True
    },
    {
        "title": "Network Infrastructure",
        "description": "Design, implementation, and management of robust and reliable network solutions for your enterprise.",
        "image_url": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=600&fit=crop",
        "icon_name": "network",
        "order": "5",
        "is_active": True
    },
    {
        "title": "Custom Software Dev",
        "description": "Bespoke software solutions designed to meet your unique business challenges and goals.",
        "image_url": "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&h=600&fit=crop",
        "icon_name": "code",
        "order": "6",
        "is_active": True
    }
]

def create_initial_services():
    """Create initial services in the database"""
    db = SessionLocal()
    
    try:
        # Check if services already exist
        existing_services = db.query(models.Service).count()
        if existing_services > 0:
            print(f"⚠️  {existing_services} services already exist in the database.")
            response = input("Do you want to add these services anyway? (y/n): ")
            if response.lower() != 'y':
                print("Cancelled.")
                return
        
        created_count = 0
        for service_data in SERVICES:
            # Check if service with same title already exists
            existing = db.query(models.Service).filter(
                models.Service.title == service_data["title"]
            ).first()
            
            if existing:
                print(f"⏭️  Skipping '{service_data['title']}' - already exists")
                continue
            
            service = models.Service(
                id=str(uuid.uuid4()),
                **service_data
            )
            db.add(service)
            created_count += 1
            print(f"✅ Created service: {service_data['title']}")
        
        db.commit()
        print(f"\n✅ Successfully created {created_count} service(s)")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating services: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Creating initial services...")
    print("=" * 50)
    create_initial_services()
    print("=" * 50)
    print("✅ Done!")

