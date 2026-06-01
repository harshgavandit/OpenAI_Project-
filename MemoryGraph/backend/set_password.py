# Updated by GitHub contribution automation.
from app.db import SessionLocal
from app.models.database import User
from app.services.auth import auth_service

db = SessionLocal()

# Find the user
user = db.query(User).filter(User.email == "harshgavand2@gmail.com").first()

if user:
    print(f"User exists: {user.full_name}")
    print(f"Current password hash: '{user.hashed_password}'")
    print(f"Current auth method: {user.auth_method}")
    print(f"Current Google ID: {user.google_id}")
    
    # Set the password
    user.hashed_password = auth_service.hash_password("demo123")
    user.auth_method = "email"  # Allow email login too
    db.commit()
    print(f"\n✓ Password set. New hash: '{user.hashed_password[:20]}...'")
else:
    print("User not found")

db.close()
