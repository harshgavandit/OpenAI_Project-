#!/usr/bin/env python
"""
Load demo data for harshgavand2@gmail.com user
"""
import sys
from sqlalchemy.orm import Session
from app.db import SessionLocal, engine
from app.models.database import Base, User
from app.services.auth import auth_service
from demo_datasets import datasets

def load_demo_data():
    """Load demo data into the database"""
    db = SessionLocal()
    
    try:
        # Create tables if they don't exist
        Base.metadata.create_all(bind=engine)
        
        # Check if user exists
        user_email = "harshgavand2@gmail.com"
        user = db.query(User).filter(User.email == user_email).first()
        
        if not user:
            print(f"Creating user: {user_email}")
            user = User(
                email=user_email,
                full_name="Harsh Gavand",
                hashed_password=auth_service.hash_password("demo123"),
                is_active=True,
                email_verified=True,
                plan="free",
                storage_limit_mb=1000
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"✓ User created with ID: {user.id}")
        else:
            print(f"User already exists: {user.id}")
        
        # Load datasets
        from demo_datasets import load_all_datasets
        load_all_datasets(db, user.id)
        
        # Verify data
        from sqlalchemy import func
        from app.models.database import Memory, Relationship
        
        memory_count = db.query(func.count(Memory.id)).filter(Memory.user_id == user.id).scalar()
        relationship_count = db.query(func.count(Relationship.id)).filter(Relationship.user_id == user.id).scalar()
        
        print(f"\n✓ Data loaded successfully!")
        print(f"  Memories: {memory_count}")
        print(f"  Relationships: {relationship_count}")
        print(f"\nYou can now login with:")
        print(f"  Email: {user_email}")
        print(f"  Password: demo123")
        
    except Exception as e:
        print(f"✗ Error loading data: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    load_demo_data()
