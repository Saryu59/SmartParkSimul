import os
import sys

# Ensure backend directory is in path
backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend")
if os.path.exists(backend_dir):
    sys.path.insert(0, backend_dir)
else:
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from app.core.config import settings


def main():
    sync_url = settings.DATABASE_URL_SYNC
    if "postgresql+asyncpg://" in sync_url:
        sync_url = sync_url.replace("postgresql+asyncpg://", "postgresql://")
    elif "sqlite+aiosqlite:///" in sync_url:
        sync_url = sync_url.replace("sqlite+aiosqlite:///", "sqlite:///")

    display_target = sync_url.split("@")[-1] if "@" in sync_url else sync_url
    print(f"\n=======================================================")
    print(f" Connected Database Target: {display_target}")
    print(f"=======================================================")

    try:
        engine = create_engine(sync_url)
        with engine.connect() as conn:
            # 1. Query Users
            users = conn.execute(
                text("SELECT id, name, email, role, license_plate, created_at FROM users ORDER BY created_at ASC")
            ).fetchall()
            print(f"\n--- Registered Users ({len(users)}) ---")
            for u in users:
                print(f"• ID:      {u[0]}")
                print(f"  Name:    {u[1]}")
                print(f"  Email:   {u[2]}")
                print(f"  Role:    {u[3]}")
                print(f"  Plate:   {u[4]}")
                print(f"  Created: {u[5]}")
                print("-" * 50)

            # 2. Query Reservations
            try:
                resv = conn.execute(
                    text("SELECT id, user_id, slot_id, status, start_time, end_time, created_at FROM reservations ORDER BY created_at DESC LIMIT 5")
                ).fetchall()
                print(f"\n--- Recent Reservations ({len(resv)}) ---")
                for r in resv:
                    print(f"• Resv ID: {r[0]} | User: {r[1]} | Slot: {r[2]} | Status: {r[3]}")
                    print(f"  Start: {r[4]} | End: {r[5]}")
                    print("-" * 50)
            except Exception as resv_err:
                print(f"(Could not load reservations: {resv_err})")

    except Exception as e:
        print(f"Database query error: {e}")


if __name__ == "__main__":
    main()
