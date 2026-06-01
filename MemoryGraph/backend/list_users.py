#!/usr/bin/env python
# Updated by GitHub contribution automation.
"""Find all users in database"""
from app.db import SessionLocal
from app.models.database import User

db = SessionLocal()
try:
    users = db.query(User).all()
    print("[*] Users in database:")
    for user in users:
        print(f"    - {user.email} ({user.full_name})")
finally:
    db.close()
