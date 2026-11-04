"""V5 journeys against real SQLite; no local model required."""

import json
from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, datetime, timedelta
from unittest.mock import Mock

import pytest
from app.core_schemas import AdvisoryFeedback
from app.db import DEFAULT_DB, connect, initialize
from app.main import create_app
from app.presentation import create_presentation
from fastapi.testclient import TestClient


def h(uid):
    return {"X-Demo-User-Id": str(uid)}


def post(c, path, body=None, uid=1):
    return c.post(
        "/api" + path, headers=h(uid), **({"json": body} if body is not None else {})
    )


def get(c, path, uid=1):
    return c.get("/api" + path, headers=h(uid))


def application(**overrides):
    return {
        "topic_id": 1,
        "language": "en",
        "motivation": "I enjoy helping other students.",
        "experience": "I have studied calculus for two years.",
        "proposed_topic": "Chain rule",
        "objectives": "Identify inner functions and apply derivatives.",
        "teaching_plan": "Start with a visual example, practise, then reflect.",
        "approach": "Use a diagram, a worked example and paired practice.",
        "explanation": "A change in x changes the inner function first. Multiply the two rates to find the total rate. Try (2x+1)^3 together.",
        "answers": [0, 1],
        **overrides,
    }


def session(**overrides):
    return {
        "topic_id": 1,
        "title": "V5 chain rule together",
        "description": "A friendly synthetic practice session.",
        "goals": ["Apply the chain rule"],
        "starts_at": (datetime.now(UTC) + timedelta(days=15)).isoformat(),
        "duration_minutes": 60,
        "capacity": 6,
        "format": "In person",
        "location": "Fictional library",
        **overrides,
    }


def decision(status="approved"):
    return {
        "status": status,
        "comments": "I reviewed the references and teaching plan.",
        "human_confirmed": True,
    }


@pytest.fixture
def client(tmp_path):
    path = create_presentation(tmp_path / "classall-v5-presentation.sqlite3")
    with TestClient(create_app(str(path))) as c:
        yield c


def approve(c, uid=2):
    a = post(c, "/tutor-applications", application(), uid)
    assert a.status_code == 201, a.text
    aid = a.json()["id"]
    r = post(c, f"/tutor-applications/{aid}/review", decision(), 3)
    assert r.status_code == 200, r.text
    return aid


def booked(c):
    approve(c)
    r = post(c, "/sessions", session(), 2)
    assert r.status_code == 201, r.text
    sid = r.json()["id"]
    b = post(c, "/bookings", {"session_id": sid})
    assert b.status_code == 201, b.text
    return sid, b.json()["id"]


def propose(c, sid, bid):
    return post(
        c,
        f"/sessions/{sid}/synthetic-attendance",
        {"booking_ids": [bid], "synthetic_confirmed": True},
        2,
    )


def test_complete_connected_story_and_restart(client):
    c = client
    assert post(c, "/support-requests", {"topic_id": 1}).status_code == 201
    assert post(c, "/sessions", session(), 2).status_code == 403
    q = get(c, "/qualifications/1?language=es", 2).json()
    assert "función" in q["questions"][0]["prompt"]
    assert "correct" not in json.dumps(q)
    a = post(c, "/tutor-applications", application(), 2).json()
    aid = a["id"]
    assert get(c, "/tutor-applications", 2).json()[0]["answers"] == [0, 1]
    assert (
        post(c, f"/tutor-applications/{aid}/advisory", uid=2).json()["advisory"]["mode"]
        == "prepared-review-checklist"
    )
    assert (
        post(c, f"/tutor-applications/{aid}/review", decision(), 2).status_code == 403
    )
    assert (
        post(c, f"/tutor-applications/{aid}/review", decision(), 3).status_code == 200
    )
    assert post(c, "/sessions", session(topic_id=3), 2).status_code == 403
    s = post(c, "/sessions", session(), 2).json()
    sid = s["id"]
    b = post(c, "/bookings", {"session_id": sid}).json()
    bid = b["id"]
    assert (
        next(r for r in get(c, "/support-requests").json() if r["topic_id"] == 1)[
            "status"
        ]
        == "matched"
    )
    check = get(c, f"/bookings/{bid}/learning-checks/pre").json()
    # Any answers suffice; scores must never affect recognition.
    answers = {str(q["id"]): q["options"][0]["id"] for q in check["questions"]}
    assert (
        post(
            c, f"/bookings/{bid}/learning-checks/pre", {"answers": answers}
        ).status_code
        == 201
    )
    assert post(c, f"/bookings/{bid}/simulate-completion").status_code == 200
    assert get(c, "/portfolio", 2).json()["points"] == 40
    assert propose(c, sid, bid).status_code == 200
    assert get(c, "/portfolio", 2).json()["points"] == 40
    for _ in range(2):
        assert (
            post(
                c,
                f"/bookings/{bid}/confirm-synthetic-attendance",
                {"synthetic_confirmed": True},
            ).status_code
            == 200
        )
        repeated = propose(c, sid, bid)
        assert repeated.status_code == 200
        assert repeated.json()["awaiting_learners"] is False
    p = get(c, "/portfolio", 2).json()
    assert p["points"] == 60 and p["confirmed_sessions"] == 3
    assert p["learners_supported"] == 1 and p["teaching_minutes"] == 180
    assert get(c, f"/bookings/{bid}/learning-checks/post").json()["reason"] is None
    feedback = {
        "clarity": 3,
        "preparation": 2,
        "atmosphere": 3,
        "comment": "Private reflection only.",
    }
    assert post(c, f"/bookings/{bid}/feedback", feedback).status_code == 201
    assert post(c, f"/bookings/{bid}/feedback", feedback).status_code == 409
    assert post(c, f"/bookings/{bid}/feedback", feedback, 2).status_code == 403
    assert "Private reflection" not in get(c, "/portfolio", 2).text
    assert get(c, "/portfolio", 2).json()["feedback_summary"] is None
    # Faculty acts on aggregate unmet demand using V4 infrastructure.
    assert get(c, "/professor/signals", 3).status_code == 200
    action = post(
        c,
        "/support-actions",
        {
            "topic_id": 1,
            "action_type": "ta_session",
            "rationale": "Offer further peer support for observed demand.",
            "human_confirmed": True,
        },
        3,
    )
    assert action.status_code == 201, action.text
    aid = action.json()["id"]
    ta = post(
        c,
        f"/support-actions/{aid}/session",
        {
            **session(starts_at=(datetime.now(UTC) + timedelta(days=20)).isoformat()),
            "host_id": 2,
        },
        3,
    )
    assert ta.status_code == 201, ta.text
    initialize(c.app.state.db_path)
    with TestClient(create_app(c.app.state.db_path)) as restarted:
        assert get(restarted, "/portfolio", 2).json()["points"] == 60
        assert (
            get(restarted, "/tutor-applications", 2).json()[0]["status"] == "approved"
        )
        assert (
            get(restarted, "/attendance/mine").json()[0]["feedback"]["comment"]
            == feedback["comment"]
        )
    with connect(c.app.state.db_path) as db:
        assert (
            db.execute(
                "SELECT COUNT(*) FROM session_attendance WHERE booking_id=?", (bid,)
            ).fetchone()[0]
            == 1
        )
        assert (
            db.execute(
                "SELECT COUNT(*) FROM contribution_ledger WHERE session_id=?", (sid,)
            ).fetchone()[0]
            == 1
        )


def test_assignment_revision_rejection_and_dual_student_role(client):
    c = client
    with connect(c.app.state.db_path) as db:
        db.execute(
            "INSERT INTO users VALUES (9,'Other Professor','professor','Physics','OP','sage','Faculty')"
        )
        db.execute("INSERT INTO professor_subjects VALUES (9,3)")
    a = post(c, "/tutor-applications", application()).json()
    aid = a["id"]
    assert get(c, "/tutor-applications", 9).json() == []
    assert (
        post(c, f"/tutor-applications/{aid}/review", decision(), 9).status_code == 403
    )
    assert post(c, f"/tutor-applications/{aid}/advisory", uid=2).status_code == 403
    assert (
        post(
            c, f"/tutor-applications/{aid}/review", decision("changes_requested"), 3
        ).status_code
        == 200
    )
    assert post(c, "/sessions", session()).status_code == 403
    assert (
        c.put(
            f"/api/tutor-applications/{aid}",
            headers=h(1),
            json=application(
                explanation="I would add an example and ask the learner to explain each step."
            ),
        ).status_code
        == 200
    )
    assert get(c, "/tutor-applications").json()[0]["status"] == "pending"
    assert (
        post(
            c, f"/tutor-applications/{aid}/review", decision("rejected"), 3
        ).status_code
        == 200
    )
    assert post(c, "/sessions", session()).status_code == 403
    # Reapply after rejection; approval grants permissions without changing persona.
    a2 = post(c, "/tutor-applications", application()).json()["id"]
    assert post(c, f"/tutor-applications/{a2}/review", decision(), 3).status_code == 200
    assert get(c, "/demo-users").json()[0]["role"] == "learner"
    sid = post(c, "/sessions", session()).json()["id"]
    assert get(c, f"/sessions/{sid}/attendees").status_code == 200
    assert post(c, "/sessions", session(topic_id=3)).status_code == 403
    assert post(c, "/bookings", {"session_id": 2}).status_code == 201
    history = get(c, "/tutor-applications").json()[1]["events"]
    assert len(history) == 4
    assert (
        history[0]["payload"]["qualification_snapshot"]["questions"][0]["correct"] == 0
    )
    assert history[0]["payload"]["explanation"] == application()["explanation"]
    assert history[2]["payload"]["explanation"] != ""


def test_attendance_checks_cancellation_and_idempotent_concurrency(client, monkeypatch):
    sid, bid = booked(client)
    assert propose(client, 1, bid).status_code == 403
    assert propose(client, sid, 9999).status_code == 409
    assert (
        post(
            client,
            f"/bookings/{bid}/confirm-synthetic-attendance",
            {"synthetic_confirmed": True},
        ).status_code
        == 404
    )
    assert (
        post(
            client,
            f"/sessions/{sid}/synthetic-attendance",
            {"booking_ids": [bid], "synthetic_confirmed": False},
            2,
        ).status_code
        == 422
    )
    assert propose(client, sid, bid).status_code == 200
    assert (
        post(
            client,
            f"/bookings/{bid}/confirm-synthetic-attendance",
            {"synthetic_confirmed": True},
            7,
        ).status_code
        == 404
    )
    monkeypatch.setenv("CLASSALL_CONTRIBUTION_POINTS", "25")
    with ThreadPoolExecutor(max_workers=4) as pool:
        replies = list(
            pool.map(
                lambda _: post(
                    client,
                    f"/bookings/{bid}/confirm-synthetic-attendance",
                    {"synthetic_confirmed": True},
                ),
                range(4),
            )
        )
    assert all(r.status_code == 200 for r in replies)
    assert get(client, "/portfolio", 2).json()["points"] == 65
    assert post(client, f"/sessions/{sid}/cancel", uid=2).status_code == 409
    assert post(client, f"/bookings/{bid}/cancel").status_code == 409
    # A cancellation before learner confirmation creates no new award.
    sid2 = post(
        client,
        "/sessions",
        session(starts_at=(datetime.now(UTC) + timedelta(days=25)).isoformat()),
        2,
    ).json()["id"]
    bid2 = post(client, "/bookings", {"session_id": sid2}).json()["id"]
    assert propose(client, sid2, bid2).status_code == 200
    assert post(client, f"/bookings/{bid2}/cancel").status_code == 200
    assert (
        post(
            client,
            f"/bookings/{bid2}/confirm-synthetic-attendance",
            {"synthetic_confirmed": True},
        ).status_code
        == 409
    )
    assert get(client, "/portfolio", 2).json()["points"] == 65


def test_aggregate_feedback_and_privacy(client):
    sid, bid = booked(client)
    bids = [bid]
    for uid in (7, 8):
        bids.append(post(client, "/bookings", {"session_id": sid}, uid).json()["id"])
    assert (
        post(
            client,
            f"/sessions/{sid}/synthetic-attendance",
            {"booking_ids": bids, "synthetic_confirmed": True},
            2,
        ).status_code
        == 200
    )
    for uid, b in zip((1, 7, 8), bids):
        post(
            client,
            f"/bookings/{b}/confirm-synthetic-attendance",
            {"synthetic_confirmed": True},
            uid,
        )
        assert (
            post(
                client,
                f"/bookings/{b}/feedback",
                {
                    "clarity": 3,
                    "preparation": 3,
                    "atmosphere": 2,
                    "comment": f"Private {uid}",
                },
                uid,
            ).status_code
            == 201
        )
    p = get(client, "/portfolio", 2)
    assert p.json()["feedback_summary"] == {
        "clarity": 3.0,
        "preparation": 3.0,
        "atmosphere": 2.0,
    }
    assert p.json()["suggested_strengths"] == ["clarity", "preparation"]
    assert "Private 1" not in p.text
    assert get(client, "/attendance/mine", 2).json() == []
    assert get(client, "/portfolio", 3).status_code == 403


def test_mocked_local_advisory_and_no_auto_approval(client):
    aid = post(client, "/tutor-applications", application(), 2).json()["id"]
    provider = Mock()
    provider.generate.return_value = AdvisoryFeedback(
        **{
            key: "Review this criterion with a professor."
            for key in ("accuracy", "clarity", "reasoning", "learner_fit", "cautions")
        }
    )
    client.app.state.ai_provider = provider
    r = post(client, f"/tutor-applications/{aid}/advisory?mode=live", uid=2)
    assert r.status_code == 200, r.text
    assert r.json()["advisory"]["mode"] == "live-local-advisory"
    assert r.json()["status"] == "pending"
    task = provider.generate.call_args.args[1]
    assert task["source_passages"][0]["text"] == application()["explanation"]
    assert post(client, "/sessions", session(), 2).status_code == 403


def test_presentation_refuses_existing_normal_and_preserves_history(tmp_path):
    with pytest.raises(ValueError):
        create_presentation(DEFAULT_DB)
    path = tmp_path / "classall-v5-presentation.sqlite3"
    create_presentation(path)
    before = path.read_bytes()
    with pytest.raises(FileExistsError):
        create_presentation(path)
    assert path.read_bytes() == before
    with connect(str(path)) as db:
        assert db.execute("SELECT COUNT(*) FROM bookings").fetchone()[0] >= 9
        assert (
            db.execute("SELECT COUNT(*) FROM sessions WHERE id IN (7,8)").fetchone()[0]
            == 2
        )
        assert not db.execute(
            "SELECT 1 FROM tutor_approvals WHERE tutor_id=2 AND subject_id=1"
        ).fetchone()
    initialize(str(path))
    with connect(str(path)) as db:
        assert (
            db.execute(
                "SELECT SUM(points) FROM contribution_ledger WHERE tutor_id=2"
            ).fetchone()[0]
            == 40
        )


def test_additive_upgrade_preserves_every_v4_record_and_publication(tmp_path):
    from unittest.mock import patch

    path = str(tmp_path / "normal-v4.sqlite3")
    # Exercise the actual V4 initialization sequence with only the new migration withheld.
    with patch("app.core.migrate"), TestClient(create_app(path)) as c:
        group = post(c, "/groups", {k: v for k, v in session().items() if k != "goals"})
        assert group.status_code == 201, group.text
        draft = post(c, "/studio/demo?language=es", uid=3).json()["assessment"]
        for q in draft["questions"]:
            r = post(
                c,
                f"/studio/assessments/{draft['id']}/questions/{q['id']}/review",
                {"status": "reviewed", "revision": q["revision"]},
                3,
            )
            assert r.status_code == 200, r.text
        published = post(c, f"/studio/assessments/{draft['id']}/publish", uid=3)
        assert published.status_code == 201, published.text
    with connect(path) as db:
        # Table names come from SQLite metadata, not requests.
        tables = [
            r[0]
            for r in db.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
            )
        ]
        before = {
            name: [
                tuple(r) for r in db.execute(f'SELECT * FROM "{name}" ORDER BY rowid')
            ]
            for name in tables
        }
    initialize(path)
    initialize(path)
    with connect(path) as db:
        for name, rows in before.items():
            assert [
                tuple(r) for r in db.execute(f'SELECT * FROM "{name}" ORDER BY rowid')
            ] == rows, name
        assert (
            db.execute(
                "SELECT SUM(points) FROM contribution_ledger WHERE tutor_id=2"
            ).fetchone()[0]
            == 40
        )


def test_local_advisory_failure_does_not_silently_prepare_or_decide(client):
    from fastapi import HTTPException

    aid = post(client, "/tutor-applications", application(), 2).json()["id"]
    provider = Mock()
    provider.generate.side_effect = HTTPException(
        503, "Cannot connect to local Ollama. Start Ollama or open the prepared demo."
    )
    client.app.state.ai_provider = provider
    result = post(client, f"/tutor-applications/{aid}/advisory?mode=live", uid=2)
    assert result.status_code == 503
    current = get(client, "/tutor-applications", 2).json()[0]
    assert current["advisory"] is None and current["status"] == "pending"
    assert post(client, "/sessions", session(), 2).status_code == 403


def test_invalid_inputs_and_duplicate_applications(client):
    assert (
        post(
            client, "/tutor-applications", application(answers=[True, 1]), 2
        ).status_code
        == 422
    )
    assert (
        post(client, "/tutor-applications", application(answers=[0, 99]), 2).status_code
        == 422
    )
    assert post(client, "/tutor-applications", application(), 2).status_code == 201
    assert post(client, "/tutor-applications", application(), 2).status_code == 409
    assert post(client, "/tutor-applications", application(), 3).status_code == 403
