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
    if "memories" not in inspector.get_table_names():
        return

    existing = {column["name"] for column in inspector.get_columns("memories")}
    additions = {
        "status": "ALTER TABLE memories ADD COLUMN status VARCHAR(50) DEFAULT 'completed' NOT NULL",
        "processing_stage": "ALTER TABLE memories ADD COLUMN processing_stage VARCHAR(80) DEFAULT 'completed' NOT NULL",
        "processing_error": "ALTER TABLE memories ADD COLUMN processing_error TEXT",
    }
    with engine.begin() as connection:
        for column, statement in additions.items():
            if column not in existing:
                connection.execute(text(statement))
