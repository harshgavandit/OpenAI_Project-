#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Load demo data for existing user (Harsh Gavand)
"""
import sys
import uuid
from datetime import datetime, timezone
from app.db import SessionLocal
from app.models.database import User, Memory, Relationship
from demo_datasets import DEMO_DATASETS

def load_demo_for_user(email: str):
    """Load demo datasets for an existing user"""
    db = SessionLocal()
    
    try:
        # Find existing user
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"[ERROR] User with email '{email}' not found!")
            print(f"[INFO] Available users:")
            all_users = db.query(User).all()
            for u in all_users:
                print(f"       - {u.email}")
            return False
        
        user_id = user.id
        print(f"[+] Found user: {user.full_name} ({email})")
        print(f"[+] User ID: {user_id}")
        
        # Clear existing memories and relationships for this user
        old_memories = db.query(Memory).filter(Memory.user_id == user_id).count()
        old_relationships = db.query(Relationship).filter(Relationship.user_id == user_id).count()
        
        if old_memories > 0 or old_relationships > 0:
            print(f"\n[*] Clearing existing data...")
            print(f"    Deleting {old_memories} memories")
            print(f"    Deleting {old_relationships} relationships")
            db.query(Memory).filter(Memory.user_id == user_id).delete()
            db.query(Relationship).filter(Relationship.user_id == user_id).delete()
            db.commit()
        
        # Load demo datasets
        total_memories = 0
        total_relationships = 0
        
        for dataset_key, dataset_info in DEMO_DATASETS.items():
            print(f"\n[*] Loading dataset: {dataset_info['title']}")
            
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
                total_memories += 1
                print(f"    [+] {memory_data['title']}")
            
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
                total_relationships += 1
            
            print(f"    [+] Added {len(dataset_info['relationships'])} relationships")
        
        db.commit()
        
        print(f"\n[OK] Success!")
        print(f"[*] Total memories loaded: {total_memories}")
        print(f"[*] Total relationships: {total_relationships}")
        print(f"\n[NEXT] Reload the frontend to see the data!")
        
        return True
        
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Failed to load demo data: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    # Get email from command line or use default
    email = sys.argv[1] if len(sys.argv) > 1 else "harsh@example.com"
    
    print(f"[*] Loading demo data for: {email}")
    print(f"[*] This will replace any existing memories for this user\n")
    
    success = load_demo_for_user(email)
    sys.exit(0 if success else 1)
