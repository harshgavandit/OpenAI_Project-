# Updated by GitHub contribution automation.
from app.db import SessionLocal
from app.models.database import User

db = SessionLocal()
user = db.query(User).filter(User.email == "harshgavand2@gmail.com").first()

if user:
    print(f"User: {user.full_name}")
    print(f"Email: {user.email}")
    print(f"Hashed Password: {user.hashed_password}")
    print(f"Google ID: {user.google_id}")
    print(f"Auth Method: {user.auth_method}")
else:
    print("User not found")

db.close()
