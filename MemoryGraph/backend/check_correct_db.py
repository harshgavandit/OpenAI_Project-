# Updated by GitHub contribution automation.
import sqlite3
from pathlib import Path

db_path = Path(__file__).parent / 'data' / 'memorygraph.db'
print(f"Checking database at: {db_path}")

if not db_path.exists():
    print("Database doesn't exist yet")
    exit(1)

conn = sqlite3.connect(str(db_path))
cursor = conn.cursor()

# Get all tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()
print(f"\nTables found: {len(tables)}")
for t in tables:
    print(f"  - {t[0]}")

# Get the user
cursor.execute("SELECT id, email, full_name FROM users WHERE email = 'harshgavand2@gmail.com'")
user = cursor.fetchone()

if user:
    user_id, email, full_name = user
    print(f"\nUser found: {full_name} ({email})")
    print(f"User ID: {user_id}")
    
    # Check memories
    cursor.execute("SELECT COUNT(*) FROM memories WHERE user_id = ?", (user_id,))
    count = cursor.fetchone()[0]
    print(f"\nMemories count: {count}")
    
    # Show sample memories
    cursor.execute("SELECT id, title FROM memories WHERE user_id = ? LIMIT 3", (user_id,))
    mems = cursor.fetchall()
    for m in mems:
        print(f"  - {m[1]} (ID: {m[0]})")
else:
    print("User not found")
    # List all users
    cursor.execute("SELECT id, email, full_name FROM users")
    users = cursor.fetchall()
    print(f"\nAll users:")
    for u in users:
        print(f"  - {u[2]} ({u[1]}) - ID: {u[0]}")

conn.close()
