from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from app.db import connect, initialize
from app.main import create_app
from app.seed import seed


@pytest.fixture
def client(tmp_path):
    with TestClient(create_app(str(tmp_path / "learning.sqlite3"))) as client:
        yield client


def actor(uid=1):
    return {"X-Demo-User-Id": str(uid)}


def book(client, sid=1, uid=1):
    r = client.post("/api/bookings", headers=actor(uid), json={"session_id": sid})
    assert r.status_code == 201, r.text
    return r.json()["id"]


def path(bid, stage="pre"):
    return f"/api/bookings/{bid}/learning-checks/{stage}"


def answers(client, bid, stage="pre", correct=2):
    # Test oracle reads the private database; clients never receive this answer key.
    with connect(client.app.state.db_path) as db:
        cid = db.execute(
            "SELECT c.id FROM learning_checks c JOIN bookings b ON b.session_id=c.session_id WHERE b.id=? AND c.stage=?",
            (bid, stage),
        ).fetchone()[0]
        qs = db.execute(
            "SELECT id FROM assessment_questions WHERE check_id=? ORDER BY id", (cid,)
        ).fetchall()
        return {
            str(q[0]): db.execute(
                "SELECT id FROM answer_options WHERE question_id=? AND is_correct=? ORDER BY id LIMIT 1",
                (q[0], int(i < correct)),
            ).fetchone()[0]
            for i, q in enumerate(qs)
        }


def submit(client, bid, stage="pre", correct=2, uid=1):
    return client.post(
        path(bid, stage),
        headers=actor(uid),
        json={"answers": answers(client, bid, stage, correct)},
    )


def simulate(client, bid, uid=1):
    return client.post(f"/api/bookings/{bid}/simulate-completion", headers=actor(uid))


def history(client, uid=1):
    return client.get("/api/learning/history", headers=actor(uid)).json()


def topic(client, subject=0):
    return client.get("/api/insights", headers=actor(3)).json()["courses"][subject][
        "topics"
    ][0]


def test_booking_to_pre_check_and_public_metadata_without_answers(client):
    bid = book(client)
    payload = client.get(path(bid), headers=actor()).json()
    assert payload["status"] == "pending" and payload["result"] is None
    assert len(payload["questions"]) == 2
    for q in payload["questions"]:
        assert set(q) == {"id", "prompt", "objective_id", "options"}
        assert all(set(o) == {"id", "label"} for o in q["options"])
    topics = client.get("/api/learning/topics").json()
    assert len(topics) == 6 and all(len(t["objectives"]) == 2 for t in topics)
    sessions = client.get("/api/sessions").json()
    assert all(s["learning_check_available"] for s in sessions)
    assert client.get(path(bid, "post"), headers=actor()).json()["questions"] == []


def test_backend_scoring_responses_and_review_survive_restart(client):
    bid = book(client)
    result = submit(client, bid, correct=1)
    assert result.status_code == 201, result.text
    p = result.json()
    assert p["status"] == "completed"
    assert (p["result"]["correct"], p["result"]["total"], p["result"]["percent"]) == (
        1,
        2,
        50,
    )
    assert all(
        q["explanation"] and q["selected_option_id"] and q["correct_option_id"]
        for q in p["questions"]
    )
    with connect(client.app.state.db_path) as db:
        assert (
            db.execute(
                "SELECT COUNT(*) FROM learner_responses r JOIN assessment_submissions s ON s.id=r.submission_id WHERE s.booking_id=?",
                (bid,),
            ).fetchone()[0]
            == 2
        )
    with TestClient(create_app(client.app.state.db_path)) as reopened:
        assert reopened.get(path(bid), headers=actor()).json() == p
        assert (
            reopened.get("/api/learning/history", headers=actor()).json()["items"][0][
                "pre"
            ]["result"]
            == p["result"]
        )


def test_post_demo_completion_and_exact_comparison_without_attendance_or_points(client):
    bid = book(client)
    points = client.get("/api/tutor/overview", headers=actor(2)).json()[
        "engagement_points"
    ]
    assert simulate(client, bid).status_code == 409
    assert submit(client, bid, "post").status_code == 409
    assert submit(client, bid, correct=1).status_code == 201
    assert submit(client, bid, "post").status_code == 409
    assert simulate(client, bid).status_code == 200
    assert simulate(client, bid).status_code == 200
    post = client.get(path(bid, "post"), headers=actor()).json()
    pre = client.get(path(bid), headers=actor()).json()
    assert {q["id"] for q in pre["questions"]}.isdisjoint(
        q["id"] for q in post["questions"]
    )
    assert {q["objective_id"] for q in pre["questions"]} == {
        q["objective_id"] for q in post["questions"]
    }
    assert all(
        "explanation" not in q and "correct_option_id" not in q
        for q in post["questions"]
    )
    assert submit(client, bid, "post").status_code == 201
    item = history(client)["items"][0]
    assert item["simulated"] and item["change_percentage_points"] == 50
    assert item["post"]["result"]["percent"] == 100
    assert client.get("/api/sessions/1").json()["status"] == "upcoming"
    assert (
        client.get("/api/tutor/overview", headers=actor(2)).json()["engagement_points"]
        == points
    )


def test_partial_invalid_and_forged_submissions_never_persist(client):
    bid = book(client)
    valid = answers(client, bid)
    payloads = [
        {},
        {"answers": {}},
        {"answers": dict(list(valid.items())[:1])},
        {"answers": {**valid, "99999": 5}},
        {"answers": {k: 999999 for k in valid}},
        {"answers": {k: True for k in valid}},
        {"answers": {k: str(v) for k, v in valid.items()}},
        {"answers": valid, "score": 100},
    ]
    for payload in payloads:
        assert client.post(path(bid), headers=actor(), json=payload).status_code == 422
    with connect(client.app.state.db_path) as db:
        assert (
            db.execute(
                "SELECT COUNT(*) FROM assessment_submissions WHERE booking_id=?", (bid,)
            ).fetchone()[0]
            == 0
        )
    assert history(client)["items"][0]["change_percentage_points"] is None


def test_ownership_on_read_write_simulation_history_and_demo_roles(client):
    bid = book(client)
    assert submit(client, bid).status_code == 201
    for uid in (2, 3, 7, 8):
        for stage in ("pre", "post"):
            assert client.get(path(bid, stage), headers=actor(uid)).status_code == 404
            assert submit(client, bid, stage, uid=uid).status_code == 404
        assert simulate(client, bid, uid).status_code == 404
    assert all(i["booking_id"] != bid for i in history(client, 7)["items"])
    assert client.get("/api/learning/history", headers=actor(3)).status_code == 403
    assert client.get(path(bid)).status_code == 422
    assert client.get(path(bid), headers=actor(999)).status_code == 400
    assert client.get(path(999), headers=actor()).status_code == 404
    assert client.get(path(bid, "bogus"), headers=actor()).status_code == 422


def test_duplicate_submission_is_atomic_even_with_concurrent_clients(client):
    bid = book(client)
    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(lambda _: submit(client, bid).status_code, range(2)))
    assert sorted(results) == [201, 409]
    assert submit(client, bid, correct=0).status_code == 409
    assert client.get(path(bid), headers=actor()).json()["result"]["percent"] == 100


def test_professor_suppresses_small_groups_and_missing_is_not_zero(client):
    t = topic(client)
    assert t["pre"] == {"n": 2, "suppressed": True, "mean_percent": None}
    assert t["post"]["mean_percent"] is None
    assert (
        t["paired"]["pre_mean_percent"] is None
        and t["paired"]["mean_change_percentage_points"] is None
    )
    empty = topic(client, 1)
    assert empty["pre"]["n"] == 0 and empty["pre"]["mean_percent"] is None
    assert empty["post"]["n"] == 0
    bid = book(client)
    assert topic(client)["distinct_booked_learners"] == 3
    assert topic(client)["pre"]["n"] == 2  # Laura's missing submission is not a zero.
    assert "difficulty" in topic(client)["recommendation"]["signals"][1]
    assert history(client)["items"][0]["change_percentage_points"] is None
    assert submit(client, bid).status_code == 201
    t = topic(client)
    assert t["pre"] == {"n": 3, "suppressed": False, "mean_percent": 33.3}
    assert t["post"]["suppressed"] and t["paired"]["suppressed"]


def test_professor_updates_persisted_matched_results_and_explainable_advice(client):
    bid = book(client)
    assert submit(client, bid, correct=1).status_code == 201
    simulate(client, bid)
    assert submit(client, bid, "post", correct=0).status_code == 201
    t = topic(client)
    assert t["post"] == {"n": 3, "suppressed": False, "mean_percent": 33.3}
    assert t["paired"] == {
        "n": 3,
        "suppressed": False,
        "pre_mean_percent": 16.7,
        "post_mean_percent": 33.3,
        "mean_change_percentage_points": 16.7,
    }
    assert "practice materials" in t["recommendation"]["text"]
    assert t["recommendation"]["human_review_required"]
    assert "demand" in t["recommendation"]["signals"][0]
    assert "assessment evidence" in t["recommendation"]["signals"][1]
    raw = client.get("/api/insights", headers=actor(3)).text
    for private in (
        "Laura",
        "Noah",
        "Maya",
        "learner_id",
        "option_id",
        "booking_id",
        "selected_option",
        "explanation",
        "risk_label",
    ):
        assert private not in raw
    with TestClient(create_app(client.app.state.db_path)) as reopened:
        assert topic(reopened) == t


def test_cancellation_restores_seats_keeps_private_history_and_resuppresses_insights(
    client,
):
    bid = book(client)
    submit(client, bid)
    simulate(client, bid)
    submit(client, bid, "post")
    assert topic(client)["post"]["n"] == 3
    before = client.get("/api/sessions/1").json()["available_seats"]
    assert (
        client.post(f"/api/bookings/{bid}/cancel", headers=actor()).status_code == 200
    )
    assert client.get("/api/sessions/1").json()["available_seats"] == before + 1
    assert (
        topic(client)["post"]["n"] == 2
        and topic(client)["post"]["mean_percent"] is None
    )
    assert client.get(path(bid), headers=actor()).json()["result"]["percent"] == 100
    assert history(client)["items"][0]["booking_status"] == "cancelled"
    new_bid = book(client)
    assert new_bid != bid
    assert client.get(path(new_bid), headers=actor()).json()["status"] == "pending"
    assert topic(client)["distinct_booked_learners"] == 3
    assert topic(client)["post"]["n"] == 2


def test_cancelled_pending_checks_and_unsupported_older_sessions_are_clear(client):
    bid = book(client)
    client.post(f"/api/bookings/{bid}/cancel", headers=actor())
    assert client.get(path(bid), headers=actor()).json()["status"] == "locked"
    assert submit(client, bid).status_code == 409
    assert simulate(client, bid).status_code == 409
    old = next(
        b
        for b in client.get("/api/bookings", headers=actor()).json()
        if b["session"]["id"] == 7
    )
    assert not old["session"]["learning_check_available"]
    assert client.get(path(old["id"]), headers=actor()).status_code == 404
    assert len(history(client)["items"]) == 1


def test_natural_session_end_unlocks_post_without_simulation(client):
    bid = book(client)
    submit(client, bid)
    with connect(client.app.state.db_path) as db:
        db.execute(
            "UPDATE sessions SET starts_at=? WHERE id=1",
            ((datetime.now(timezone.utc) - timedelta(hours=2)).isoformat(),),
        )
    assert client.get(path(bid, "post"), headers=actor()).json()["status"] == "pending"
    assert submit(client, bid, "post").status_code == 201
    assert not history(client)["items"][0]["simulated"]


def test_upgrade_real_mvp_schema_is_additive_repeatable_and_preserves_bookings(
    tmp_path,
):
    path_db = str(tmp_path / "legacy.sqlite3")
    with connect(path_db) as db:
        db.executescript(
            (Path(__file__).parent / "fixtures/mvp_schema.sql").read_text()
        )
        seed(db)
        db.execute(
            "INSERT INTO bookings VALUES (77,2,1,'cancelled','2026-11-01T00:00:00+00:00')"
        )
        originals = {
            table: [tuple(r) for r in db.execute(f"SELECT * FROM {table} ORDER BY 1")]
            for table in (
                "users",
                "sessions",
                "bookings",
                "subjects",
                "tutor_approvals",
            )
        }
    initialize(path_db)
    initialize(path_db)
    with connect(path_db) as db:
        for table, rows in originals.items():
            assert [
                tuple(r) for r in db.execute(f"SELECT * FROM {table} ORDER BY 1")
            ] == rows
        assert db.execute("SELECT COUNT(*) FROM learning_migrations").fetchone()[0] == 1
        assert (
            db.execute("SELECT COUNT(*) FROM assessment_submissions").fetchone()[0] == 4
        )
        assert (
            db.execute("SELECT COUNT(*) FROM assessment_questions").fetchone()[0] == 24
        )


@pytest.mark.parametrize("sid", range(1, 7))
def test_all_curated_topics_have_working_distinct_checks(client, sid):
    bid = book(client, sid)
    pre = client.get(path(bid), headers=actor()).json()
    assert submit(client, bid).json()["result"]["percent"] == 100
    assert simulate(client, bid).status_code == 200
    post = client.get(path(bid, "post"), headers=actor()).json()
    assert {q["prompt"] for q in pre["questions"]}.isdisjoint(
        q["prompt"] for q in post["questions"]
    )
    assert submit(client, bid, "post").json()["result"]["percent"] == 100
