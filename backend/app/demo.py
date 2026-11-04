"""Append fresh synthetic opportunities without rewriting dates or deleting history.
Run explicitly: python -m app.demo --add-examples
"""

import argparse
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException
from .db import connect, database_path, initialize
from . import connected as svc, repository as repo
from .connected_schemas import EventInput, SessionInput
from .learning import now


def add_examples(path):
    initialize(path)
    added = 0
    # Repeatable while future examples exist. Expired examples and all interactions stay intact.
    for index, tid in enumerate((1, 5, 2, 3)):
        with connect(path) as db:
            if db.execute(
                "SELECT 1 FROM study_groups WHERE topic_id=? AND source='seeded-synthetic' AND status='active' AND starts_at>?",
                (tid, now()),
            ).fetchone():
                continue
            body = EventInput(
                topic_id=tid,
                title=f"{svc.topic(db,tid)['name']}: practice together",
                description="Fresh synthetic example. Bring a question and learn together.",
                starts_at=datetime.now(timezone.utc) + timedelta(days=index + 3),
                duration_minutes=60,
                capacity=6,
                format="In person",
                location="Library · shared study area",
            )
            g = svc.save_group(db, repo.user(db, 7), body)
            db.execute(
                "UPDATE study_groups SET source='seeded-synthetic' WHERE id=?",
                (g["id"],),
            )
            added += 1
    for index, tid in enumerate((1, 5)):
        with connect(path) as db:
            exists = db.execute(
                """SELECT 1 FROM sessions s JOIN session_topics st ON st.session_id=s.id LEFT JOIN session_details d ON d.session_id=s.id
              WHERE st.topic_id=? AND COALESCE(d.source,'seeded-synthetic')='seeded-synthetic' AND s.status='upcoming' AND s.starts_at>?""",
                (tid, now()),
            ).fetchone()
            if exists:
                continue
        for offset in range(14 + index, 40):
            with connect(path) as db:
                start = (datetime.now(timezone.utc) + timedelta(days=offset)).replace(
                    hour=10, minute=0, second=0, microsecond=0
                )
                body = SessionInput(
                    topic_id=tid,
                    title=f"{svc.topic(db,tid)['name']}: fresh practice",
                    description="Fresh synthetic peer-tutoring example. Explore a new problem with David.",
                    goals=["Discuss a fresh example and explain your reasoning"],
                    starts_at=start,
                    duration_minutes=60,
                    capacity=6,
                    format="In person",
                    location="Library · Room 2.04",
                )
                try:
                    s = svc.publish_session(db, repo.user(db, 2), body)
                except HTTPException as error:
                    db.rollback()
                    if error.status_code == 409:
                        continue
                    raise
                db.execute(
                    "UPDATE session_details SET source='seeded-synthetic' WHERE session_id=?",
                    (s["id"],),
                )
                added += 1
                break
    return added


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--add-examples", action="store_true", required=True)
    parser.parse_args()
    print(
        f"Added {add_examples(database_path())} fresh synthetic opportunities. Existing records preserved."
    )
