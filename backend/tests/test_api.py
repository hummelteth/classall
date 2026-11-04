from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from app.main import create_app
from app.db import connect


@pytest.fixture
def client(tmp_path):
    app = create_app(str(tmp_path / "test.sqlite3"))
    with TestClient(app) as client:
        yield client


def actor(user_id=1):
    return {"X-Demo-User-Id": str(user_id)}


def book(client, session_id=1, user_id=1):
    return client.post(
        "/api/bookings", headers=actor(user_id), json={"session_id": session_id}
    )


def test_health_seed_and_subjects(client):
    assert client.get("/api/health").json() == {
        "status": "ok",
        "mode": "synthetic-demo",
    }
    assert len(client.get("/api/demo-users").json()) == 3
    assert len(client.get("/api/subjects").json()) == 5
    sessions = client.get("/api/sessions").json()
    assert len(sessions) == 6
    assert all(s["approved"] and s["available_seats"] >= 0 for s in sessions)
    assert sessions[0]["available_seats"] == 4
    assert client.get("/api/sessions/9999").status_code == 404


def test_catalog_filter_and_input_validation(client):
    assert len(client.get("/api/sessions?subject_id=2").json()) == 2
    assert len(client.get("/api/sessions?delivery=Online").json()) == 2
    assert len(client.get("/api/sessions?q=chain").json()) == 1
    assert len(client.get("/api/sessions?q=Amira").json()) == 2
    assert client.get("/api/sessions?subject_id=9999").json() == []
    assert client.get("/api/sessions?q=%27%20OR%201%3D1--").json() == []
    assert client.get("/api/sessions?delivery=invalid").status_code == 422
    assert client.get("/api/sessions?subject_id=-1").status_code == 422
    assert (
        client.post(
            "/api/bookings", headers=actor(), json={"session_id": 0}
        ).status_code
        == 422
    )
    assert (
        client.post(
            "/api/bookings", headers=actor(), json={"session_id": 1.5}
        ).status_code
        == 422
    )


def test_booking_lifecycle_and_seat_restoration(client):
    before = client.get("/api/sessions/1").json()["available_seats"]
    result = book(client)
    assert result.status_code == 201, result.text
    booking = result.json()
    assert booking["status"] == "confirmed"
    assert booking["session"]["available_seats"] == before - 1
    assert client.get("/api/sessions/1").json()["available_seats"] == before - 1
    assert book(client).status_code == 409
    listed = client.get("/api/bookings", headers=actor()).json()
    assert any(b["id"] == booking["id"] for b in listed)
    cancelled = client.post(f"/api/bookings/{booking['id']}/cancel", headers=actor())
    assert cancelled.status_code == 200
    assert cancelled.json()["status"] == "cancelled"
    assert client.get("/api/sessions/1").json()["available_seats"] == before
    assert (
        client.post(
            f"/api/bookings/{booking['id']}/cancel", headers=actor()
        ).status_code
        == 200
    )
    assert book(client).status_code == 201


def test_bookings_persist_after_app_restart(client):
    created = book(client).json()
    with TestClient(create_app(client.app.state.db_path)) as reopened:
        bookings = reopened.get("/api/bookings", headers=actor()).json()
        assert any(
            b["id"] == created["id"] and b["status"] == "confirmed" for b in bookings
        )
        assert len(reopened.get("/api/sessions").json()) == 6  # seed is idempotent


def test_demo_role_guards_and_ownership(client):
    assert client.get("/api/bookings").status_code == 422
    assert client.get("/api/bookings", headers=actor(999)).status_code == 400
    assert book(client, user_id=3).status_code == 403
    assert book(client, user_id=2).status_code == 409  # host cannot book own seat
    created = book(client).json()
    assert (
        client.post(
            f"/api/bookings/{created['id']}/cancel", headers=actor(2)
        ).status_code
        == 404
    )
    assert book(client, session_id=2, user_id=2).status_code == 201  # tutors may learn
    assert client.get("/api/tutor/overview", headers=actor()).json()["approved_subjects"] == []  # Students may apply and teach without changing their learner role.
    assert client.get("/api/insights", headers=actor()).status_code == 403
    assert (
        client.get("/api/tutor/overview", headers=actor(2)).json()["engagement_points"]
        == 40
    )


def test_closed_past_full_unapproved_and_missing_sessions(client):
    assert book(client, session_id=7).status_code == 409
    assert book(client, session_id=999).status_code == 404
    with connect(client.app.state.db_path) as db:
        db.execute(
            "UPDATE sessions SET capacity=booked.cnt FROM (SELECT COUNT(*) AS cnt FROM bookings WHERE session_id=1) AS booked WHERE id=1"
        )
    assert book(client).status_code == 409
    with connect(client.app.state.db_path) as db:
        db.execute("DELETE FROM tutor_approvals WHERE tutor_id=4 AND subject_id=2")
    assert book(client, session_id=2).status_code == 409
    with connect(client.app.state.db_path) as db:
        db.execute(
            "UPDATE sessions SET starts_at=? WHERE id=3",
            ((datetime.now(timezone.utc) - timedelta(hours=1)).isoformat(),),
        )
    assert book(client, session_id=3).status_code == 409
    assert all(s["id"] != 3 for s in client.get("/api/sessions").json())
    past_booking = next(
        b
        for b in client.get("/api/bookings", headers=actor()).json()
        if b["session"]["id"] == 7
    )
    assert (
        client.post(
            f"/api/bookings/{past_booking['id']}/cancel", headers=actor()
        ).status_code
        == 409
    )


def test_schedule_conflict_and_adjacent_sessions(client):
    assert book(client).status_code == 201
    start = client.get("/api/sessions/1").json()["starts_at"]
    with connect(client.app.state.db_path) as db:
        db.execute("UPDATE sessions SET starts_at=? WHERE id=2", (start,))
    assert book(client, session_id=2).status_code == 409
    with connect(client.app.state.db_path) as db:
        db.execute(
            "UPDATE sessions SET starts_at=? WHERE id=2",
            ((datetime.fromisoformat(start) + timedelta(hours=1)).isoformat(),),
        )
    assert book(client, session_id=2).status_code == 201


def test_tutor_cannot_book_during_own_teaching(client):
    start = client.get("/api/sessions/1").json()["starts_at"]
    with connect(client.app.state.db_path) as db:
        db.execute("UPDATE sessions SET starts_at=? WHERE id=2", (start,))
    assert book(client, session_id=2, user_id=2).status_code == 409


def test_concurrent_last_seat_cannot_overbook(client):
    with connect(client.app.state.db_path) as db:
        db.execute(
            "UPDATE sessions SET capacity=3 WHERE id=1"
        )  # two existing, one free
    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(
            pool.map(lambda uid: book(client, user_id=uid).status_code, [1, 4])
        )
    assert sorted(results) == [201, 409]
    assert client.get("/api/sessions/1").json()["available_seats"] == 0


def test_aggregate_insights_follow_booking_and_hide_people(client):
    before = client.get("/api/insights", headers=actor(3)).json()
    assert before["courses"][0]["bookings"] == 2
    assert book(client).status_code == 201
    after = client.get("/api/insights", headers=actor(3)).json()
    assert after["courses"][0]["bookings"] == 3
    assert all(
        "learner" not in course and "users" not in course for course in after["courses"]
    )
    assert [c["subject"]["id"] for c in after["courses"]] == [1, 5]
