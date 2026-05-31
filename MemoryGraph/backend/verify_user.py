import sqlite3
import json

conn = sqlite3.connect('app.db')
cursor = conn.cursor()

# Get the user
cursor.execute("SELECT id, email, full_name FROM users WHERE email = 'harshgavand2@gmail.com'")
user = cursor.fetchone()

if user:
    user_id, email, full_name = user
    print(f"User found: {full_name} ({email})")
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
    
conn.close()
