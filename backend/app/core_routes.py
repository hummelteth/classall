import json
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Request

from . import connected
from . import core as svc
from . import repository as repo
from .core_schemas import (
    AdvisoryFeedback,
    ApplicationInput,
    AttendanceInput,
    Decision,
    FeedbackInput,
    SyntheticConsent,
)
from .learning import now


def register(app, get_db, demo_actor):
    router = APIRouter(prefix="/api")

    @router.get("/qualifications/{topic_id}")
    def qualification(
        topic_id: int,
        language: Literal["en", "es"] = "en",
        actor=Depends(demo_actor),
        db=Depends(get_db),
    ):
        connected.student(actor)
        return svc.qualification(db, topic_id, language)

    @router.get("/tutor-applications")
    def applications(actor=Depends(demo_actor), db=Depends(get_db)):
        return svc.applications(db, actor)

    @router.post("/tutor-applications", status_code=201)
    def apply(body: ApplicationInput, actor=Depends(demo_actor), db=Depends(get_db)):
        return svc.save_application(db, actor, body)

    @router.put("/tutor-applications/{aid}")
    def revise(
        aid: int, body: ApplicationInput, actor=Depends(demo_actor), db=Depends(get_db)
    ):
        return svc.save_application(db, actor, body, aid)

    @router.post("/tutor-applications/{aid}/review")
    def review(aid: int, body: Decision, actor=Depends(demo_actor), db=Depends(get_db)):
        return svc.review(db, actor, aid, body)

    @router.post("/tutor-applications/{aid}/advisory")
    def advisory(
        aid: int,
        request: Request,
        mode: Literal["prepared", "live"] = "prepared",
        actor=Depends(demo_actor),
        db=Depends(get_db),
    ):
        current = svc.application(db, actor, aid)
        if current["status"] != "pending":
            raise HTTPException(
                409, "Advisory feedback is available only for pending applications."
            )
        if mode == "live":
            if request.app.state.ai_settings.demo:
                raise HTTPException(
                    409, "Live generation is disabled in prepared demo mode."
                )
            # Existing provider has a strict system/data boundary. All applicant text is
            # placed inside the explicitly untrusted source_passages field.
            draft = request.app.state.ai_provider.generate(
                AdvisoryFeedback,
                {
                    "purpose": "tutor-qualification-advisory",
                    "task": "Give advisory rubric feedback on a tutor explanation. Never decide approval or assign a score.",
                    "language": current["language"],
                    "rubric": svc.RUBRIC,
                    "source_passages": [
                        {
                            "id": "applicant-explanation",
                            "text": current["content"]["explanation"],
                        }
                    ],
                    "reference_answers": current["qualification"]["questions"],
                },
            ).model_dump()
        else:
            # A checklist, never a fabricated evaluation of the applicant's writing.
            draft = svc.RUBRIC
        result = {
            "mode": "prepared-review-checklist"
            if mode == "prepared"
            else "live-local-advisory",
            "criteria": draft,
            "advisory_only": True,
        }
        db.execute("BEGIN IMMEDIATE")
        fresh = svc.application(db, actor, aid)
        if fresh["updated_at"] != current["updated_at"] or fresh["status"] != "pending":
            raise HTTPException(
                409, "The application changed. Reload before generating feedback."
            )
        db.execute(
            "UPDATE tutor_applications SET advisory=?,updated_at=? WHERE id=?",
            (json.dumps(result), now(), aid),
        )
        svc.event(db, aid, actor["id"], "advisory", result)
        db.commit()
        return svc.application(db, actor, aid)

    @router.post("/sessions/{sid}/synthetic-attendance")
    def propose(
        sid: int, body: AttendanceInput, actor=Depends(demo_actor), db=Depends(get_db)
    ):
        return svc.host_proposal(db, actor, sid, body)

    @router.post("/bookings/{bid}/confirm-synthetic-attendance")
    def confirm(
        bid: int, body: SyntheticConsent, actor=Depends(demo_actor), db=Depends(get_db)
    ):
        return svc.confirm_attendance(db, actor, bid)

    @router.get("/attendance/mine")
    def mine(actor=Depends(demo_actor), db=Depends(get_db)):
        return svc.learner_records(db, actor)

    @router.get("/teaching/records")
    def teaching(actor=Depends(demo_actor), db=Depends(get_db)):
        connected.student(actor)
        rows = db.execute(
            repo.SESSION_QUERY + " WHERE s.tutor_id=? ORDER BY s.id DESC",
            (actor["id"],),
        ).fetchall()
        return [
            {
                **repo.session_dict(db, r),
                "attendance_proposed": bool(
                    db.execute(
                        "SELECT 1 FROM synthetic_session_confirmations WHERE session_id=?",
                        (r["id"],),
                    ).fetchone()
                ),
            }
            for r in rows
        ]

    @router.post("/bookings/{bid}/feedback", status_code=201)
    def feedback(
        bid: int, body: FeedbackInput, actor=Depends(demo_actor), db=Depends(get_db)
    ):
        return svc.save_feedback(db, actor, bid, body)

    @router.get("/portfolio")
    def portfolio(actor=Depends(demo_actor), db=Depends(get_db)):
        return svc.portfolio(db, actor)

    app.include_router(router)
