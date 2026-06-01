#!/usr/bin/env python
# Updated by GitHub contribution automation.
"""Initialize database and load demo data"""

from app.db import SessionLocal, engine, Base
from app.models.database import User, Memory, Relationship, Subscription
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
            auth_method="email",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Create subscription
        subscription = Subscription(
            user_id=user.id,
            plan="free",
            status="active",
            storage_limit_mb=1000,
            current_storage_bytes=0
        )
        db.add(subscription)
        db.commit()
        
        print(f"[OK] User created - ID: {user.id}")
    else:
        print(f"\n[OK] User exists - ID: {user.id}")
    
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
                id=memory_data['id'],
                user_id=user_id,
                title=memory_data['title'],
                raw_text=memory_data.get('raw_text', ''),
                structured_data=memory_data.get('structured_data', {}),
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            )
            db.add(memory)
            total_memories += 1
        
        db.flush()
        
        # Load relationships (stored as tuples, not dicts)
        for rel_tuple in dataset_info.get('relationships', []):
            source, relation, target = rel_tuple
            rel = Relationship(
                id=str(uuid.uuid4()),
                user_id=user_id,
                source_id=source,
                source_type="text",
                target_id=target,
                target_type="text",
                relation=relation,
            )
            db.add(rel)
            total_relationships += 1
        
        db.commit()
        print(f"        - {len(dataset_info['memories'])} memories, {len(dataset_info.get('relationships', []))} relationships")
    
    print(f"\n[OK] Setup complete!")
    print(f"    - Total memories: {total_memories}")
    print(f"    - Total relationships: {total_relationships}")
    
except Exception as e:
    print(f"\n[FAIL] Error: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()
