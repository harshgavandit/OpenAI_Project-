from app.db import SessionLocal
from app.models.database import User
from app.services.auth import auth_service

db = SessionLocal()

user = db.query(User).filter(User.email == "harshgavand2@gmail.com").first()

if user:
    print(f"Stored hash: {user.hashed_password}")
    print(f"Hash length: {len(user.hashed_password)}")
    
    # Try to verify
    try:
        result = auth_service.verify_password("demo123", user.hashed_password)
        print(f"Verification result: {result}")
    except Exception as e:
        print(f"Verification error: {e}")
else:
    print("User not found")

db.close()
