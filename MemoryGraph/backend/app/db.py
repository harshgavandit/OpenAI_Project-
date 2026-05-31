import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy import inspect, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

load_dotenv()

BACKEND_DIR = Path(__file__).resolve().parents[1]
DEFAULT_DATABASE_URL = f"sqlite:///{BACKEND_DIR / 'data' / 'memorygraph.db'}"
DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL)

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    import app.models.database  # noqa: F401

    Base.metadata.create_all(bind=engine)
    ensure_sqlite_columns()


def ensure_sqlite_columns():
    if not DATABASE_URL.startswith("sqlite"):
        return

    inspector = inspect(engine)
    table_names = set(inspector.get_table_names())

    table_additions = {
        "users": {
            "email_verified": "ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT 0 NOT NULL",
            "google_id": "ALTER TABLE users ADD COLUMN google_id VARCHAR(255)",
            "auth_method": "ALTER TABLE users ADD COLUMN auth_method VARCHAR(50) DEFAULT 'email' NOT NULL",
        },
        "memories": {
            "status": "ALTER TABLE memories ADD COLUMN status VARCHAR(50) DEFAULT 'completed' NOT NULL",
            "processing_stage": "ALTER TABLE memories ADD COLUMN processing_stage VARCHAR(80) DEFAULT 'completed' NOT NULL",
            "processing_error": "ALTER TABLE memories ADD COLUMN processing_error TEXT",
            "archived_at": "ALTER TABLE memories ADD COLUMN archived_at DATETIME",
            "deleted_at": "ALTER TABLE memories ADD COLUMN deleted_at DATETIME",
            "delete_reason": "ALTER TABLE memories ADD COLUMN delete_reason TEXT",
        },
        "usage_logs": {
            "metadata": "ALTER TABLE usage_logs ADD COLUMN metadata JSON DEFAULT '{}' NOT NULL",
            "metadata_json": "ALTER TABLE usage_logs ADD COLUMN metadata_json JSON DEFAULT '{}' NOT NULL",
        },
        "weekly_reports": {
            "share_token": "ALTER TABLE weekly_reports ADD COLUMN share_token VARCHAR(96)",
            "is_public": "ALTER TABLE weekly_reports ADD COLUMN is_public BOOLEAN DEFAULT 0 NOT NULL",
        },
        "storybooks": {
            "share_token": "ALTER TABLE storybooks ADD COLUMN share_token VARCHAR(96)",
        },
        "memory_capsules": {
            "unlock_notified": "ALTER TABLE memory_capsules ADD COLUMN unlock_notified BOOLEAN DEFAULT 0 NOT NULL",
        },
        "family_rituals": {
            "responses_json": "ALTER TABLE family_rituals ADD COLUMN responses_json JSON DEFAULT '[]' NOT NULL",
        },
        "sessions": {
            "refresh_token": "ALTER TABLE sessions ADD COLUMN refresh_token VARCHAR(255)",
            "refresh_expires_at": "ALTER TABLE sessions ADD COLUMN refresh_expires_at DATETIME",
        },
    }

    with engine.begin() as connection:
        for table_name, additions in table_additions.items():
            if table_name not in table_names:
                continue
            existing = {column["name"] for column in inspector.get_columns(table_name)}
            for column, statement in additions.items():
                if column not in existing:
                    connection.execute(text(statement))
