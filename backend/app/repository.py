import json
from datetime import datetime, timezone
from fastapi import HTTPException

SESSION_QUERY = """SELECT s.*, (
    SELECT COUNT(*) FROM bookings b WHERE b.session_id=s.id AND b.status='confirmed'
) AS booked_seats FROM sessions s"""


def user(db, user_id):
    row = db.execute("SELECT * FROM users WHERE id=?", (user_id,)).fetchone()
    if row is None:
        raise HTTPException(400, "Choose a valid synthetic demo user.")
    return dict(row)


def session_dict(db, row):
    result = dict(row)
    result["goals"] = json.loads(result["goals"])
    result["tutor"] = user(db, result.pop("tutor_id"))
    result["subject"] = dict(
        db.execute(
            "SELECT * FROM subjects WHERE id=?", (result.pop("subject_id"),)
        ).fetchone()
    )
    result["available_seats"] = max(0, result["capacity"] - result["booked_seats"])
    result["approved"] = bool(
        db.execute(
            "SELECT 1 FROM tutor_approvals WHERE tutor_id=? AND subject_id=?",
            (result["tutor"]["id"], result["subject"]["id"]),
        ).fetchone()
    )
    return result


def session(db, session_id):
    row = db.execute(SESSION_QUERY + " WHERE s.id=?", (session_id,)).fetchone()
    if row is None:
        raise HTTPException(404, "This session could not be found.")
    return session_dict(db, row)


def sessions(db, subject_id=None, q=None, delivery=None, tutor_id=None):
    conditions = ["s.status='upcoming'", "s.starts_at > ?"]
    values = [datetime.now(timezone.utc).isoformat()]
    if subject_id is not None:
        conditions.append("s.subject_id=?")
        values.append(subject_id)
    if q:
        conditions.append(
            "(s.title LIKE ? OR s.description LIKE ? OR s.subject_id IN (SELECT id FROM subjects WHERE name LIKE ?) OR s.tutor_id IN (SELECT id FROM users WHERE name LIKE ?))"
        )
        values.extend(["%" + q + "%"] * 4)
    if delivery:
        conditions.append("s.format=?")
        values.append(delivery)
    if tutor_id:
        conditions.append("s.tutor_id=?")
        values.append(tutor_id)
    return [
        session_dict(db, r)
        for r in db.execute(
            SESSION_QUERY
            + " WHERE "
            + " AND ".join(conditions)
            + " ORDER BY s.starts_at",
            values,
        )
    ]


def booking_dict(db, row):
    return {
        "id": row["id"],
        "status": row["status"],
        "created_at": row["created_at"],
        "session": session(db, row["session_id"]),
    }


def bookings(db, learner_id):
    rows = db.execute(
        "SELECT b.* FROM bookings b JOIN sessions s ON s.id=b.session_id WHERE b.learner_id=? ORDER BY s.starts_at",
        (learner_id,),
    ).fetchall()
    return [booking_dict(db, r) for r in rows]
