# Updated by GitHub contribution automation.
from app.db import SessionLocal
from app.models.database import User
from app.services.auth import auth_service

db = SessionLocal()
user = db.query(User).filter(User.email == "harshgavand2@gmail.com").first()

if user:
    token = auth_service.create_access_token(user.id, db)
    print(token)

db.close()
