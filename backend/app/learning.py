"""Synthetic Learning Checks. Demo selectors demonstrate ownership, not authentication."""

import json
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException

# Each row contains two comparable pre questions and two different post questions.
# Correct option indices and explanations stay on the server until that check is submitted.
BANK = {
    1: (
        "Chain rule",
        [
            (
                "In (3x + 1)², which is the inner function?",
                ["3x + 1", "x²", "2x"],
                0,
                "The outer function squares the inner expression 3x + 1.",
            ),
            (
                "Differentiate (2x + 1)³.",
                ["3(2x + 1)²", "6(2x + 1)²", "6x²"],
                1,
                "Multiply the outer derivative 3(2x + 1)² by the inner derivative 2.",
            ),
            (
                "In sin(4x), which is the inner function?",
                ["sin(x)", "cos(x)", "4x"],
                2,
                "Sine is the outer function; 4x is its input.",
            ),
            (
                "Differentiate (5x − 2)².",
                ["10(5x − 2)", "2(5x − 2)", "25x²"],
                0,
                "Multiply 2(5x − 2) by the inner derivative 5.",
            ),
        ],
    ),
    2: (
        "Python loops and functions",
        [
            (
                "How many iterations does range(3) produce?",
                ["2", "3", "4"],
                1,
                "range(3) produces 0, 1 and 2.",
            ),
            (
                "Which keyword returns a function's result?",
                ["print", "for", "return"],
                2,
                "return passes a value back to the caller.",
            ),
            (
                "How many iterations does range(2, 6) produce?",
                ["4", "5", "6"],
                0,
                "The values are 2, 3, 4 and 5; the upper bound is excluded.",
            ),
            (
                "What does def twice(x): return x * 2 return for twice(4)?",
                ["4", "8", "None"],
                1,
                "The returned expression is 4 times 2, which is 8.",
            ),
        ],
    ),
    3: (
        "Forces and motion",
        [
            (
                "Which belongs on a free-body diagram?",
                ["Forces on the chosen body", "Only its speed", "Only its path"],
                0,
                "Draw the forces acting on the selected body.",
            ),
            (
                "A net force of 6 N acts on 2 kg. Acceleration?",
                ["12 m/s²", "3 m/s²", "0 m/s²"],
                1,
                "Newton's second law gives a = F/m = 6/2.",
            ),
            (
                "Which arrow represents weight near Earth?",
                ["Along the velocity", "Always upward", "Toward Earth's centre"],
                2,
                "Gravity acts toward Earth's centre regardless of motion.",
            ),
            (
                "A net force of 12 N acts on 3 kg. Acceleration?",
                ["4 m/s²", "36 m/s²", "9 m/s²"],
                0,
                "Apply a = F/m = 12/3 = 4 m/s².",
            ),
        ],
    ),
    4: (
        "Supply and demand",
        [
            (
                "In the usual price–quantity graph, demand slopes…",
                ["Upward", "Downward", "Vertically only"],
                1,
                "Holding other factors fixed, quantity demanded falls as price rises.",
            ),
            (
                "Demand rises while supply stays fixed. Equilibrium price usually…",
                ["Falls", "Stays fixed", "Rises"],
                2,
                "A rightward demand shift raises equilibrium price and quantity.",
            ),
            (
                "In the usual price–quantity graph, supply slopes…",
                ["Upward", "Downward", "Horizontally only"],
                0,
                "Higher prices usually encourage greater quantity supplied.",
            ),
            (
                "Supply rises while demand stays fixed. Equilibrium price usually…",
                ["Rises", "Falls", "Stays fixed"],
                1,
                "A rightward supply shift lowers equilibrium price and raises quantity.",
            ),
        ],
    ),
    5: (
        "Distributions and confidence intervals",
        [
            (
                "A normal distribution is…",
                ["Symmetric about its mean", "Always skewed right", "Uniform"],
                0,
                "The normal curve is symmetric, with its centre at the mean.",
            ),
            (
                "A 95% confidence procedure means…",
                [
                    "95% of observations lie in each interval",
                    "95% of repeated intervals cover the fixed parameter",
                    "The parameter changes each time",
                ],
                1,
                "Coverage refers to intervals built across repeated samples under the model assumptions.",
            ),
            (
                "For a normal distribution, mean and median are…",
                ["Always zero", "Unrelated", "Equal"],
                2,
                "Symmetry makes the mean and median coincide.",
            ),
            (
                "With the same model, a larger sample usually makes a confidence interval…",
                ["Narrower", "Wider", "Exactly unchanged"],
                0,
                "More data usually reduce standard error; coverage assumptions still matter.",
            ),
        ],
    ),
    6: (
        "Stacks and queues",
        [
            (
                "A stack removes items in which order?",
                ["First in, first out", "Last in, first out", "Random"],
                1,
                "A stack pops the most recently pushed item.",
            ),
            (
                "Which structure suits a first-come service line?",
                ["Stack", "Set", "Queue"],
                2,
                "A queue serves the earliest enqueued item first.",
            ),
            (
                "Push A, then B onto a stack. First pop?",
                ["B", "A", "Both"],
                0,
                "B was last pushed, so it is removed first.",
            ),
            (
                "Enqueue A, then B. First dequeue?",
                ["B", "A", "Neither"],
                1,
                "A arrived first and is dequeued first.",
            ),
        ],
    ),
}


def migrate(db):
    # Additive, repeatable schema; never rewrite existing bookings or session dates.
    db.executescript(
        """
    CREATE TABLE IF NOT EXISTS learning_migrations (version INTEGER PRIMARY KEY);
    CREATE TABLE IF NOT EXISTS professor_subjects (
        professor_id INTEGER REFERENCES users(id), subject_id INTEGER REFERENCES subjects(id),
        PRIMARY KEY(professor_id, subject_id));
    CREATE TABLE IF NOT EXISTS topics (
        id INTEGER PRIMARY KEY, subject_id INTEGER NOT NULL REFERENCES subjects(id), name TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS learning_objectives (
        id INTEGER PRIMARY KEY, topic_id INTEGER NOT NULL REFERENCES topics(id), description TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS session_topics (
        session_id INTEGER REFERENCES sessions(id), topic_id INTEGER REFERENCES topics(id),
        PRIMARY KEY(session_id, topic_id));
    CREATE TABLE IF NOT EXISTS learning_checks (
        id INTEGER PRIMARY KEY, session_id INTEGER NOT NULL REFERENCES sessions(id),
        stage TEXT NOT NULL CHECK(stage IN ('pre','post')), UNIQUE(session_id,stage));
    CREATE TABLE IF NOT EXISTS assessment_questions (
        id INTEGER PRIMARY KEY, check_id INTEGER NOT NULL REFERENCES learning_checks(id),
        objective_id INTEGER NOT NULL REFERENCES learning_objectives(id), prompt TEXT NOT NULL,
        explanation TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS answer_options (
        id INTEGER PRIMARY KEY, question_id INTEGER NOT NULL REFERENCES assessment_questions(id),
        label TEXT NOT NULL, is_correct INTEGER NOT NULL CHECK(is_correct IN (0,1)));
    CREATE TABLE IF NOT EXISTS demo_session_completions (
        booking_id INTEGER PRIMARY KEY REFERENCES bookings(id), simulated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS assessment_submissions (
        id INTEGER PRIMARY KEY, booking_id INTEGER NOT NULL REFERENCES bookings(id),
        check_id INTEGER NOT NULL REFERENCES learning_checks(id), correct INTEGER NOT NULL,
        total INTEGER NOT NULL CHECK(total>0), submitted_at TEXT NOT NULL,
        source TEXT NOT NULL CHECK(source IN ('demo-interaction','seeded-synthetic')),
        UNIQUE(booking_id,check_id));
    CREATE TABLE IF NOT EXISTS learner_responses (
        submission_id INTEGER REFERENCES assessment_submissions(id),
        question_id INTEGER REFERENCES assessment_questions(id), option_id INTEGER NOT NULL REFERENCES answer_options(id),
        PRIMARY KEY(submission_id,question_id));
    CREATE INDEX IF NOT EXISTS submission_check ON assessment_submissions(check_id);
    """
    )
    if db.execute("SELECT 1 FROM learning_migrations WHERE version=1").fetchone():
        return
    db.executemany(
        "INSERT OR IGNORE INTO professor_subjects VALUES (3,?)", [(1,), (5,)]
    )
    for sid, (topic, questions) in BANK.items():
        session = db.execute("SELECT * FROM sessions WHERE id=?", (sid,)).fetchone()
        if session is None:
            continue
        db.execute(
            "INSERT INTO topics VALUES (?,?,?)", (sid, session["subject_id"], topic)
        )
        db.execute("INSERT INTO session_topics VALUES (?,?)", (sid, sid))
        for i, goal in enumerate(json.loads(session["goals"])[:2]):
            db.execute(
                "INSERT INTO learning_objectives VALUES (?,?,?)",
                (sid * 10 + i, sid, goal),
            )
        for stage, offset in [("pre", 0), ("post", 2)]:
            cid = sid * 10 + (stage == "post")
            db.execute("INSERT INTO learning_checks VALUES (?,?,?)", (cid, sid, stage))
            for i, (prompt, options, correct, explanation) in enumerate(
                questions[offset : offset + 2]
            ):
                qid = cid * 10 + i
                db.execute(
                    "INSERT INTO assessment_questions VALUES (?,?,?,?,?)",
                    (qid, cid, sid * 10 + i, prompt, explanation),
                )
                db.executemany(
                    "INSERT INTO answer_options VALUES (?,?,?,?)",
                    [
                        (qid * 10 + j, qid, label, int(j == correct))
                        for j, label in enumerate(options)
                    ],
                )
    # Two existing fictional chain-rule bookings illustrate suppression until Laura joins.
    # Never create seats or alter attendance to populate an insights chart.
    for row in db.execute(
        "SELECT * FROM bookings WHERE session_id=1 AND learner_id IN (7,8) AND status='confirmed'"
    ).fetchall():
        db.execute(
            "INSERT INTO demo_session_completions VALUES (?,?)", (row["id"], now())
        )
        for stage in ("pre", "post"):
            check = get_check(db, 1, stage)
            answers = {}
            for i, q in enumerate(question_rows(db, check["id"])):
                options = db.execute(
                    "SELECT * FROM answer_options WHERE question_id=? ORDER BY id",
                    (q["id"],),
                ).fetchall()
                want_correct = stage == "post" and i == 0
                answers[str(q["id"])] = next(
                    o["id"] for o in options if bool(o["is_correct"]) == want_correct
                )
            save_submission(db, row["id"], check, answers, "seeded-synthetic")
    db.execute("INSERT INTO learning_migrations VALUES (1)")


def now():
    return datetime.now(timezone.utc).isoformat()


def own_booking(db, actor, booking_id):
    row = db.execute(
        "SELECT b.*, s.starts_at,s.duration_minutes FROM bookings b JOIN sessions s ON s.id=b.session_id WHERE b.id=? AND b.learner_id=?",
        (booking_id, actor["id"]),
    ).fetchone()
    if row is None or actor["role"] == "professor":
        raise HTTPException(404, "Learning Check not found for this demo learner.")
    return row


def get_check(db, sid, stage):
    row = db.execute(
        "SELECT * FROM learning_checks WHERE session_id=? AND stage=?", (sid, stage)
    ).fetchone()
    if row is None:
        raise HTTPException(
            404, "No curated Learning Check is available for this session yet."
        )
    return row


def question_rows(db, cid):
    return db.execute(
        "SELECT * FROM assessment_questions WHERE check_id=? ORDER BY id", (cid,)
    ).fetchall()


def submission(db, bid, cid):
    return db.execute(
        "SELECT * FROM assessment_submissions WHERE booking_id=? AND check_id=?",
        (bid, cid),
    ).fetchone()


def score(row):
    return (
        None
        if row is None
        else {
            "correct": row["correct"],
            "total": row["total"],
            "percent": round(100 * row["correct"] / row["total"], 1),
            "submitted_at": row["submitted_at"],
        }
    )


def readiness(db, booking, stage):
    if booking["status"] != "confirmed":
        return "This booking is cancelled. Saved results remain available; new checks are closed."
    if stage == "post":
        pre = get_check(db, booking["session_id"], "pre")
        if not submission(db, booking["id"], pre["id"]):
            return "Complete the pre-session check first so you have a comparison."
        ended = datetime.fromisoformat(booking["starts_at"]) + timedelta(
            minutes=booking["duration_minutes"]
        ) <= datetime.now(timezone.utc)
        simulated = db.execute(
            "SELECT 1 FROM demo_session_completions WHERE booking_id=?",
            (booking["id"],),
        ).fetchone()
        attended = db.execute(
            "SELECT 1 FROM session_attendance WHERE booking_id=? AND confirmed_at IS NOT NULL",
            (booking["id"],),
        ).fetchone()
        if not ended and not simulated and not attended:
            return (
                "Available after the session ends, or use the labeled demo simulation."
            )
    return None


def check_payload(db, actor, bid, stage):
    booking = own_booking(db, actor, bid)
    check = get_check(db, booking["session_id"], stage)
    done = submission(db, bid, check["id"])
    reason = readiness(db, booking, stage)
    questions = []
    # Locked post checks do not disclose their questions early.
    if done or not reason:
        for q in question_rows(db, check["id"]):
            item = {
                "id": q["id"],
                "prompt": q["prompt"],
                "objective_id": q["objective_id"],
                "options": [
                    dict(o)
                    for o in db.execute(
                        "SELECT id,label FROM answer_options WHERE question_id=? ORDER BY id",
                        (q["id"],),
                    )
                ],
            }
            if done:
                item.update(
                    explanation=q["explanation"],
                    correct_option_id=db.execute(
                        "SELECT id FROM answer_options WHERE question_id=? AND is_correct=1",
                        (q["id"],),
                    ).fetchone()[0],
                    selected_option_id=db.execute(
                        "SELECT option_id FROM learner_responses WHERE submission_id=? AND question_id=?",
                        (done["id"], q["id"]),
                    ).fetchone()[0],
                )
            questions.append(item)
    return {
        "booking_id": bid,
        "stage": stage,
        "status": "completed" if done else "locked" if reason else "pending",
        "reason": reason,
        "result": score(done),
        "questions": questions,
    }


def save_submission(db, bid, check, answers, source):
    questions = question_rows(db, check["id"])
    if set(answers) != {str(q["id"]) for q in questions}:
        raise HTTPException(
            422,
            "Answer every question once before submitting. Partial checks are not scored.",
        )
    correct = 0
    for q in questions:
        option = db.execute(
            "SELECT is_correct FROM answer_options WHERE id=? AND question_id=?",
            (answers[str(q["id"])], q["id"]),
        ).fetchone()
        if option is None:
            raise HTTPException(
                422, "Choose one of the listed options for each question."
            )
        correct += option[0]
    cur = db.execute(
        "INSERT INTO assessment_submissions(booking_id,check_id,correct,total,submitted_at,source) VALUES (?,?,?,?,?,?)",
        (bid, check["id"], correct, len(questions), now(), source),
    )
    db.executemany(
        "INSERT INTO learner_responses VALUES (?,?,?)",
        [(cur.lastrowid, q["id"], answers[str(q["id"])]) for q in questions],
    )


def submit(db, actor, bid, stage, answers):
    db.execute("BEGIN IMMEDIATE")
    booking = own_booking(db, actor, bid)
    check = get_check(db, booking["session_id"], stage)
    if submission(db, bid, check["id"]):
        raise HTTPException(
            409,
            "This check is already submitted. Reopen it to review your saved result.",
        )
    reason = readiness(db, booking, stage)
    if reason:
        raise HTTPException(409, reason)
    save_submission(db, bid, check, answers, "demo-interaction")
    db.commit()
    return check_payload(db, actor, bid, stage)


def simulate(db, actor, bid):
    db.execute("BEGIN IMMEDIATE")
    booking = own_booking(db, actor, bid)
    pre = get_check(db, booking["session_id"], "pre")
    if booking["status"] != "confirmed" or not submission(db, bid, pre["id"]):
        raise HTTPException(
            409,
            "Keep a confirmed booking and complete its pre-session check before simulating.",
        )
    db.execute(
        "INSERT OR IGNORE INTO demo_session_completions VALUES (?,?)", (bid, now())
    )
    db.commit()
    return {
        "mode": "synthetic-demo",
        "message": "Post-session check unlocked for this booking only. No real attendance or tutor points recorded.",
    }


def history(db, actor):
    items = []
    for b in db.execute(
        "SELECT b.*,s.title FROM bookings b JOIN sessions s ON s.id=b.session_id WHERE b.learner_id=? ORDER BY s.starts_at DESC,b.id DESC",
        (actor["id"],),
    ).fetchall():
        topics = [
            dict(t)
            for t in db.execute(
                "SELECT t.* FROM topics t JOIN session_topics st ON st.topic_id=t.id WHERE st.session_id=?",
                (b["session_id"],),
            )
        ]
        if not topics:
            continue
        results = {}
        for stage in ("pre", "post"):
            p = check_payload(db, actor, b["id"], stage)
            results[stage] = {
                "status": p["status"],
                "result": p["result"],
                "reason": p["reason"],
            }
        pre, post = results["pre"]["result"], results["post"]["result"]
        delta = round(post["percent"] - pre["percent"], 1) if pre and post else None
        items.append(
            {
                "booking_id": b["id"],
                "session_id": b["session_id"],
                "title": b["title"],
                "booking_status": b["status"],
                "topics": topics,
                "objectives": [
                    dict(o)
                    for o in db.execute(
                        "SELECT o.* FROM learning_objectives o JOIN session_topics st ON st.topic_id=o.topic_id WHERE st.session_id=? ORDER BY o.id",
                        (b["session_id"],),
                    )
                ],
                "pre": results["pre"],
                "post": results["post"],
                "change_percentage_points": delta,
                "simulated": bool(
                    db.execute(
                        "SELECT 1 FROM demo_session_completions WHERE booking_id=?",
                        (b["id"],),
                    ).fetchone()
                ),
                "suggestion": (
                    "Try two more practice problems and consider another peer session."
                    if post and post["percent"] < 67
                    else (
                        "Revisit the explanations, then try a fresh example."
                        if post
                        else (
                            "Start with a short pre-session check."
                            if not pre
                            else "Bring your questions to tutoring, then try the follow-up check."
                        )
                    )
                ),
            }
        )
    return {
        "items": items,
        "note": "Synthetic demonstration only. Score differences describe these short checks; they are not validated learning gains, grades or attendance evidence.",
    }


def aggregate(values):
    return {
        "n": len(values),
        "suppressed": len(values) < 3,
        "mean_percent": (
            round(sum(values) / len(values), 1) if len(values) >= 3 else None
        ),
    }


def topic_insights(db, professor_id, subject_id):
    if not db.execute(
        "SELECT 1 FROM professor_subjects WHERE professor_id=? AND subject_id=?",
        (professor_id, subject_id),
    ).fetchone():
        return []
    items = []
    for t in db.execute(
        "SELECT * FROM topics WHERE subject_id=? ORDER BY id", (subject_id,)
    ):
        # Latest confirmed booking per distinct learner prevents repeated seats inflating n.
        rows = db.execute(
            """SELECT b.id,b.learner_id FROM bookings b JOIN session_topics st ON st.session_id=b.session_id
            WHERE st.topic_id=? AND b.status='confirmed' ORDER BY b.id""",
            (t["id"],),
        ).fetchall()
        latest = {r["learner_id"]: r["id"] for r in rows}
        pre, post, pairs, changes = [], [], [], []
        for bid in latest.values():
            b = db.execute(
                "SELECT session_id FROM bookings WHERE id=?", (bid,)
            ).fetchone()
            a = score(submission(db, bid, get_check(db, b[0], "pre")["id"]))
            z = score(submission(db, bid, get_check(db, b[0], "post")["id"]))
            if a:
                pre.append(a["percent"])
            if z:
                post.append(z["percent"])
            if a and z:
                pairs.append((a["percent"], z["percent"]))
                changes.append(z["percent"] - a["percent"])
        pre_stats, post_stats = aggregate(pre), aggregate(post)
        paired = {
            "n": len(pairs),
            "suppressed": len(pairs) < 3,
            "pre_mean_percent": (
                round(sum(x[0] for x in pairs) / len(pairs), 1)
                if len(pairs) >= 3
                else None
            ),
            "post_mean_percent": (
                round(sum(x[1] for x in pairs) / len(pairs), 1)
                if len(pairs) >= 3
                else None
            ),
            "mean_change_percentage_points": (
                round(sum(changes) / len(changes), 1) if len(pairs) >= 3 else None
            ),
        }
        from . import repository as repo

        offerings = [
            s
            for s in repo.sessions(db, subject_id=subject_id)
            if db.execute(
                "SELECT 1 FROM session_topics WHERE session_id=? AND topic_id=?",
                (s["id"], t["id"]),
            ).fetchone()
        ]
        capacity = sum(s["capacity"] for s in offerings)
        booked_places = sum(s["booked_seats"] for s in offerings)
        demand = len(latest)
        if (
            demand >= 3
            and post_stats["mean_percent"] is not None
            and post_stats["mean_percent"] < 67
        ):
            recommendation = (
                "Consider additional practice materials or an official TA-led session."
            )
            signals = [
                f"{demand} distinct learners have confirmed topic bookings (demand).",
                f"Post-check mean {post_stats['mean_percent']}% across n={post_stats['n']} distinct learners (assessment evidence, threshold below 67%).",
            ]
        elif demand >= 3:
            recommendation = (
                "Review whether more tutoring places would help meet demand."
            )
            signals = [
                f"{demand} distinct learners have confirmed topic bookings (demand threshold: 3).",
                "No publishable low post-check mean; booking activity alone does not establish difficulty.",
            ]
        else:
            recommendation = (
                "Keep observing; there is insufficient evidence for a teaching change."
            )
            signals = [
                f"{demand} distinct learners have confirmed topic bookings; demand threshold is 3.",
                "Assessment means require at least 3 distinct learners per group.",
            ]
        items.append(
            {
                "topic": dict(t),
                "confirmed_bookings": len(rows),
                "capacity": capacity,
                "booked_places": booked_places,
                "available_places": max(0, capacity - booked_places),
                "distinct_booked_learners": demand,
                "pre": pre_stats,
                "post": post_stats,
                "paired": paired,
                "recommendation": {
                    "text": recommendation,
                    "signals": signals,
                    "human_review_required": True,
                },
            }
        )
    return items
