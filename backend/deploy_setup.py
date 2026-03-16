#!/usr/bin/env python3
"""
Deployment setup script for Neon DB
This script initializes the database tables and performs necessary setup for deployment
"""

import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Load environment variables
load_dotenv()

# Import our models and database configuration
from database import DATABASE_URL, Base, engine
import models

def create_tables():
    """Create all database tables"""
    try:
        print("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully!")
        return True
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        return False

def test_connection():
    """Test database connection"""
    try:
        print("Testing database connection...")
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        # Test basic query
        result = db.execute(text("SELECT 1 as test"))
        test_value = result.fetchone()[0]
        
        if test_value == 1:
            print("✅ Database connection successful!")
            db.close()
            return True
        else:
            print("❌ Database connection test failed")
            db.close()
            return False
            
    except Exception as e:
        print(f"❌ Database connection error: {e}")
        return False

def verify_tables():
    """Verify that all required tables exist"""
    try:
        print("Verifying database tables...")
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        # List of expected tables
        expected_tables = [
            'users',
            'user_sessions', 
            'user_subscriptions',
            'payment_history',
            'search_history',
            'business_recommendations',
            'business_reviews',
            'notifications'
        ]
        
        # Check if tables exist
        for table_name in expected_tables:
            try:
                result = db.execute(text(f"SELECT COUNT(*) FROM {table_name}"))
                count = result.fetchone()[0]
                print(f"  ✅ Table '{table_name}' exists (rows: {count})")
            except Exception as e:
                print(f"  ❌ Table '{table_name}' missing or error: {e}")
                db.close()
                return False
        
        db.close()
        print("✅ All required tables verified!")
        return True
        
    except Exception as e:
        print(f"❌ Error verifying tables: {e}")
        return False

def main():
    """Main deployment setup function"""
    print("🚀 Starting Neon DB deployment setup...")
    print(f"Database URL: {DATABASE_URL[:50]}...")
    
    # Step 1: Test connection
    if not test_connection():
        print("❌ Deployment failed: Cannot connect to database")
        sys.exit(1)
    
    # Step 2: Create tables
    if not create_tables():
        print("❌ Deployment failed: Cannot create tables")
        sys.exit(1)
    
    # Step 3: Verify tables
    if not verify_tables():
        print("❌ Deployment failed: Table verification failed")
        sys.exit(1)
    
    print("🎉 Neon DB deployment setup completed successfully!")
    print("Your application is ready for deployment!")

if __name__ == "__main__":
    main()