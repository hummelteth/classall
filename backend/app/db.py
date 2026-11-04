import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path

DEFAULT_DB = Path(__file__).resolve().parents[1] / "data" / "classall.sqlite3"


def database_path() -> str:
    return os.environ.get("CLASSALL_DB_PATH", str(DEFAULT_DB))


@contextmanager
def connect(path: str):
    # FastAPI may resume synchronous dependency cleanup on another worker thread.
    # Each request still owns and serially uses its own connection.
    db = sqlite3.connect(path, timeout=10, check_same_thread=False)
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA foreign_keys = ON")
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def initialize(path: str):
    from .seed import seed

    Path(path).parent.mkdir(parents=True, exist_ok=True)
    with connect(path) as db:
        db.executescript(
            """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY, name TEXT NOT NULL, role TEXT NOT NULL,
            programme TEXT NOT NULL, initials TEXT NOT NULL, color TEXT NOT NULL,
            year TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS subjects (
            id INTEGER PRIMARY KEY, name TEXT NOT NULL, code TEXT NOT NULL,
            category TEXT NOT NULL, color TEXT NOT NULL, symbol TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS tutor_approvals (
            tutor_id INTEGER NOT NULL REFERENCES users(id),
            subject_id INTEGER NOT NULL REFERENCES subjects(id),
            PRIMARY KEY (tutor_id, subject_id)
        );
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY, tutor_id INTEGER NOT NULL REFERENCES users(id),
            subject_id INTEGER NOT NULL REFERENCES subjects(id), title TEXT NOT NULL,
            description TEXT NOT NULL, goals TEXT NOT NULL, starts_at TEXT NOT NULL,
            duration_minutes INTEGER NOT NULL CHECK(duration_minutes > 0),
            capacity INTEGER NOT NULL CHECK(capacity > 0), format TEXT NOT NULL,
            location TEXT NOT NULL, level TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'upcoming'
        );
        CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY, session_id INTEGER NOT NULL REFERENCES sessions(id),
            learner_id INTEGER NOT NULL REFERENCES users(id),
            status TEXT NOT NULL DEFAULT 'confirmed', created_at TEXT NOT NULL
        );
        CREATE UNIQUE INDEX IF NOT EXISTS unique_active_booking
            ON bookings(session_id, learner_id) WHERE status = 'confirmed';
        CREATE INDEX IF NOT EXISTS booking_session ON bookings(session_id, status);
        CREATE INDEX IF NOT EXISTS booking_learner ON bookings(learner_id, status);
        """
        )
        seed(db)
        from .learning import migrate

        migrate(db)

        from .connected import migrate as connected_migrate

        connected_migrate(db)

        from .studio import migrate as studio_migrate

        studio_migrate(db)
