import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), "smartpark.db")
print("Database file path:", os.path.abspath(db_path))
print("Database exists:", os.path.exists(db_path))

if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT id, name, email, role, license_plate, created_at FROM users")
    users = cur.fetchall()
    print(f"\n--- Registered Users in Database ({len(users)}) ---")
    for u in users:
        print(f"ID: {u[0]} | Name: {u[1]} | Email: {u[2]} | Role: {u[3]} | Plate: {u[4]} | Created: {u[5]}")
    conn.close()
else:
    print("Database file not found yet.")
