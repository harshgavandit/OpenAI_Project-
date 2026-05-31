from app.db import SessionLocal
from app.models.database import User
from app.services.auth import auth_service

db = SessionLocal()

# Find the user
user = db.query(User).filter(User.email == "harshgavand2@gmail.com").first()

if user:
    print(f"User exists: {user.full_name}")
    print(f"Current auth method: {user.auth_method}")
    
    # Change to email auth since password is now set
    user.auth_method = "email"
    db.commit()
    print(f"✓ Auth method changed to 'email'")
else:
    print("User not found")

db.close()
