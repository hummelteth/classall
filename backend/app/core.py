"""Tutor qualification and documented contribution lifecycle. All activities fictional."""

import json
import os

from fastapi import HTTPException

from . import connected
from . import repository as repo
from .content_i18n import ES_BANK
from .learning import BANK, now

RUBRIC = {
    "accuracy": "Check subject accuracy against the reference answers.",
    "clarity": "Look for clear language and a worked example.",
    "reasoning": "Explain why the method works and address a misconception.",
    "learner_fit": "Build on prior knowledge and invite the learner to try.",
    "cautions": "Identify omissions or potentially misleading claims.",
}
FEEDBACK_MINIMUM = 3


def points_per_session():
    return max(1, min(1000, int(os.getenv("CLASSALL_CONTRIBUTION_POINTS", "20"))))


def migrate(db):
    db.executescript("""
    CREATE TABLE IF NOT EXISTS core_migrations(version INTEGER PRIMARY KEY);
    CREATE TABLE IF NOT EXISTS tutor_applications(
      id INTEGER PRIMARY KEY, applicant_id INTEGER NOT NULL REFERENCES users(id),
      subject_id INTEGER NOT NULL REFERENCES subjects(id), topic_id INTEGER NOT NULL REFERENCES topics(id),
      language TEXT NOT NULL, content TEXT NOT NULL, qualification TEXT NOT NULL, answers TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('pending','changes_requested','approved','rejected')),
      advisory TEXT, reviewer_id INTEGER REFERENCES users(id), decided_at TEXT, comments TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE UNIQUE INDEX IF NOT EXISTS one_active_application ON tutor_applications(applicant_id,subject_id)
      WHERE status IN ('pending','changes_requested','approved');
    CREATE TABLE IF NOT EXISTS application_events(
      id INTEGER PRIMARY KEY, application_id INTEGER NOT NULL REFERENCES tutor_applications(id),
      actor_id INTEGER NOT NULL REFERENCES users(id), event TEXT NOT NULL, payload TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS synthetic_session_confirmations(
      session_id INTEGER PRIMARY KEY REFERENCES sessions(id), host_id INTEGER NOT NULL REFERENCES users(id),
      proposed_at TEXT NOT NULL, booking_ids TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS session_attendance(
      booking_id INTEGER PRIMARY KEY REFERENCES bookings(id), session_id INTEGER NOT NULL REFERENCES sessions(id),
      learner_id INTEGER NOT NULL REFERENCES users(id), host_id INTEGER NOT NULL REFERENCES users(id),
      proposed_at TEXT NOT NULL, confirmed_at TEXT,
      provenance TEXT NOT NULL CHECK(provenance='synthetic-two-party'));
    CREATE TABLE IF NOT EXISTS contribution_ledger(
      id INTEGER PRIMARY KEY, tutor_id INTEGER NOT NULL REFERENCES users(id),
      session_id INTEGER NOT NULL UNIQUE REFERENCES sessions(id), points INTEGER NOT NULL CHECK(points>0),
      provenance TEXT NOT NULL, actor_id INTEGER REFERENCES users(id), created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS session_feedback(
      booking_id INTEGER PRIMARY KEY REFERENCES session_attendance(booking_id),
      session_id INTEGER NOT NULL REFERENCES sessions(id), learner_id INTEGER NOT NULL REFERENCES users(id),
      clarity INTEGER NOT NULL CHECK(clarity BETWEEN 1 AND 3),
      preparation INTEGER NOT NULL CHECK(preparation BETWEEN 1 AND 3),
      atmosphere INTEGER NOT NULL CHECK(atmosphere BETWEEN 1 AND 3), comment TEXT NOT NULL, created_at TEXT NOT NULL,
      UNIQUE(session_id,learner_id));
    """)
    if not db.execute("SELECT 1 FROM core_migrations WHERE version=1").fetchone():
        # Snapshot legacy totals once. Never give points to later check simulations.
        db.execute(
            """INSERT INTO contribution_ledger(tutor_id,session_id,points,provenance,created_at)
          SELECT tutor_id,id,20,'legacy-synthetic-history',? FROM sessions WHERE status='completed' """,
            (now(),),
        )
        db.execute("INSERT INTO core_migrations VALUES (1)")


def qualification(db, tid, language="en", include_key=False):
    t = connected.topic(db, tid)
    if tid not in BANK:
        raise HTTPException(
            409, "No prepared qualification is available for this topic."
        )
    questions = []
    for i, (prompt, options, correct, explanation) in enumerate(BANK[tid][1][:2]):
        if language == "es":
            prompt, options, explanation = ES_BANK[tid][i]
        questions.append(
            {
                "id": i,
                "prompt": prompt,
                "options": options,
                **(
                    {"correct": correct, "explanation": explanation}
                    if include_key
                    else {}
                ),
            }
        )
    task = (
        "Un estudiante conoce los conceptos básicos, pero no entiende por qué funciona este método. "
        "Explica el concepto con un ejemplo, aborda una dificultad frecuente y propón una actividad breve."
        if language == "es"
        else "A student knows the basics but does not understand why this method works. Explain the concept "
        "using an example, address a common difficulty and propose a brief learner activity."
    )
    return {
        "topic_id": tid,
        "subject_id": t["subject_id"],
        "language": language,
        "source": "prepared-v4-curated-bank",
        "questions": questions,
        "explanation_task": task,
        "rubric": RUBRIC,
    }


def application(db, actor, aid):
    row = db.execute(
        "SELECT a.*,u.name AS applicant_name,s.name AS subject_name FROM tutor_applications a "
        "JOIN users u ON u.id=a.applicant_id JOIN subjects s ON s.id=a.subject_id WHERE a.id=?",
        (aid,),
    ).fetchone()
    if row is None:
        raise HTTPException(404, "Application not found.")
    r = dict(row)
    faculty = (
        actor["role"] == "professor"
        and db.execute(
            "SELECT 1 FROM professor_subjects WHERE professor_id=? AND subject_id=?",
            (actor["id"], r["subject_id"]),
        ).fetchone()
    )
    if actor["id"] != r["applicant_id"] and not faculty:
        raise HTTPException(
            403, "You can access only your applications or assigned subjects."
        )
    for key in ("content", "qualification", "answers", "advisory"):
        r[key] = json.loads(r[key]) if r[key] else None
    r["events"] = [
        {**dict(e), "payload": json.loads(e["payload"])}
        for e in db.execute(
            "SELECT * FROM application_events WHERE application_id=? ORDER BY id",
            (aid,),
        )
    ]
    return r


def applications(db, actor):
    if actor["role"] == "professor":
        rows = db.execute(
            "SELECT id FROM tutor_applications WHERE subject_id IN "
            "(SELECT subject_id FROM professor_subjects WHERE professor_id=?) ORDER BY id DESC",
            (actor["id"],),
        )
    else:
        rows = db.execute(
            "SELECT id FROM tutor_applications WHERE applicant_id=? ORDER BY id DESC",
            (actor["id"],),
        )
    return [application(db, actor, r["id"]) for r in rows.fetchall()]


def event(db, aid, uid, kind, payload):
    db.execute(
        "INSERT INTO application_events(application_id,actor_id,event,payload,created_at) VALUES (?,?,?,?,?)",
        (aid, uid, kind, json.dumps(payload, ensure_ascii=False), now()),
    )


def save_application(db, actor, body, aid=None):
    connected.student(actor)
    db.execute("BEGIN IMMEDIATE")
    q = qualification(db, body.topic_id, body.language, True)
    if db.execute(
        "SELECT 1 FROM tutor_approvals WHERE tutor_id=? AND subject_id=?",
        (actor["id"], q["subject_id"]),
    ).fetchone():
        raise HTTPException(409, "You are already approved for this subject.")
    if any(
        type(a) is not int or a < 0 or a >= len(q["questions"][i]["options"])
        for i, a in enumerate(body.answers)
    ):
        raise HTTPException(422, "Choose one available answer for each question.")
    content = body.model_dump(exclude={"answers", "topic_id", "language"})
    if aid:
        current = application(db, actor, aid)
        if (
            current["applicant_id"] != actor["id"]
            or current["status"] != "changes_requested"
        ):
            raise HTTPException(
                409, "Only a returned application can be revised by its applicant."
            )
        if current["topic_id"] != body.topic_id:
            raise HTTPException(
                409, "Keep the original qualification topic when revising."
            )
        db.execute(
            "UPDATE tutor_applications SET language=?,content=?,qualification=?,answers=?,status='pending',advisory=NULL,updated_at=? WHERE id=?",
            (
                body.language,
                json.dumps(content),
                json.dumps(q),
                json.dumps(body.answers),
                now(),
                aid,
            ),
        )
    else:
        if db.execute(
            "SELECT 1 FROM tutor_applications WHERE applicant_id=? AND subject_id=? AND status!='rejected'",
            (actor["id"], q["subject_id"]),
        ).fetchone():
            raise HTTPException(
                409, "You already have an active application for this subject."
            )
        aid = db.execute(
            """INSERT INTO tutor_applications(applicant_id,subject_id,topic_id,language,content,qualification,answers,status,created_at,updated_at)
          VALUES (?,?,?,?,?,?,?,'pending',?,?)""",
            (
                actor["id"],
                q["subject_id"],
                body.topic_id,
                body.language,
                json.dumps(content),
                json.dumps(q),
                json.dumps(body.answers),
                now(),
                now(),
            ),
        ).lastrowid
    event(
        db,
        aid,
        actor["id"],
        "submitted",
        {**body.model_dump(), "qualification_snapshot": q},
    )
    db.commit()
    return application(db, actor, aid)


def review(db, actor, aid, body):
    db.execute("BEGIN IMMEDIATE")
    current = application(db, actor, aid)
    if actor["role"] != "professor" or current["applicant_id"] == actor["id"]:
        raise HTTPException(
            403, "Only an assigned professor can decide an application."
        )
    if current["status"] != "pending":
        raise HTTPException(409, "Only a pending application can receive a decision.")
    db.execute(
        "UPDATE tutor_applications SET status=?,reviewer_id=?,decided_at=?,comments=?,updated_at=? WHERE id=?",
        (body.status, actor["id"], now(), body.comments, now(), aid),
    )
    if body.status == "approved":
        db.execute(
            "INSERT OR IGNORE INTO tutor_approvals VALUES (?,?)",
            (current["applicant_id"], current["subject_id"]),
        )
    event(db, aid, actor["id"], body.status, body.model_dump())
    db.commit()
    return application(db, actor, aid)


def host_proposal(db, actor, sid, body):
    connected.student(actor)
    db.execute("BEGIN IMMEDIATE")
    s = repo.session(db, sid)
    if s["tutor"]["id"] != actor["id"]:
        raise HTTPException(403, "Only the host may propose synthetic attendance.")
    ids = sorted(set(body.booking_ids))
    existing = db.execute(
        "SELECT * FROM synthetic_session_confirmations WHERE session_id=?", (sid,)
    ).fetchone()
    if existing:
        if json.loads(existing["booking_ids"]) != ids:
            raise HTTPException(
                409,
                "The attendance proposal is already recorded and cannot be rewritten.",
            )
        if s["status"] == "cancelled":
            raise HTTPException(409, "Cancelled sessions cannot receive attendance.")
        awaiting = db.execute(
            "SELECT 1 FROM session_attendance a JOIN bookings b ON b.id=a.booking_id "
            "WHERE a.session_id=? AND a.confirmed_at IS NULL AND b.status='confirmed'",
            (sid,),
        ).fetchone()
        return {
            "session_id": sid,
            "provenance": "synthetic-two-party",
            "awaiting_learners": bool(awaiting),
        }
    if s["status"] != "upcoming" or not s["approved"]:
        raise HTTPException(
            409, "Use an upcoming session with an approved host and eligible bookings."
        )
    for bid in ids:
        if not db.execute(
            "SELECT 1 FROM bookings WHERE id=? AND session_id=? AND status='confirmed' AND learner_id!=?",
            (bid, sid, actor["id"]),
        ).fetchone():
            raise HTTPException(
                409, "Select only confirmed bookings belonging to this session."
            )
    db.execute(
        "INSERT INTO synthetic_session_confirmations VALUES (?,?,?,?)",
        (sid, actor["id"], now(), json.dumps(ids)),
    )
    for bid in ids:
        db.execute(
            """INSERT INTO session_attendance(booking_id,session_id,learner_id,host_id,proposed_at,provenance)
          SELECT id,session_id,learner_id,?,?, 'synthetic-two-party' FROM bookings WHERE id=?""",
            (actor["id"], now(), bid),
        )
    db.commit()
    return {
        "session_id": sid,
        "provenance": "synthetic-two-party",
        "awaiting_learners": True,
    }


def confirm_attendance(db, actor, bid):
    connected.student(actor)
    db.execute("BEGIN IMMEDIATE")
    a = db.execute(
        """SELECT a.*,b.status AS booking_status,s.status AS session_status FROM session_attendance a
      JOIN bookings b ON b.id=a.booking_id JOIN sessions s ON s.id=a.session_id WHERE a.booking_id=? AND a.learner_id=?""",
        (bid, actor["id"]),
    ).fetchone()
    if not a:
        raise HTTPException(404, "No host attendance proposal exists for this booking.")
    if a["booking_status"] != "confirmed" or a["session_status"] == "cancelled":
        raise HTTPException(
            409, "Cancelled bookings or sessions cannot confirm attendance."
        )
    if not a["confirmed_at"]:
        db.execute(
            "UPDATE session_attendance SET confirmed_at=? WHERE booking_id=?",
            (now(), bid),
        )
        db.execute(
            "UPDATE sessions SET status='completed' WHERE id=?", (a["session_id"],)
        )
        db.execute(
            """INSERT OR IGNORE INTO contribution_ledger(tutor_id,session_id,points,provenance,actor_id,created_at)
          VALUES (?,?,?,'synthetic-two-party',?,?)""",
            (a["host_id"], a["session_id"], points_per_session(), actor["id"], now()),
        )
    db.commit()
    return {"booking_id": bid, "confirmed": True, "provenance": "synthetic-two-party"}


def learner_records(db, actor):
    connected.student(actor)
    return [
        {
            **dict(r),
            "feedback": dict(f)
            if (
                f := db.execute(
                    "SELECT clarity,preparation,atmosphere,comment,created_at FROM session_feedback WHERE booking_id=?",
                    (r["booking_id"],),
                ).fetchone()
            )
            else None,
        }
        for r in db.execute(
            """SELECT a.*,s.title,b.status AS booking_status,s.status AS session_status FROM session_attendance a
              JOIN sessions s ON s.id=a.session_id JOIN bookings b ON b.id=a.booking_id WHERE a.learner_id=? ORDER BY a.booking_id DESC""",
            (actor["id"],),
        ).fetchall()
    ]


def save_feedback(db, actor, bid, body):
    connected.student(actor)
    db.execute("BEGIN IMMEDIATE")
    a = db.execute(
        """SELECT a.* FROM session_attendance a JOIN bookings b ON b.id=a.booking_id
      JOIN sessions s ON s.id=a.session_id WHERE a.booking_id=? AND a.learner_id=? AND a.confirmed_at IS NOT NULL
      AND b.status='confirmed' AND s.status='completed' """,
        (bid, actor["id"]),
    ).fetchone()
    if not a:
        raise HTTPException(403, "Feedback requires your own confirmed attendance.")
    if db.execute(
        "SELECT 1 FROM session_feedback WHERE session_id=? AND learner_id=?",
        (a["session_id"], actor["id"]),
    ).fetchone():
        raise HTTPException(
            409, "Feedback has already been submitted for this session."
        )
    db.execute(
        "INSERT INTO session_feedback VALUES (?,?,?,?,?,?,?,?)",
        (
            bid,
            a["session_id"],
            actor["id"],
            body.clarity,
            body.preparation,
            body.atmosphere,
            body.comment,
            now(),
        ),
    )
    db.commit()
    return {"saved": True}


def portfolio(db, actor):
    connected.student(actor)
    uid = actor["id"]
    entries = [
        dict(r)
        for r in db.execute(
            """SELECT l.*,s.title,s.duration_minutes FROM contribution_ledger l JOIN sessions s ON s.id=l.session_id
      WHERE l.tutor_id=? ORDER BY l.id DESC""",
            (uid,),
        )
    ]
    feedback = db.execute(
        """SELECT COUNT(*) AS n,AVG(f.clarity) AS clarity,AVG(f.preparation) AS preparation,AVG(f.atmosphere) AS atmosphere
      FROM session_feedback f JOIN sessions s ON s.id=f.session_id WHERE s.tutor_id=?""",
        (uid,),
    ).fetchone()
    # No names, individual comments, counts or averages for tiny cohorts.
    distinct = db.execute(
        """SELECT COUNT(DISTINCT f.learner_id) FROM session_feedback f JOIN sessions s ON s.id=f.session_id WHERE s.tutor_id=?""",
        (uid,),
    ).fetchone()[0]
    summary = (
        {k: round(feedback[k], 1) for k in ("clarity", "preparation", "atmosphere")}
        if distinct >= FEEDBACK_MINIMUM
        else None
    )
    return {
        "approved_subjects": [
            dict(r)
            for r in db.execute(
                "SELECT s.* FROM subjects s JOIN tutor_approvals a ON a.subject_id=s.id WHERE a.tutor_id=?",
                (uid,),
            )
        ],
        "entries": entries,
        "points": sum(e["points"] for e in entries),
        "confirmed_sessions": len(entries),
        "teaching_minutes": sum(e["duration_minutes"] for e in entries),
        "learners_supported": db.execute(
            "SELECT COUNT(DISTINCT learner_id) FROM session_attendance WHERE host_id=? AND confirmed_at IS NOT NULL",
            (uid,),
        ).fetchone()[0],
        "topics": [
            dict(t)
            for t in db.execute(
                """SELECT DISTINCT t.id,t.name FROM topics t JOIN session_topics st ON st.topic_id=t.id
          JOIN contribution_ledger l ON l.session_id=st.session_id WHERE l.tutor_id=?""",
                (uid,),
            )
        ],
        "feedback_summary": summary,
        "feedback_minimum": FEEDBACK_MINIMUM,
        "suggested_strengths": [k for k, v in (summary or {}).items() if v >= 2.5],
        "milestones": [n for n in (1, 5, 10) if len(entries) >= n],
        "independently_verified_sessions": 0,
    }
