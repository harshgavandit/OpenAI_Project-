# Updated by GitHub contribution automation.
import sqlite3

conn = sqlite3.connect('app.db')
cursor = conn.cursor()

# Check users
cursor.execute("SELECT id, email, full_name FROM users WHERE email = 'harshgavand2@gmail.com'")
user = cursor.fetchone()
print(f"User: {user}")

if user:
    user_id = user[0]
    # Check memories for this user
    cursor.execute("SELECT COUNT(*) FROM memories WHERE user_id = ?", (user_id,))
    memory_count = cursor.fetchone()[0]
    print(f"Memories count: {memory_count}")
    
    # Show first 3 memories
    cursor.execute("SELECT id, title, created_at FROM memories WHERE user_id = ? LIMIT 3", (user_id,))
    memories = cursor.fetchall()
    for mem in memories:
        print(f"  - {mem[1]}: {mem[0]} (created: {mem[2]})")
else:
    print("User not found in database")

conn.close()
