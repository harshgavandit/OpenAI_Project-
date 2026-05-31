#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Demo data loader for MemoryGraph
Run this script to populate the database with demo data for testing
"""
import sys
import uuid
from datetime import datetime, timezone
from app.db import SessionLocal
from app.models.database import User, Memory, Relationship, Subscription
from app.services.auth import auth_service
from demo_datasets import DEMO_DATASETS

def load_demo_data():
    """Load demo datasets into the database"""
    db = SessionLocal()
    
    try:
        # Create a demo user
        user_id = str(uuid.uuid4())
        demo_user = User(
            id=user_id,
            email="demo@memorygraph.com",
            full_name="Demo User",
            hashed_password=auth_service.hash_password("demo123456"),
            is_active=True,
            email_verified=True,
            google_id=None,
            auth_method="email",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        
        # Create subscription for demo user
        subscription = Subscription(
            id=str(uuid.uuid4()),
            user_id=user_id,
            plan="free",
            status="active",
            storage_limit_mb=500,
            current_storage_bytes=0,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        
        db.add(demo_user)
        db.add(subscription)
        db.commit()
        
        print("[+] Demo user created: demo@memorygraph.com / demo123456")
        print("[+] Demo user ID: " + user_id)
        
        # Load demo datasets
        for dataset_key, dataset_info in DEMO_DATASETS.items():
            print("\n[*] Loading dataset: " + dataset_info['title'])
            
            # Add memories
            for memory_data in dataset_info['memories']:
                memory = Memory(
                    id=f"{dataset_key}_{memory_data['id']}",
                    user_id=user_id,
                    title=memory_data['title'],
                    summary=memory_data['summary'],
                    raw_text=memory_data['raw_text'],
                    structured_data=memory_data['structured_data'],
                    metadata_json={
                        "source": "demo_dataset",
                        "dataset": dataset_key
                    },
                    status="completed",
                    processing_stage="completed",
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc),
                )
                db.add(memory)
                print("    [+] Added memory: " + memory_data['title'])
            
            # Add relationships
            for source, relation, target in dataset_info['relationships']:
                relationship = Relationship(
                    id=str(uuid.uuid4()),
                    user_id=user_id,
                    source_type="entity",
                    source_id=source,
                    relation=relation,
                    target_type="entity",
                    target_id=target,
                    created_at=datetime.now(timezone.utc),
                )
                db.add(relationship)
            
            print("    [+] Added " + str(len(dataset_info['relationships'])) + " relationships")
        
        db.commit()
        print("\n[OK] Demo data loaded successfully!")
        print("\n[CREDS] You can now login with:")
        print("    Email: demo@memorygraph.com")
        print("    Password: demo123456")
        
    except Exception as e:
        db.rollback()
        print("[ERROR] Error loading demo data: " + str(e))
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    load_demo_data()
