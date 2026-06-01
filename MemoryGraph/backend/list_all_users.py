# Updated by GitHub contribution automation.
from app.db import SessionLocal
from app.models.database import User

db = SessionLocal()

users = db.query(User).all()
print(f"Total users: {len(users)}\n")

for u in users:
    print(f"Email: {u.email}")
    print(f"  ID: {u.id}")
    print(f"  Name: {u.full_name}")
    print(f"  Google ID: {u.google_id}")
    print(f"  Auth Method: {u.auth_method}")
    
    # Count memories
    from sqlalchemy import func
    from app.models.database import Memory
    count = db.query(func.count(Memory.id)).filter(Memory.user_id == u.id).scalar()
    print(f"  Memories: {count}\n")

db.close()
