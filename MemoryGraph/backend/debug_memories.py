from app.db import SessionLocal
from app.models.database import User, Memory
from sqlalchemy import func

db = SessionLocal()

# Get the user
user = db.query(User).filter(User.email == "harshgavand2@gmail.com").first()
if not user:
    print("User not found!")
    db.close()
    exit(1)

print(f"User: {user.full_name} ({user.email})")
print(f"User ID: {user.id}\n")

# Count memories
count = db.query(func.count(Memory.id)).filter(Memory.user_id == user.id).scalar()
print(f"Total memories in DB: {count}")

# List memories
memories = db.query(Memory).filter(Memory.user_id == user.id).all()
print(f"\nMemories:")
for i, m in enumerate(memories, 1):
    print(f"  {i}. {m.title} (ID: {m.id})")
    print(f"     Raw text length: {len(m.raw_text) if m.raw_text else 0}")
    print(f"     Structured data: {type(m.structured_data)}")

db.close()
