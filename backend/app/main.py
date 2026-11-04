from contextlib import asynccontextmanager
from typing import Annotated, Literal
from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request
from .db import connect, database_path, initialize
from . import repository as repo
from . import learning
from .schemas import LearningSubmission
from .booking_service import create_booking, cancel_booking
from .schemas import Booking, BookingCreate, DemoUser, Session, Subject


def get_db(request: Request):
    with connect(request.app.state.db_path) as db:
        yield db


def demo_actor(x_demo_user_id: Annotated[int, Header()], db=Depends(get_db)):
    # Explicitly a demo selector, never authentication or a production trust boundary.
    return repo.user(db, x_demo_user_id)


def create_app(db_path: str | None = None):
    @asynccontextmanager
    async def lifespan(app: FastAPI):
        initialize(app.state.db_path)
        yield

    app = FastAPI(
        title="ClassAll Demo API",
        version="0.3.0",
        lifespan=lifespan,
        description="Synthetic data only. X-Demo-User-Id is a demo selector, NOT authentication. Do not expose this API publicly.",
    )
    app.state.db_path = db_path or database_path()

    @app.get("/api/health")
    def health(db=Depends(get_db)):
        db.execute("SELECT 1")
        return {"status": "ok", "mode": "synthetic-demo"}

    @app.get("/api/demo-users", response_model=list[DemoUser])
    def demo_users(db=Depends(get_db)):
        return [
            dict(r)
            for r in db.execute("SELECT * FROM users WHERE id IN (1,2,3) ORDER BY id")
        ]

    @app.get("/api/subjects", response_model=list[Subject])
    def subjects(db=Depends(get_db)):
        return [dict(r) for r in db.execute("SELECT * FROM subjects ORDER BY id")]

    @app.get("/api/sessions", response_model=list[Session])
    def sessions(
        subject_id: Annotated[int | None, Query(gt=0)] = None,
        q: Annotated[str | None, Query(max_length=100)] = None,
        delivery: Literal["Online", "In person"] | None = None,
        topic_id: Annotated[int | None, Query(gt=0)] = None,
        db=Depends(get_db),
    ):
        offerings = repo.sessions(db, subject_id, q, delivery)
        return [
            s
            for s in offerings
            if topic_id is None or any(t["id"] == topic_id for t in s["topics"])
        ]

    @app.get("/api/sessions/{session_id}", response_model=Session)
    def session(session_id: int, db=Depends(get_db)):
        return repo.session(db, session_id)

    @app.get("/api/bookings", response_model=list[Booking])
    def bookings(actor=Depends(demo_actor), db=Depends(get_db)):
        return repo.bookings(db, actor["id"])

    @app.post("/api/bookings", response_model=Booking, status_code=201)
    def book(body: BookingCreate, actor=Depends(demo_actor), db=Depends(get_db)):
        return create_booking(db, actor["id"], body.session_id)

    @app.post("/api/bookings/{booking_id}/cancel", response_model=Booking)
    def cancel(booking_id: int, actor=Depends(demo_actor), db=Depends(get_db)):
        return cancel_booking(db, actor["id"], booking_id)

    @app.get("/api/tutor/overview")
    def tutor_overview(actor=Depends(demo_actor), db=Depends(get_db)):
        if actor["role"] != "tutor":
            raise HTTPException(
                403, "Choose the Tutor demo role to view this workspace."
            )
        completed = db.execute(
            "SELECT COUNT(*) AS count, COALESCE(SUM(duration_minutes),0) AS minutes FROM sessions WHERE tutor_id=? AND status='completed'",
            (actor["id"],),
        ).fetchone()
        approved = db.execute(
            "SELECT s.* FROM subjects s JOIN tutor_approvals a ON a.subject_id=s.id WHERE a.tutor_id=?",
            (actor["id"],),
        ).fetchall()
        return {
            "sessions": repo.sessions(db, tutor_id=actor["id"]),
            "completed_sessions": completed["count"],
            "teaching_minutes": completed["minutes"],
            "engagement_points": completed["count"] * 20,
            "approved_subjects": [dict(r) for r in approved],
            "recognition_note": "Synthetic completed-session history. 20 illustrative points per completed session; no official credential.",
        }

    @app.get("/api/insights")
    def insights(actor=Depends(demo_actor), db=Depends(get_db)):
        if actor["role"] != "professor":
            raise HTTPException(
                403, "Choose the Professor demo role to view aggregate insights."
            )
        # Assigned demo subjects only. No individual academic records or risk labels.
        results = []
        for assignment in db.execute(
            "SELECT subject_id FROM professor_subjects WHERE professor_id=? ORDER BY subject_id",
            (actor["id"],),
        ).fetchall():
            subject_id = assignment["subject_id"]
            subject = dict(
                db.execute(
                    "SELECT * FROM subjects WHERE id=?", (subject_id,)
                ).fetchone()
            )
            offerings = repo.sessions(db, subject_id=subject_id)
            results.append(
                {
                    "subject": subject,
                    "topics": learning.topic_insights(db, actor["id"], subject_id),
                    "sessions": len(offerings),
                    "bookings": sum(s["booked_seats"] for s in offerings),
                    "capacity": sum(s["capacity"] for s in offerings),
                    "available_seats": sum(s["available_seats"] for s in offerings),
                }
            )
        return {
            "courses": results,
            "note": "Counts reflect confirmed bookings for future demo sessions in assigned courses. Booking demand is not evidence of academic difficulty. Learning Check means use the latest confirmed booking per distinct learner and topic, including past sessions. Groups below n=3 are suppressed separately for pre, post and matched pairs. Missing checks are excluded, never scored zero. Differences are descriptive, not validated learning gains. All records are synthetic; two seeded chain-rule examples are included. Recommendations are advisory and require human review.",
        }

    @app.get("/api/learning/topics")
    def learning_topics(db=Depends(get_db)):
        return [
            {
                **dict(t),
                "objectives": [
                    dict(o)
                    for o in db.execute(
                        "SELECT * FROM learning_objectives WHERE topic_id=? ORDER BY id",
                        (t["id"],),
                    )
                ],
            }
            for t in db.execute("SELECT * FROM topics ORDER BY id")
        ]

    @app.get("/api/learning/history")
    def learning_history(actor=Depends(demo_actor), db=Depends(get_db)):
        if actor["role"] == "professor":
            raise HTTPException(
                403, "Use aggregated course insights in the Professor demo."
            )
        return learning.history(db, actor)

    @app.get("/api/bookings/{booking_id}/learning-checks/{stage}")
    def learning_check(
        booking_id: int,
        stage: Literal["pre", "post"],
        actor=Depends(demo_actor),
        db=Depends(get_db),
    ):
        return learning.check_payload(db, actor, booking_id, stage)

    @app.post("/api/bookings/{booking_id}/learning-checks/{stage}", status_code=201)
    def submit_check(
        booking_id: int,
        stage: Literal["pre", "post"],
        body: LearningSubmission,
        actor=Depends(demo_actor),
        db=Depends(get_db),
    ):
        return learning.submit(db, actor, booking_id, stage, body.answers)

    @app.post("/api/bookings/{booking_id}/simulate-completion")
    def simulate_completion(
        booking_id: int, actor=Depends(demo_actor), db=Depends(get_db)
    ):
        return learning.simulate(db, actor, booking_id)

    from .connected_routes import register

    register(app, get_db, demo_actor)
    return app


app = create_app()
