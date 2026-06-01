#!/usr/bin/env python
# Updated by GitHub contribution automation.
"""
Complete setup: Initialize DB, create user, load demo data
"""
from pathlib import Path
from app.db import SessionLocal, engine, Base
from app.models.database import User, Memory, Relationship
from app.services.auth import auth_service
from demo_datasets import DEMO_DATASETS
import uuid
from datetime import datetime, timezone

# Initialize database
print("[*] Initializing database...")
Base.metadata.create_all(bind=engine)
print("[OK] Database schema created")

db = SessionLocal()

try:
    # Create or get user
    email = "harshgavand2@gmail.com"
    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        print(f"\n[*] Creating user: {email}")
        user = User(
            email=email,
            full_name="Harsh Gavand",
            hashed_password=auth_service.hash_password("demo123"),
            is_active=True,
            email_verified=True,
            plan="free",
            storage_limit_mb=1000,
            current_storage_bytes=0
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"[✓] User created - ID: {user.id}")
    else:
        print(f"\n[✓] User exists - ID: {user.id}")
    
    user_id = user.id
    
    # Clear existing memories
    old_count = db.query(Memory).filter(Memory.user_id == user_id).count()
    if old_count > 0:
        print(f"\n[*] Clearing {old_count} existing memories...")
        db.query(Memory).filter(Memory.user_id == user_id).delete()
        db.query(Relationship).filter(Relationship.user_id == user_id).delete()
        db.commit()
    
    # Load demo data
    print(f"\n[*] Loading demo datasets...")
    total_memories = 0
    total_relationships = 0
    
    for dataset_key, dataset_info in DEMO_DATASETS.items():
        print(f"\n    [{dataset_info['title']}]")
        
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
        
        print(f"      {len(dataset_info['memories'])} memories, {len(dataset_info['relationships'])} relationships")
    
    db.commit()
    print(f"\n[✓] Demo data loaded!")
    print(f"    Total memories: {total_memories}")
    print(f"    Total relationships: {total_relationships}")
    
    # Verify
    count = db.query(Memory).filter(Memory.user_id == user_id).count()
    print(f"\n[✓] Verification: {count} memories in database for {email}")
    
except Exception as e:
    print(f"\n[✗] Error: {e}")
    import traceback
    traceback.print_exc()
    db.rollback()
finally:
    db.close()
