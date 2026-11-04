"""Connected learning services. Synthetic identities, deterministic advisory signals."""

import json
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException
from . import repository as repo
from .learning import now


def migrate(db):
    db.executescript("""
    CREATE TABLE IF NOT EXISTS connected_migrations(version INTEGER PRIMARY KEY);
    CREATE TABLE IF NOT EXISTS learning_pulses(
      learner_id INTEGER NOT NULL REFERENCES users(id), topic_id INTEGER NOT NULL REFERENCES topics(id),
      response TEXT NOT NULL CHECK(response IN ('confident','practice','support')),
      active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)), updated_at TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'demo-interaction', PRIMARY KEY(learner_id,topic_id));
    CREATE TABLE IF NOT EXISTS support_requests(
      id INTEGER PRIMARY KEY, learner_id INTEGER NOT NULL REFERENCES users(id),
      topic_id INTEGER NOT NULL REFERENCES topics(id),
      status TEXT NOT NULL CHECK(status IN ('open','matched','withdrawn')),
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL, source TEXT NOT NULL DEFAULT 'demo-interaction');
    CREATE UNIQUE INDEX IF NOT EXISTS unique_open_request ON support_requests(learner_id,topic_id) WHERE status IN ('open','matched');
    CREATE INDEX IF NOT EXISTS support_topic ON support_requests(topic_id,status);
    CREATE TABLE IF NOT EXISTS study_groups(
      id INTEGER PRIMARY KEY, creator_id INTEGER NOT NULL REFERENCES users(id),
      topic_id INTEGER NOT NULL REFERENCES topics(id), title TEXT NOT NULL, description TEXT NOT NULL,
      starts_at TEXT NOT NULL, duration_minutes INTEGER NOT NULL CHECK(duration_minutes BETWEEN 15 AND 240),
      capacity INTEGER NOT NULL CHECK(capacity BETWEEN 2 AND 50), format TEXT NOT NULL CHECK(format IN ('Online','In person')),
      location TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','cancelled')),
      source TEXT NOT NULL DEFAULT 'demo-interaction');
    CREATE INDEX IF NOT EXISTS group_topic_date ON study_groups(topic_id,starts_at,status);
    CREATE TABLE IF NOT EXISTS group_memberships(
      group_id INTEGER NOT NULL REFERENCES study_groups(id), learner_id INTEGER NOT NULL REFERENCES users(id),
      joined_at TEXT NOT NULL, PRIMARY KEY(group_id,learner_id));
    CREATE TABLE IF NOT EXISTS session_details(
      session_id INTEGER PRIMARY KEY REFERENCES sessions(id), organizer_id INTEGER REFERENCES users(id),
      kind TEXT NOT NULL CHECK(kind IN ('peer','faculty')), source TEXT NOT NULL DEFAULT 'demo-interaction');
    CREATE TABLE IF NOT EXISTS support_actions(
      id INTEGER PRIMARY KEY, professor_id INTEGER NOT NULL REFERENCES users(id),
      topic_id INTEGER NOT NULL REFERENCES topics(id),
      action_type TEXT NOT NULL CHECK(action_type IN ('practice','ta_session','review','follow_up')),
      rationale TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'planned' CHECK(status IN ('planned','active','completed','cancelled')),
      created_at TEXT NOT NULL, follow_up_date TEXT, notes TEXT NOT NULL DEFAULT '',
      evidence TEXT NOT NULL, session_id INTEGER UNIQUE REFERENCES sessions(id));
    CREATE INDEX IF NOT EXISTS action_professor ON support_actions(professor_id,status);
    """)
    if db.execute("SELECT 1 FROM connected_migrations WHERE version=1").fetchone():
        return
    # Only new synthetic observations. Never change a legacy booking, date or assessment.
    for uid, response in [(7, "support"), (8, "practice"), (4, "support")]:
        db.execute(
            "INSERT OR IGNORE INTO learning_pulses VALUES (?,1,?,1,?,'seeded-synthetic')",
            (uid, response, now()),
        )
        db.execute(
            "INSERT INTO support_requests(learner_id,topic_id,status,created_at,updated_at,source) VALUES (?,1,'open',?,?,'seeded-synthetic')",
            (uid, now(), now()),
        )
    titles = [
        (1, "Let's tackle Calculus together"),
        (5, "Statistics exam preparation"),
        (2, "Python practice circle"),
        (3, "Understanding forces and motion"),
    ]
    for index, (tid, title) in enumerate(titles):
        start = (
            (datetime.now(timezone.utc) + timedelta(days=index + 3))
            .replace(hour=17, minute=0, second=0, microsecond=0)
            .isoformat()
        )
        gid = db.execute(
            """INSERT INTO study_groups(creator_id,topic_id,title,description,starts_at,duration_minutes,capacity,format,location,source)
          VALUES (7,?,?,?, ?,60,6,?,?,'seeded-synthetic')""",
            (
                tid,
                title,
                "Bring one question and a willingness to learn together. A synthetic example study circle.",
                start,
                "Online" if index % 2 else "In person",
                (
                    "Online · demo discussion format; no meeting integration"
                    if index % 2
                    else "Library · shared study area"
                ),
            ),
        ).lastrowid
        db.executemany(
            "INSERT INTO group_memberships VALUES (?,?,?)",
            [(gid, 7, now()), (gid, 8, now())],
        )
    db.execute("INSERT INTO connected_migrations VALUES (1)")


def student(actor):
    if actor["role"] == "professor":
        raise HTTPException(403, "Choose Learner or Tutor for student activities.")


def topic(db, tid):
    row = db.execute("SELECT * FROM topics WHERE id=?", (tid,)).fetchone()
    if row is None:
        raise HTTPException(404, "Choose an existing course topic.")
    return dict(row)


def assigned(db, actor, tid):
    t = topic(db, tid)
    if (
        actor["role"] != "professor"
        or not db.execute(
            "SELECT 1 FROM professor_subjects WHERE professor_id=? AND subject_id=?",
            (actor["id"], t["subject_id"]),
        ).fetchone()
    ):
        raise HTTPException(403, "You can manage only your assigned courses.")
    return t


def validate_event(db, body):
    t = topic(db, body.topic_id)
    if body.starts_at <= datetime.now(timezone.utc):
        raise HTTPException(422, "Choose a future date and time.")
    if body.format == "In person" and not body.location.strip():
        raise HTTPException(422, "Add a location for an in-person event.")
    data = body.model_dump()
    data["starts_at"] = body.starts_at.astimezone(timezone.utc).isoformat()
    data["location"] = (
        body.location
        if body.format == "In person"
        else "Online · demo discussion format; no meeting integration"
    )
    return t, data


def pulse_rows(db, actor):
    student(actor)
    return [
        dict(r)
        for r in db.execute(
            "SELECT topic_id,response,updated_at,source FROM learning_pulses WHERE learner_id=? AND active=1 ORDER BY topic_id",
            (actor["id"],),
        )
    ]


def save_pulse(db, actor, tid, response):
    student(actor)
    topic(db, tid)
    db.execute("BEGIN IMMEDIATE")
    db.execute(
        """INSERT INTO learning_pulses(learner_id,topic_id,response,updated_at) VALUES (?,?,?,?)
      ON CONFLICT(learner_id,topic_id) DO UPDATE SET response=excluded.response,updated_at=excluded.updated_at,active=1,source='demo-interaction'""",
        (actor["id"], tid, response, now()),
    )
    db.commit()
    return next(r for r in pulse_rows(db, actor) if r["topic_id"] == tid)


def requests(db, actor):
    student(actor)
    return [
        dict(r)
        for r in db.execute(
            "SELECT id,topic_id,status,created_at,updated_at,source FROM support_requests WHERE learner_id=? ORDER BY id DESC",
            (actor["id"],),
        )
    ]


def create_request(db, actor, tid):
    student(actor)
    topic(db, tid)
    db.execute("BEGIN IMMEDIATE")
    if db.execute(
        "SELECT 1 FROM support_requests WHERE learner_id=? AND topic_id=? AND status IN ('open','matched')",
        (actor["id"], tid),
    ).fetchone():
        raise HTTPException(409, "You already have an active request for this topic.")
    rid = db.execute(
        "INSERT INTO support_requests(learner_id,topic_id,status,created_at,updated_at) VALUES (?,?,'open',?,?)",
        (actor["id"], tid, now(), now()),
    ).lastrowid
    db.commit()
    return next(r for r in requests(db, actor) if r["id"] == rid)


def match_requests(db, uid, tid):
    db.execute(
        "UPDATE support_requests SET status='matched',updated_at=? WHERE learner_id=? AND topic_id=? AND status='open'",
        (now(), uid, tid),
    )


def reopen_requests(db, uid, tid):
    # A cancelled reservation should not leave a request apparently fulfilled.
    booked = db.execute(
        """SELECT 1 FROM bookings b JOIN sessions s ON b.session_id=s.id JOIN session_topics st ON st.session_id=s.id
      WHERE b.learner_id=? AND st.topic_id=? AND b.status='confirmed' AND s.status='upcoming' AND s.starts_at>?""",
        (uid, tid, now()),
    ).fetchone()
    grouped = db.execute(
        "SELECT 1 FROM group_memberships m JOIN study_groups g ON g.id=m.group_id WHERE m.learner_id=? AND g.topic_id=? AND g.status='active' AND g.starts_at>?",
        (uid, tid, now()),
    ).fetchone()
    if not booked and not grouped:
        db.execute(
            "UPDATE support_requests SET status='open',updated_at=? WHERE learner_id=? AND topic_id=? AND status='matched'",
            (now(), uid, tid),
        )


GROUP_QUERY = """SELECT g.*,t.name AS topic_name,t.subject_id,s.name AS subject_name,
  (SELECT COUNT(*) FROM group_memberships m WHERE m.group_id=g.id) AS member_count
  FROM study_groups g JOIN topics t ON t.id=g.topic_id JOIN subjects s ON s.id=t.subject_id"""


def group_dict(db, row, actor):
    result = dict(row)
    result["available_places"] = (
        max(0, result["capacity"] - result["member_count"])
        if result["status"] == "active"
        else 0
    )
    result["joined"] = bool(
        db.execute(
            "SELECT 1 FROM group_memberships WHERE group_id=? AND learner_id=?",
            (row["id"], actor["id"]),
        ).fetchone()
    )
    return result


def group(db, gid, actor):
    row = db.execute(GROUP_QUERY + " WHERE g.id=?", (gid,)).fetchone()
    if row is None:
        raise HTTPException(404, "Study group not found.")
    return group_dict(db, row, actor)


def groups(
    db, actor, subject_id=None, topic_id=None, date=None, available=False, mine=False
):
    student(actor)
    clauses, values = [], []
    if mine:
        clauses.append(
            "(g.creator_id=? OR g.id IN (SELECT group_id FROM group_memberships WHERE learner_id=?))"
        )
        values.extend([actor["id"], actor["id"]])
    else:
        clauses.extend(["g.status='active'", "g.starts_at>?"])
        values.append(now())
    for key, value in [("t.subject_id", subject_id), ("g.topic_id", topic_id)]:
        if value is not None:
            clauses.append(key + "=?")
            values.append(value)
    if date:
        # Query day is explicitly UTC; timestamps stored in canonical UTC.
        clauses.append("substr(g.starts_at,1,10)=?")
        values.append(str(date))
    if available:
        clauses.append(
            "g.status='active' AND g.starts_at>? AND g.capacity>(SELECT COUNT(*) FROM group_memberships WHERE group_id=g.id)"
        )
        values.append(now())
    return [
        group_dict(db, r, actor)
        for r in db.execute(
            GROUP_QUERY
            + (" WHERE " + " AND ".join(clauses) if clauses else "")
            + " ORDER BY g.starts_at",
            values,
        )
    ]


def save_group(db, actor, body, gid=None):
    student(actor)
    db.execute("BEGIN IMMEDIATE")
    _, data = validate_event(db, body)
    previous_topic = None
    if gid is None:
        gid = db.execute(
            """INSERT INTO study_groups(creator_id,topic_id,title,description,starts_at,duration_minutes,capacity,format,location)
          VALUES (?,?,?,?,?,?,?,?,?)""",
            (
                actor["id"],
                data["topic_id"],
                data["title"],
                data["description"],
                data["starts_at"],
                data["duration_minutes"],
                data["capacity"],
                data["format"],
                data["location"],
            ),
        ).lastrowid
        db.execute(
            "INSERT INTO group_memberships VALUES (?,?,?)", (gid, actor["id"], now())
        )
        match_requests(db, actor["id"], data["topic_id"])
    else:
        current = group(db, gid, actor)
        previous_topic = current["topic_id"]
        if current["creator_id"] != actor["id"]:
            raise HTTPException(403, "Only the creator can edit this group.")
        if current["status"] != "active" or current["starts_at"] <= now():
            raise HTTPException(409, "Past or cancelled groups cannot be edited.")
        if data["capacity"] < current["member_count"]:
            raise HTTPException(
                409, "Capacity cannot be smaller than current membership."
            )
        if current["member_count"] > 1 and any(
            data[k] != current[k]
            for k in ("topic_id", "starts_at", "duration_minutes", "format", "location")
        ):
            raise HTTPException(
                409,
                "With other members, edit only the title, description and capacity. Cancel to change plans.",
            )
        db.execute(
            """UPDATE study_groups SET topic_id=?,title=?,description=?,starts_at=?,duration_minutes=?,capacity=?,format=?,location=? WHERE id=?""",
            (
                data["topic_id"],
                data["title"],
                data["description"],
                data["starts_at"],
                data["duration_minutes"],
                data["capacity"],
                data["format"],
                data["location"],
                gid,
            ),
        )
    if previous_topic is not None and previous_topic != data["topic_id"]:
        reopen_requests(db, actor["id"], previous_topic)
        match_requests(db, actor["id"], data["topic_id"])
    db.commit()
    return group(db, gid, actor)


def change_membership(db, actor, gid, operation):
    student(actor)
    db.execute("BEGIN IMMEDIATE")
    current = group(db, gid, actor)
    if current["status"] != "active" or current["starts_at"] <= now():
        raise HTTPException(409, "This group is no longer open.")
    if operation == "join":
        if current["joined"]:
            raise HTTPException(409, "You have already joined this group.")
        if not current["available_places"]:
            raise HTTPException(409, "This group is full.")
        db.execute(
            "INSERT INTO group_memberships VALUES (?,?,?)", (gid, actor["id"], now())
        )
        match_requests(db, actor["id"], current["topic_id"])
    elif operation == "leave":
        if current["creator_id"] == actor["id"]:
            raise HTTPException(
                409, "As the creator, cancel the group instead of leaving it."
            )
        db.execute(
            "DELETE FROM group_memberships WHERE group_id=? AND learner_id=?",
            (gid, actor["id"]),
        )
        reopen_requests(db, actor["id"], current["topic_id"])
    else:
        if current["creator_id"] != actor["id"]:
            raise HTTPException(403, "Only the creator can cancel this group.")
        db.execute("UPDATE study_groups SET status='cancelled' WHERE id=?", (gid,))
        for row in db.execute(
            "SELECT learner_id FROM group_memberships WHERE group_id=?", (gid,)
        ).fetchall():
            reopen_requests(db, row[0], current["topic_id"])
    db.commit()
    return group(db, gid, actor)


def suggestions(db, actor, tid):
    student(actor)
    t = topic(db, tid)
    return {
        "sessions": [
            s
            for s in repo.sessions(db, subject_id=t["subject_id"])
            if s["available_seats"] > 0
            and any(x["id"] == tid for x in s["topics"])
            and s["tutor"]["id"] != actor["id"]
        ],
        "groups": groups(db, actor, topic_id=tid, available=True),
        "practice": [
            dict(r)
            for r in db.execute(
                "SELECT id,description FROM learning_objectives WHERE topic_id=?",
                (tid,),
            )
        ],
        "note": "Learning Pulse is optional self-reflection. Your responses are private; faculty see only aggregates.",
    }


def check_host_schedule(db, host_id, data, exclude=None):
    start = datetime.fromisoformat(data["starts_at"])
    end = start + timedelta(minutes=data["duration_minutes"])
    for other in db.execute(
        """SELECT id,starts_at,duration_minutes FROM sessions WHERE status='upcoming' AND
      (tutor_id=? OR id IN (SELECT session_id FROM bookings WHERE learner_id=? AND status='confirmed'))""",
        (host_id, host_id),
    ):
        if other["id"] == exclude:
            continue
        other_start = datetime.fromisoformat(other["starts_at"])
        if (
            start < other_start + timedelta(minutes=other["duration_minutes"])
            and end > other_start
        ):
            raise HTTPException(
                409, "The host already has teaching or a booking at this time."
            )


def attach_checks(db, sid, tid):
    # A session can now hold an assigned professor publication. Never use another
    # session as a mutable question template or silently lose its provenance.
    from .learning import BANK

    db.execute("INSERT INTO session_topics VALUES (?,?)", (sid, tid))
    bank = BANK.get(tid)
    objectives = db.execute(
        "SELECT id FROM learning_objectives WHERE topic_id=? ORDER BY id LIMIT 2",
        (tid,),
    ).fetchall()
    if bank is None or len(objectives) < 2:
        return
    for stage, offset in (("pre", 0), ("post", 2)):
        cid = db.execute(
            "INSERT INTO learning_checks(session_id,stage) VALUES (?,?)",
            (sid, stage),
        ).lastrowid
        for i, (prompt, options, correct, explanation) in enumerate(
            bank[1][offset : offset + 2]
        ):
            qid = db.execute(
                "INSERT INTO assessment_questions(check_id,objective_id,prompt,explanation) VALUES (?,?,?,?)",
                (cid, objectives[i]["id"], prompt, explanation),
            ).lastrowid
            db.executemany(
                "INSERT INTO answer_options(question_id,label,is_correct) VALUES (?,?,?)",
                [(qid, label, int(j == correct)) for j, label in enumerate(options)],
            )


def publish_session(db, actor, body, action_id=None):
    db.execute("BEGIN IMMEDIATE")
    t, data = validate_event(db, body)
    if action_id is None:
        if actor["role"] != "tutor":
            raise HTTPException(
                403, "Only an approved tutor can publish peer tutoring."
            )
        host = actor["id"]
        kind = "peer"
        organizer = None
    else:
        assigned(db, actor, body.topic_id)
        action = own_action(db, actor, action_id)
        if (
            action["action_type"] != "ta_session"
            or action["status"] in ("completed", "cancelled")
            or action["session_id"] is not None
            or action["topic_id"] != body.topic_id
        ):
            raise HTTPException(
                409,
                "Use an open TA support action for the same topic, without an existing session.",
            )
        host = body.host_id
        kind = "faculty"
        organizer = actor["id"]
    if (
        repo.user(db, host)["role"] != "tutor"
        or not db.execute(
            "SELECT 1 FROM tutor_approvals WHERE tutor_id=? AND subject_id=?",
            (host, t["subject_id"]),
        ).fetchone()
    ):
        raise HTTPException(
            403, "The host must be approved for this subject in the synthetic dataset."
        )
    check_host_schedule(db, host, data)
    sid = db.execute(
        """INSERT INTO sessions(tutor_id,subject_id,title,description,goals,starts_at,duration_minutes,capacity,format,location,level,status)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,'upcoming')""",
        (
            host,
            t["subject_id"],
            data["title"],
            data["description"],
            json.dumps(data["goals"]),
            data["starts_at"],
            data["duration_minutes"],
            data["capacity"],
            data["format"],
            data["location"],
            "All levels",
        ),
    ).lastrowid
    db.execute(
        "INSERT INTO session_details(session_id,organizer_id,kind) VALUES (?,?,?)",
        (sid, organizer, kind),
    )
    attach_checks(db, sid, body.topic_id)
    if action_id:
        db.execute(
            "UPDATE support_actions SET session_id=?,status='active' WHERE id=?",
            (sid, action_id),
        )
    db.commit()
    return repo.session(db, sid)


def manage_session(db, actor, sid, body=None):
    db.execute("BEGIN IMMEDIATE")
    current = repo.session(db, sid)
    detail = db.execute(
        "SELECT * FROM session_details WHERE session_id=?", (sid,)
    ).fetchone()
    faculty = detail is not None and detail["kind"] == "faculty"
    if faculty:
        permitted = (
            actor["role"] == "professor" and detail["organizer_id"] == actor["id"]
        )
        if permitted:
            tid = db.execute(
                "SELECT topic_id FROM session_topics WHERE session_id=?", (sid,)
            ).fetchone()[0]
            assigned(db, actor, tid)
    else:
        permitted = actor["role"] == "tutor" and current["tutor"]["id"] == actor["id"]
    if not permitted:
        raise HTTPException(403, "Only the session publisher can manage this offering.")
    if current["status"] != "upcoming" or current["starts_at"] <= now():
        raise HTTPException(409, "Past or cancelled sessions cannot be changed.")
    if body is None:
        db.execute("UPDATE sessions SET status='cancelled' WHERE id=?", (sid,))
        learners = db.execute(
            "SELECT learner_id FROM bookings WHERE session_id=? AND status='confirmed'",
            (sid,),
        ).fetchall()
        db.execute(
            "UPDATE bookings SET status='cancelled' WHERE session_id=? AND status='confirmed'",
            (sid,),
        )
        db.execute(
            "UPDATE support_actions SET status='cancelled' WHERE session_id=?", (sid,)
        )
        for row in learners:
            for t in current["topics"]:
                reopen_requests(db, row[0], t["id"])
    else:
        t, data = validate_event(db, body)
        if not db.execute(
            "SELECT 1 FROM tutor_approvals WHERE tutor_id=? AND subject_id=?",
            (current["tutor"]["id"], t["subject_id"]),
        ).fetchone():
            raise HTTPException(403, "The tutor is not approved for this subject.")
        if faculty:
            assigned(db, actor, body.topic_id)
        old_topics = [t["id"] for t in current["topics"]]
        if faculty and body.topic_id not in old_topics:
            raise HTTPException(
                409, "Keep the triggering topic of a faculty support action."
            )
        if data["format"] == "Online" and current["format"] == "Online":
            data["location"] = current["location"]
        # Topic cannot change once any booking history exists: keep saved checks meaningful.
        has_history = db.execute(
            "SELECT 1 FROM bookings WHERE session_id=?", (sid,)
        ).fetchone()
        if has_history and body.topic_id not in old_topics:
            raise HTTPException(
                409, "Keep the topic once a session has booking history."
            )
        if current["booked_seats"] and (
            any(
                data[k] != current[k]
                for k in ("starts_at", "duration_minutes", "format", "location")
            )
            or body.topic_id not in old_topics
            or body.capacity < current["capacity"]
        ):
            raise HTTPException(
                409,
                "With bookings, edit only text, objectives or increase capacity. Cancel explicitly to change plans.",
            )
        check_host_schedule(db, current["tutor"]["id"], data, sid)
        db.execute(
            """UPDATE sessions SET subject_id=?,title=?,description=?,goals=?,starts_at=?,duration_minutes=?,capacity=?,format=?,location=? WHERE id=?""",
            (
                t["subject_id"],
                data["title"],
                data["description"],
                json.dumps(data["goals"]),
                data["starts_at"],
                data["duration_minutes"],
                data["capacity"],
                data["format"],
                data["location"],
                sid,
            ),
        )
        if body.topic_id not in old_topics:
            db.execute(
                "DELETE FROM answer_options WHERE question_id IN (SELECT id FROM assessment_questions WHERE check_id IN (SELECT id FROM learning_checks WHERE session_id=?))",
                (sid,),
            )
            db.execute(
                "DELETE FROM assessment_questions WHERE check_id IN (SELECT id FROM learning_checks WHERE session_id=?)",
                (sid,),
            )
            db.execute("DELETE FROM learning_checks WHERE session_id=?", (sid,))
            db.execute("DELETE FROM session_topics WHERE session_id=?", (sid,))
            attach_checks(db, sid, body.topic_id)
    db.commit()
    return repo.session(db, sid)


def topic_signal(db, tid):
    rows = db.execute(
        "SELECT response,COUNT(*) AS n FROM learning_pulses WHERE topic_id=? AND active=1 GROUP BY response",
        (tid,),
    ).fetchall()
    counts = {r["response"]: r["n"] for r in rows}
    n = sum(counts.values())
    requests_n = db.execute(
        "SELECT COUNT(DISTINCT learner_id) FROM support_requests WHERE topic_id=? AND status='open'",
        (tid,),
    ).fetchone()[0]
    offers = [s for s in repo.sessions(db) if any(t["id"] == tid for t in s["topics"])]
    group_capacity = db.execute(
        "SELECT COALESCE(SUM(g.capacity-(SELECT COUNT(*) FROM group_memberships m WHERE m.group_id=g.id)),0) FROM study_groups g WHERE topic_id=? AND status='active' AND starts_at>?",
        (tid, now()),
    ).fetchone()[0]
    return {
        "topic": topic(db, tid),
        "participants": n,
        "suppressed": n < 3,
        "distribution": (
            {k: counts.get(k, 0) for k in ("confident", "practice", "support")}
            if n >= 3
            else None
        ),
        "open_requests": requests_n if requests_n >= 3 else None,
        "requests_suppressed": requests_n < 3,
        "tutoring_places": sum(s["available_seats"] for s in offers),
        "study_group_places": group_capacity,
        "recommendation": (
            "Review additional support for this topic."
            if requests_n >= 3
            else "Invite voluntary participation and review available support."
        ),
        "rule": "Illustrative rule: at least 3 open requests prompts human review. Counts below 3 are suppressed. No trend is inferred without historical evidence.",
        "missing_data": "No longitudinal grades, assignment results or validated learning measure. Voluntary pulses do not measure academic performance.",
        "human_review_required": True,
        "synthetic": True,
    }


def professor_signals(db, actor):
    if actor["role"] != "professor":
        raise HTTPException(403, "Choose the Professor workspace.")
    return [
        topic_signal(db, r["id"])
        for r in db.execute(
            "SELECT t.id FROM topics t JOIN professor_subjects p ON p.subject_id=t.subject_id WHERE p.professor_id=? ORDER BY t.id",
            (actor["id"],),
        )
    ]


ACTION_QUERY = """SELECT a.*,t.name AS topic_name,s.name AS subject_name FROM support_actions a JOIN topics t ON t.id=a.topic_id JOIN subjects s ON s.id=t.subject_id"""


def action_dict(row):
    result = dict(row)
    result["evidence"] = json.loads(result["evidence"])
    return result


def own_action(db, actor, aid):
    row = db.execute(
        ACTION_QUERY + " WHERE a.id=? AND a.professor_id=?", (aid, actor["id"])
    ).fetchone()
    if row is None:
        raise HTTPException(404, "Support action not found in your workspace.")
    assigned(db, actor, row["topic_id"])
    return action_dict(row)


def actions(db, actor):
    if actor["role"] != "professor":
        raise HTTPException(403, "Choose the Professor workspace.")
    return [
        action_dict(r)
        for r in db.execute(
            ACTION_QUERY
            + " WHERE a.professor_id=? AND t.subject_id IN (SELECT subject_id FROM professor_subjects WHERE professor_id=?) ORDER BY a.id DESC",
            (actor["id"], actor["id"]),
        )
    ]


def create_action(db, actor, body):
    assigned(db, actor, body.topic_id)
    db.execute("BEGIN IMMEDIATE")
    from .learning import topic_insights

    evidence = topic_signal(db, body.topic_id)
    evidence["learning_checks"] = next(
        (
            t
            for t in topic_insights(
                db, actor["id"], topic(db, body.topic_id)["subject_id"]
            )
            if t["topic"]["id"] == body.topic_id
        ),
        None,
    )
    evidence["captured_at"] = now()
    aid = db.execute(
        """INSERT INTO support_actions(professor_id,topic_id,action_type,rationale,created_at,follow_up_date,notes,evidence) VALUES (?,?,?,?,?,?,?,?)""",
        (
            actor["id"],
            body.topic_id,
            body.action_type,
            body.rationale,
            now(),
            body.follow_up_date,
            body.notes,
            json.dumps(evidence),
        ),
    ).lastrowid
    db.commit()
    return own_action(db, actor, aid)
