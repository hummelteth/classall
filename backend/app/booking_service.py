from datetime import datetime, timedelta, timezone
from fastapi import HTTPException
from . import repository as repo


def create_booking(db, user_id: int, session_id: int):
    # Reserve the write lock before checking seats: concurrent clients cannot overbook.
    db.execute("BEGIN IMMEDIATE")
    learner = repo.user(db, user_id)
    if learner["role"] == "professor":
        raise HTTPException(
            403,
            "Professor demo access cannot book student sessions. Switch to Learner or Tutor.",
        )
    target = repo.session(db, session_id)
    if target["tutor"]["id"] == user_id:
        raise HTTPException(
            409, "You are hosting this session and cannot book a learner seat."
        )
    if target["status"] != "upcoming" or datetime.fromisoformat(
        target["starts_at"]
    ) <= datetime.now(timezone.utc):
        raise HTTPException(409, "This session is no longer available to book.")
    if not target["approved"]:
        raise HTTPException(
            409, "This tutor is not approved for this subject in the demo dataset."
        )
    if db.execute(
        "SELECT 1 FROM bookings WHERE session_id=? AND learner_id=? AND status='confirmed'",
        (session_id, user_id),
    ).fetchone():
        raise HTTPException(409, "You already have a seat in this session.")
    if target["available_seats"] <= 0:
        raise HTTPException(409, "This session is full. Please choose another session.")
    start = datetime.fromisoformat(target["starts_at"])
    end = start + timedelta(minutes=target["duration_minutes"])
    rows = db.execute(
        """SELECT s.starts_at,s.duration_minutes FROM sessions s WHERE s.status='upcoming'
        AND (s.tutor_id=? OR s.id IN (SELECT session_id FROM bookings WHERE learner_id=? AND status='confirmed'))""",
        (user_id, user_id),
    ).fetchall()
    for other in rows:
        other_start = datetime.fromisoformat(other["starts_at"])
        if (
            start < other_start + timedelta(minutes=other["duration_minutes"])
            and end > other_start
        ):
            raise HTTPException(
                409,
                "You have another session at this time. Choose a different session.",
            )
    cursor = db.execute(
        "INSERT INTO bookings(session_id,learner_id,created_at) VALUES (?,?,?)",
        (session_id, user_id, datetime.now(timezone.utc).isoformat()),
    )
    row = db.execute(
        "SELECT * FROM bookings WHERE id=?", (cursor.lastrowid,)
    ).fetchone()
    result = repo.booking_dict(db, row)
    db.commit()  # Persist before FastAPI sends the success response.
    return result


def cancel_booking(db, user_id: int, booking_id: int):
    db.execute("BEGIN IMMEDIATE")
    row = db.execute(
        "SELECT * FROM bookings WHERE id=? AND learner_id=?", (booking_id, user_id)
    ).fetchone()
    if row is None:
        raise HTTPException(
            404, "This booking could not be found for the selected demo user."
        )
    target = repo.session(db, row["session_id"])
    if target["status"] != "upcoming" or datetime.fromisoformat(
        target["starts_at"]
    ) <= datetime.now(timezone.utc):
        raise HTTPException(409, "Past sessions cannot be cancelled.")
    db.execute("UPDATE bookings SET status='cancelled' WHERE id=?", (booking_id,))
    result = repo.booking_dict(
        db, db.execute("SELECT * FROM bookings WHERE id=?", (booking_id,)).fetchone()
    )
    db.commit()
    return result
