#!/usr/bin/env python3
from sqlalchemy import create_engine, text
import os

DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://msp_user:msp_password@postgres:5432/msp_db')
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    # Check if table exists
    result = conn.execute(text("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'business_settings'
    """))
    exists = result.fetchone() is not None
    
    if not exists:
        print("Creating business_settings table...")
        conn.execute(text("""
            CREATE TABLE business_settings (
                id VARCHAR NOT NULL PRIMARY KEY,
                trading_name VARCHAR,
                business_name VARCHAR,
                abn VARCHAR,
                company_logo_url VARCHAR,
                address_line1 VARCHAR,
                address_line2 VARCHAR,
                city VARCHAR,
                state VARCHAR,
                postcode VARCHAR,
                country VARCHAR DEFAULT 'Australia',
                phone_number VARCHAR,
                mobile_number VARCHAR,
                email_contact VARCHAR,
                linkedin_url VARCHAR,
                instagram_url VARCHAR,
                facebook_url VARCHAR,
                twitter_url VARCHAR,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
            )
        """))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_business_settings_id ON business_settings(id)"))
        conn.commit()
        print("Business settings table created successfully!")
    else:
        print("Business settings table already exists")

