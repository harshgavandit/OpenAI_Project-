#!/usr/bin/env python
"""Test JWT token generation and verification"""

def run_token_check():
    from app.db import SessionLocal
    from app.services.auth import auth_service

    test_user_id = "7b1e366c-c505-47d1-b4c1-c738c2eb84c1"
    db = SessionLocal()
    try:
        token = auth_service.create_access_token(test_user_id, db)
    finally:
        db.close()

    print(f"Generated token: {token[:50]}...")
    print("\nToken structure:")
    print("  - Type: session token stored server-side")
    print(f"  - User ID: {test_user_id}")
    print("\nThis token can be used for API calls:")
    print(f'  curl -H "Authorization: Bearer {token[:20]}..." http://localhost:8000/memories/insights')


if __name__ == "__main__":
    run_token_check()
