# Updated by GitHub contribution automation.
import sqlite3

conn = sqlite3.connect('data/memorygraph.db')
cursor = conn.cursor()

# Mark migration as applied
cursor.execute("INSERT INTO alembic_version (version_num) VALUES ('0004_add_sessions_table')")
conn.commit()
conn.close()

print("Migration marked as applied")
