# Updated by GitHub contribution automation.
from app.db import SessionLocal
from app.models.database import Session as SessionModel, User

db = SessionLocal()

# Try to query a session
try:
    session = db.query(SessionModel).first()
    print(f"Session query worked. Found: {session}")
except Exception as e:
    print(f"Session query failed: {e}")
    import traceback
    traceback.print_exc()

db.close()
