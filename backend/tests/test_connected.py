from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
import pytest
from fastapi.testclient import TestClient
from app.main import create_app
from app.db import connect, initialize


@pytest.fixture
def client(tmp_path):
    with TestClient(create_app(str(tmp_path / "connected.sqlite3"))) as c:
        yield c


def actor(uid=1):
    return {"X-Demo-User-Id": str(uid)}


def post(c, path, body=None, uid=1):
    return c.post(
        "/api" + path,
        headers=actor(uid),
        **({"json": body} if body is not None else {}),
    )


def event(**changes):
    return {
        "topic_id": 1,
        "title": "Chain rule practice together",
        "description": "Bring a question and work through new examples together.",
        "starts_at": (datetime.now(timezone.utc) + timedelta(days=12))
        .replace(hour=9, minute=0, second=0, microsecond=0)
        .isoformat(),
        "duration_minutes": 60,
        "capacity": 4,
        "format": "In person",
        "location": "Library room 4",
        **changes,
    }


def session(**changes):
    return {**event(), "goals": ["Apply the chain rule step by step"], **changes}


def signal(c):
    return c.get("/api/professor/signals", headers=actor(3)).json()[0]


def action(c, **changes):
    r = post(
        c,
        "/support-actions",
        {
            "topic_id": 1,
            "action_type": "ta_session",
            "rationale": "Three synthetic requests warrant human review.",
            "human_confirmed": True,
            **changes,
        },
        3,
    )
    assert r.status_code == 201, r.text
    return r.json()


def test_pulse_latest_update_withdraw_and_privacy(client):
    assert signal(client)["participants"] == 3
    assert signal(client)["distribution"] == {
        "confident": 0,
        "practice": 1,
        "support": 2,
    }
    for response in ("support", "practice", "confident"):
        assert (
            client.put(
                "/api/pulses/1", headers=actor(), json={"response": response}
            ).status_code
            == 200
        )
        assert signal(client)["participants"] == 4
    assert signal(client)["distribution"] == {
        "confident": 1,
        "practice": 1,
        "support": 2,
    }
    assert len(client.get("/api/pulses", headers=actor()).json()) == 1
    assert client.delete("/api/pulses/1", headers=actor()).status_code == 200
    assert signal(client)["participants"] == 3
    with connect(client.app.state.db_path) as db:
        assert not db.execute(
            "SELECT 1 FROM learning_pulses WHERE learner_id=1"
        ).fetchone()
    assert client.get("/api/pulses", headers=actor(3)).status_code == 403
    for word in ("learner_id", "Laura", "Maya", "Noah", "updated_at"):
        assert word not in client.get("/api/professor/signals", headers=actor(3)).text


def test_pulse_suppression_validation_and_assignments(client):
    for uid in (7, 8):
        client.delete("/api/pulses/1", headers=actor(uid))
    s = signal(client)
    assert s["participants"] == 1 and s["suppressed"] and s["distribution"] is None
    assert (
        client.put(
            "/api/pulses/1", headers=actor(), json={"response": "weak"}
        ).status_code
        == 422
    )
    assert (
        client.put(
            "/api/pulses/999", headers=actor(), json={"response": "support"}
        ).status_code
        == 404
    )
    assert client.get("/api/professor/signals", headers=actor()).status_code == 403
    assert len(client.get("/api/professor/signals", headers=actor(3)).json()) == 2


def test_support_requests_booking_matching_cancellation_and_ownership(client):
    r = post(client, "/support-requests", {"topic_id": 1})
    assert r.status_code == 201
    rid = r.json()["id"]
    assert post(client, "/support-requests", {"topic_id": 1}).status_code == 409
    assert post(client, f"/support-requests/{rid}/withdraw", uid=2).status_code == 404
    bid = post(client, "/bookings", {"session_id": 1}).json()["id"]
    assert (
        client.get("/api/support-requests", headers=actor()).json()[0]["status"]
        == "matched"
    )
    post(client, f"/bookings/{bid}/cancel")
    assert (
        client.get("/api/support-requests", headers=actor()).json()[0]["status"]
        == "open"
    )
    assert (
        post(client, f"/support-requests/{rid}/withdraw").json()["status"]
        == "withdrawn"
    )
    assert post(client, "/support-requests", {"topic_id": 1}).status_code == 201
    assert post(client, "/support-requests", {"topic_id": 1}, 3).status_code == 403


def test_request_suppression_and_contextual_suggestions(client):
    assert signal(client)["open_requests"] == 3
    r = client.get("/api/support-requests", headers=actor(7)).json()[0]
    post(client, f"/support-requests/{r['id']}/withdraw", uid=7)
    assert (
        signal(client)["open_requests"] is None
        and signal(client)["requests_suppressed"]
    )
    data = client.get("/api/topics/1/support", headers=actor()).json()
    assert data["sessions"] and data["groups"] and len(data["practice"]) == 2
    assert all(s["topics"][0]["id"] == 1 for s in data["sessions"])
    assert client.get("/api/topics/1/support", headers=actor(3)).status_code == 403


def test_groups_lifecycle_permissions_and_counts(client):
    r = post(client, "/groups", event())
    assert r.status_code == 201, r.text
    g = r.json()
    gid = g["id"]
    assert g["member_count"] == 1 and g["available_places"] == 3 and g["joined"]
    assert post(client, f"/groups/{gid}/join").status_code == 409
    assert post(client, f"/groups/{gid}/leave").status_code == 409
    assert post(client, f"/groups/{gid}/join", uid=2).json()["member_count"] == 2
    assert (
        client.put(f"/api/groups/{gid}", headers=actor(2), json=event()).status_code
        == 403
    )
    assert post(client, f"/groups/{gid}/cancel", uid=2).status_code == 403
    assert (
        client.put(
            f"/api/groups/{gid}",
            headers=actor(),
            json=event(
                starts_at=(datetime.now(timezone.utc) + timedelta(days=13)).isoformat()
            ),
        ).status_code
        == 409
    )
    r = client.put(
        f"/api/groups/{gid}",
        headers=actor(),
        json=event(title="A better practice circle", capacity=5),
    )
    assert r.status_code == 200 and r.json()["available_places"] == 3
    assert post(client, f"/groups/{gid}/leave", uid=2).json()["member_count"] == 1
    g = post(client, f"/groups/{gid}/cancel").json()
    assert g["status"] == "cancelled" and g["available_places"] == 0
    assert post(client, f"/groups/{gid}/join", uid=2).status_code == 409
    assert (
        client.put(f"/api/groups/{gid}", headers=actor(), json=event()).status_code
        == 409
    )
    assert any(
        g["id"] == gid
        for g in client.get("/api/groups?mine=true", headers=actor()).json()
    )
    assert all(
        g["id"] != gid for g in client.get("/api/groups", headers=actor()).json()
    )


def test_group_concurrent_last_place_and_request_reopening(client):
    gid = post(client, "/groups", event(capacity=2), 2).json()["id"]
    post(client, "/support-requests", {"topic_id": 1})
    with ThreadPoolExecutor(max_workers=2) as pool:
        codes = list(
            pool.map(
                lambda uid: post(client, f"/groups/{gid}/join", uid=uid).status_code,
                (1, 4),
            )
        )
    assert sorted(codes) == [200, 409]
    assert (
        next(
            g
            for g in client.get("/api/groups?mine=true", headers=actor(2)).json()
            if g["id"] == gid
        )["member_count"]
        == 2
    )
    assert post(client, f"/groups/{gid}/cancel", uid=2).status_code == 200
    assert (
        client.get("/api/support-requests", headers=actor()).json()[0]["status"]
        == "open"
    )


@pytest.mark.parametrize(
    "changes",
    [
        {"starts_at": "2020-01-01T10:00:00+00:00"},
        {"starts_at": "2099-01-01T10:00:00"},
        {"capacity": 0},
        {"capacity": 51},
        {"capacity": True},
        {"duration_minutes": 0},
        {"format": "Video magic"},
        {"location": ""},
        {"title": "    "},
        {"topic_id": 999},
        {"description": "x"},
    ],
)
def test_event_validation(client, changes):
    assert post(client, "/groups", event(**changes)).status_code in (422, 404)


def test_group_filters_and_professor_restrictions(client):
    data = client.get(
        "/api/groups?subject_id=1&topic_id=1&available=true", headers=actor()
    ).json()
    assert data and all(g["topic_id"] == 1 and g["available_places"] > 0 for g in data)
    assert client.get(
        "/api/groups?date=" + data[0]["starts_at"][:10], headers=actor()
    ).json()
    assert client.get("/api/groups?date=invalid", headers=actor()).status_code == 422
    assert client.get("/api/groups?date=2099-01-01", headers=actor()).json() == []
    assert client.get("/api/groups", headers=actor(3)).status_code == 403
    assert post(client, "/groups", event(), 3).status_code == 403


def test_tutor_publishing_catalog_checks_bookings_and_safe_management(client):
    r = post(client, "/sessions", session(), 2)
    assert r.status_code == 201, r.text
    s = r.json()
    sid = s["id"]
    assert s["kind"] == "peer" and s["learning_check_available"]
    assert any(x["id"] == sid for x in client.get("/api/sessions").json())
    assert post(client, "/sessions", session(topic_id=2), 2).status_code == 403
    assert post(client, "/sessions", session(), 1).status_code == 403
    assert post(client, "/sessions", session(), 3).status_code == 403
    assert post(client, "/sessions", session(), 2).status_code == 409
    bid = post(client, "/bookings", {"session_id": sid}).json()["id"]
    assert (
        len(
            client.get(
                f"/api/bookings/{bid}/learning-checks/pre", headers=actor()
            ).json()["questions"]
        )
        == 2
    )
    assert client.get("/api/learning/history", headers=actor()).status_code == 200
    assert client.get("/api/insights", headers=actor(3)).status_code == 200
    assert (
        client.put(f"/api/sessions/{sid}", headers=actor(), json=session()).status_code
        == 403
    )
    assert (
        client.put(
            f"/api/sessions/{sid}", headers=actor(2), json=session(capacity=3)
        ).status_code
        == 409
    )
    assert (
        client.put(
            f"/api/sessions/{sid}",
            headers=actor(2),
            json=session(
                starts_at=(datetime.now(timezone.utc) + timedelta(days=13)).isoformat()
            ),
        ).status_code
        == 409
    )
    assert (
        client.put(
            f"/api/sessions/{sid}",
            headers=actor(2),
            json=session(title="Clearer chain rule practice", capacity=5),
        ).status_code
        == 200
    )
    assert (
        client.get(f"/api/sessions/{sid}/attendees", headers=actor(2)).json()[0]["name"]
        == "Laura Martín"
    )
    assert (
        client.get(f"/api/sessions/{sid}/attendees", headers=actor(3)).status_code
        == 403
    )
    assert (
        post(client, f"/sessions/{sid}/cancel", uid=2).json()["status"] == "cancelled"
    )
    assert (
        next(
            b
            for b in client.get("/api/bookings", headers=actor()).json()
            if b["id"] == bid
        )["status"]
        == "cancelled"
    )
    assert post(client, "/bookings", {"session_id": sid}).status_code == 409


def test_host_overlap_and_topic_change_without_booking_history(client):
    seed = client.get("/api/sessions/1").json()
    assert (
        post(client, "/sessions", session(starts_at=seed["starts_at"]), 2).status_code
        == 409
    )
    s = post(client, "/sessions", session(), 2).json()
    assert (
        client.put(
            f"/api/sessions/{s['id']}", headers=actor(2), json=session(topic_id=5)
        ).status_code
        == 200
    )
    assert client.get(f"/api/sessions/{s['id']}").json()["topics"][0]["id"] == 5
    assert post(client, "/bookings", {"session_id": s["id"]}).status_code == 201
    assert client.get("/api/learning/history", headers=actor()).status_code == 200


def test_professor_actions_confirmation_assignments_transitions_and_restart(client):
    body = {
        "topic_id": 1,
        "action_type": "review",
        "rationale": "Review these voluntary synthetic signals.",
        "human_confirmed": True,
    }
    assert post(client, "/support-actions", body, 1).status_code == 403
    assert (
        post(client, "/support-actions", {**body, "topic_id": 2}, 3).status_code == 403
    )
    assert (
        post(
            client, "/support-actions", {**body, "human_confirmed": False}, 3
        ).status_code
        == 422
    )
    a = action(client)
    assert a["status"] == "planned" and a["evidence"]["human_review_required"]
    assert "learning_checks" in a["evidence"] and a["evidence"]["captured_at"]
    assert client.patch(
        f"/api/support-actions/{a['id']}", headers=actor(), json={"status": "active"}
    ).status_code in (403, 404)
    r = client.patch(
        f"/api/support-actions/{a['id']}",
        headers=actor(3),
        json={
            "status": "completed",
            "notes": "Follow-up reviewed.",
            "follow_up_date": "2099-11-04",
        },
    )
    assert r.status_code == 200
    assert (
        client.patch(
            f"/api/support-actions/{a['id']}",
            headers=actor(3),
            json={"status": "active"},
        ).status_code
        == 409
    )
    with TestClient(create_app(client.app.state.db_path)) as reopened:
        assert (
            reopened.get("/api/support-actions", headers=actor(3)).json()[0] == r.json()
        )


def test_faculty_session_host_authority_catalog_booking_and_schedules(client):
    aid = action(client)["id"]
    assert {"id": 2, "name": "David Chen"} in client.get(
        "/api/professor/hosts?topic_id=1", headers=actor(3)
    ).json()
    assert (
        client.get("/api/professor/hosts?topic_id=2", headers=actor(3)).status_code
        == 403
    )
    assert (
        post(
            client, f"/support-actions/{aid}/session", {**session(), "host_id": 4}, 3
        ).status_code
        == 403
    )
    assert post(
        client, f"/support-actions/{aid}/session", {**session(), "host_id": 2}, 2
    ).status_code in (403, 404)
    r = post(client, f"/support-actions/{aid}/session", {**session(), "host_id": 2}, 3)
    assert r.status_code == 201, r.text
    s = r.json()
    sid = s["id"]
    assert s["kind"] == "faculty" and s["organizer_id"] == 3 and s["tutor"]["id"] == 2
    assert any(x["id"] == sid for x in client.get("/api/sessions").json())
    assert any(
        x["id"] == sid
        for x in client.get("/api/tutor/overview", headers=actor(2)).json()["sessions"]
    )
    assert (
        client.get("/api/support-actions", headers=actor(3)).json()[0]["session_id"]
        == sid
    )
    assert post(client, "/bookings", {"session_id": sid}).status_code == 201
    assert post(client, f"/sessions/{sid}/cancel", uid=2).status_code == 403
    assert (
        client.patch(
            f"/api/support-actions/{aid}",
            headers=actor(3),
            json={"status": "cancelled"},
        ).status_code
        == 409
    )
    assert (
        post(
            client, f"/support-actions/{aid}/session", {**session(), "host_id": 2}, 3
        ).status_code
        == 409
    )
    assert post(client, f"/sessions/{sid}/cancel", uid=3).status_code == 200
    assert (
        client.get("/api/support-actions", headers=actor(3)).json()[0]["status"]
        == "cancelled"
    )


def test_repeatable_migration_preserves_legacy_and_new_records(client):
    post(client, "/groups", event())
    client.put("/api/pulses/5", headers=actor(), json={"response": "practice"})
    with connect(client.app.state.db_path) as db:
        tables = [
            "users",
            "sessions",
            "bookings",
            "assessment_submissions",
            "learner_responses",
            "study_groups",
            "group_memberships",
            "learning_pulses",
            "support_requests",
        ]
        before = {
            t: [tuple(r) for r in db.execute(f"SELECT * FROM {t} ORDER BY 1")]
            for t in tables
        }
    initialize(client.app.state.db_path)
    initialize(client.app.state.db_path)
    with connect(client.app.state.db_path) as db:
        assert db.execute("PRAGMA foreign_key_check").fetchall() == []
        for t, rows in before.items():
            assert [
                tuple(r) for r in db.execute(f"SELECT * FROM {t} ORDER BY 1")
            ] == rows


def test_new_activities_do_not_award_tutor_points(client):
    before = client.get("/api/tutor/overview", headers=actor(2)).json()[
        "engagement_points"
    ]
    post(client, "/sessions", session(), 2)
    post(client, "/groups", event(), 2)
    client.put("/api/pulses/1", headers=actor(2), json={"response": "support"})
    assert (
        client.get("/api/tutor/overview", headers=actor(2)).json()["engagement_points"]
        == before
        == 40
    )


def test_refresh_examples_is_additive_and_idempotent_without_moving_old_dates(client):
    from app.demo import add_examples

    with connect(client.app.state.db_path) as db:
        db.execute(
            "UPDATE sessions SET starts_at='2020-01-01T10:00:00+00:00' WHERE status='upcoming'"
        )
        db.execute("UPDATE study_groups SET starts_at='2020-01-01T10:00:00+00:00'")
        old_sessions = [
            tuple(r) for r in db.execute("SELECT * FROM sessions ORDER BY id")
        ]
        old_bookings = [
            tuple(r) for r in db.execute("SELECT * FROM bookings ORDER BY id")
        ]
    assert add_examples(client.app.state.db_path) == 6
    assert add_examples(client.app.state.db_path) == 0
    with connect(client.app.state.db_path) as db:
        assert [
            tuple(r)
            for r in db.execute("SELECT * FROM sessions WHERE id<=8 ORDER BY id")
        ] == old_sessions
        assert [
            tuple(r) for r in db.execute("SELECT * FROM bookings ORDER BY id")
        ] == old_bookings
    assert len(client.get("/api/sessions").json()) == 2
    assert len(client.get("/api/groups", headers=actor()).json()) == 4


def test_online_text_edits_preserve_legacy_location_and_booked_plans(client):
    original = client.get("/api/sessions/2").json()
    # Amira is the seeded approved synthetic CS tutor.
    body = session(
        topic_id=2,
        title=original["title"],
        description=original["description"],
        starts_at=original["starts_at"],
        duration_minutes=original["duration_minutes"],
        capacity=original["capacity"],
        format="Online",
        location="",
    )
    response = client.put("/api/sessions/2", headers=actor(4), json=body)
    assert response.status_code == 200, response.text
    assert response.json()["location"] == original["location"]


def test_faculty_topic_is_fixed_even_before_any_booking(client):
    aid = action(client)["id"]
    sid = post(
        client, f"/support-actions/{aid}/session", {**session(), "host_id": 2}, 3
    ).json()["id"]
    assert (
        client.put(
            f"/api/sessions/{sid}", headers=actor(3), json=session(topic_id=5)
        ).status_code
        == 409
    )


def test_action_partial_update_preserves_notes_and_follow_up(client):
    a = action(
        client,
        notes="Keep the reviewed practice instructions.",
        follow_up_date="2099-11-04",
    )
    r = client.patch(
        f"/api/support-actions/{a['id']}", headers=actor(3), json={"status": "active"}
    )
    assert r.status_code == 200
    assert (
        r.json()["notes"] == a["notes"]
        and r.json()["follow_up_date"] == a["follow_up_date"]
    )
    assert (
        client.patch(
            f"/api/support-actions/{a['id']}",
            headers=actor(3),
            json={"status": "invented"},
        ).status_code
        == 422
    )


def test_group_topic_edit_reconciles_creator_request(client):
    post(client, "/support-requests", {"topic_id": 1})
    g = post(client, "/groups", event()).json()
    assert (
        client.get("/api/support-requests", headers=actor()).json()[0]["status"]
        == "matched"
    )
    assert (
        client.put(
            f"/api/groups/{g['id']}", headers=actor(), json=event(topic_id=5)
        ).status_code
        == 200
    )
    assert (
        client.get("/api/support-requests", headers=actor()).json()[0]["status"]
        == "open"
    )


def test_other_professor_cannot_read_or_change_actions_and_catalog_topic_filter(client):
    a = action(client)
    with connect(client.app.state.db_path) as db:
        db.execute(
            "INSERT INTO users VALUES (9,'Synthetic faculty colleague','professor','CS','SF','sage','Faculty')"
        )
        db.execute("INSERT INTO professor_subjects VALUES (9,2)")
    assert client.get("/api/support-actions", headers=actor(9)).json() == []
    assert (
        client.patch(
            f"/api/support-actions/{a['id']}",
            headers=actor(9),
            json={"status": "active"},
        ).status_code
        == 404
    )
    assert (
        post(
            client,
            f"/support-actions/{a['id']}/session",
            {**session(), "host_id": 2},
            9,
        ).status_code
        == 403
    )
    assert all(
        s["subject"]["id"] == 2 for s in client.get("/api/sessions?topic_id=2").json()
    )
    assert client.get("/api/sessions?topic_id=999").json() == []
