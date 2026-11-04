from datetime import date
from typing import Literal
from fastapi import APIRouter, Depends, HTTPException
from . import connected as svc, repository as repo
from .connected_schemas import (
    SupportSignalRecord,
    SupportSuggestions,
    NamedPerson,
    Attendee,
    PulseInput,
    TopicInput,
    EventInput,
    SessionInput,
    ActionInput,
    ActionUpdate,
    FacultySessionInput,
    PulseRecord,
    SupportRequestRecord,
    GroupRecord,
    ActionRecord,
)
from .schemas import Session
from .learning import now


def register(app, get_db, demo_actor):
    router = APIRouter(prefix="/api")

    @router.get("/pulses", response_model=list[PulseRecord])
    def pulses(actor=Depends(demo_actor), db=Depends(get_db)):
        return svc.pulse_rows(db, actor)

    @router.put("/pulses/{topic_id}", response_model=PulseRecord)
    def pulse(
        topic_id: int, body: PulseInput, actor=Depends(demo_actor), db=Depends(get_db)
    ):
        return svc.save_pulse(db, actor, topic_id, body.response)

    @router.delete("/pulses/{topic_id}")
    def withdraw_pulse(topic_id: int, actor=Depends(demo_actor), db=Depends(get_db)):
        svc.student(actor)
        svc.topic(db, topic_id)
        db.execute("BEGIN IMMEDIATE")
        # Delete the minimal voluntary response entirely on withdrawal.
        db.execute(
            "DELETE FROM learning_pulses WHERE learner_id=? AND topic_id=?",
            (actor["id"], topic_id),
        )
        db.commit()
        return {"message": "Your response has been withdrawn."}

    @router.get("/support-requests", response_model=list[SupportRequestRecord])
    def requests(actor=Depends(demo_actor), db=Depends(get_db)):
        return svc.requests(db, actor)

    @router.post(
        "/support-requests", response_model=SupportRequestRecord, status_code=201
    )
    def request(body: TopicInput, actor=Depends(demo_actor), db=Depends(get_db)):
        return svc.create_request(db, actor, body.topic_id)

    @router.post(
        "/support-requests/{request_id}/withdraw", response_model=SupportRequestRecord
    )
    def withdraw_request(
        request_id: int, actor=Depends(demo_actor), db=Depends(get_db)
    ):
        svc.student(actor)
        db.execute("BEGIN IMMEDIATE")
        row = db.execute(
            "SELECT * FROM support_requests WHERE id=? AND learner_id=?",
            (request_id, actor["id"]),
        ).fetchone()
        if row is None:
            raise HTTPException(404, "Support request not found for this learner.")
        db.execute(
            "UPDATE support_requests SET status='withdrawn',updated_at=? WHERE id=?",
            (now(), request_id),
        )
        db.commit()
        return next(r for r in svc.requests(db, actor) if r["id"] == request_id)

    @router.get("/topics/{topic_id}/support", response_model=SupportSuggestions)
    def suggestions(topic_id: int, actor=Depends(demo_actor), db=Depends(get_db)):
        return svc.suggestions(db, actor, topic_id)

    @router.get("/groups", response_model=list[GroupRecord])
    def groups(
        subject_id: int | None = None,
        topic_id: int | None = None,
        date: date | None = None,
        available: bool = False,
        mine: bool = False,
        actor=Depends(demo_actor),
        db=Depends(get_db),
    ):
        return svc.groups(db, actor, subject_id, topic_id, date, available, mine)

    @router.post("/groups", response_model=GroupRecord, status_code=201)
    def create_group(body: EventInput, actor=Depends(demo_actor), db=Depends(get_db)):
        return svc.save_group(db, actor, body)

    @router.put("/groups/{group_id}", response_model=GroupRecord)
    def edit_group(
        group_id: int, body: EventInput, actor=Depends(demo_actor), db=Depends(get_db)
    ):
        return svc.save_group(db, actor, body, group_id)

    @router.post("/groups/{group_id}/{operation}", response_model=GroupRecord)
    def membership(
        group_id: int,
        operation: Literal["join", "leave", "cancel"],
        actor=Depends(demo_actor),
        db=Depends(get_db),
    ):
        return svc.change_membership(db, actor, group_id, operation)

    @router.post("/sessions", response_model=Session, status_code=201)
    def publish(body: SessionInput, actor=Depends(demo_actor), db=Depends(get_db)):
        return svc.publish_session(db, actor, body)

    @router.put("/sessions/{session_id}", response_model=Session)
    def edit_session(
        session_id: int,
        body: SessionInput,
        actor=Depends(demo_actor),
        db=Depends(get_db),
    ):
        return svc.manage_session(db, actor, session_id, body)

    @router.post("/sessions/{session_id}/cancel", response_model=Session)
    def cancel_session(session_id: int, actor=Depends(demo_actor), db=Depends(get_db)):
        return svc.manage_session(db, actor, session_id)

    @router.get("/sessions/{session_id}/attendees", response_model=list[Attendee])
    def attendees(session_id: int, actor=Depends(demo_actor), db=Depends(get_db)):
        s = repo.session(db, session_id)
        if actor["role"] != "tutor" or s["tutor"]["id"] != actor["id"]:
            raise HTTPException(
                403, "Only the host may view the confirmed attendance list."
            )
        return [
            dict(r)
            for r in db.execute(
                "SELECT u.id,u.name,b.id AS reservation_id FROM users u JOIN bookings b ON b.learner_id=u.id WHERE b.session_id=? AND b.status='confirmed' ORDER BY b.id",
                (session_id,),
            )
        ]

    @router.get("/professor/signals", response_model=list[SupportSignalRecord])
    def signals(actor=Depends(demo_actor), db=Depends(get_db)):
        return svc.professor_signals(db, actor)

    @router.get("/professor/hosts", response_model=list[NamedPerson])
    def hosts(topic_id: int, actor=Depends(demo_actor), db=Depends(get_db)):
        t = svc.assigned(db, actor, topic_id)
        return [
            dict(r)
            for r in db.execute(
                "SELECT u.id,u.name FROM users u JOIN tutor_approvals a ON a.tutor_id=u.id WHERE a.subject_id=? AND u.role='tutor'",
                (t["subject_id"],),
            )
        ]

    @router.get("/support-actions", response_model=list[ActionRecord])
    def actions(actor=Depends(demo_actor), db=Depends(get_db)):
        return svc.actions(db, actor)

    @router.post("/support-actions", response_model=ActionRecord, status_code=201)
    def action(body: ActionInput, actor=Depends(demo_actor), db=Depends(get_db)):
        return svc.create_action(db, actor, body)

    @router.patch("/support-actions/{action_id}", response_model=ActionRecord)
    def update_action(
        action_id: int,
        body: ActionUpdate,
        actor=Depends(demo_actor),
        db=Depends(get_db),
    ):
        db.execute("BEGIN IMMEDIATE")
        current = svc.own_action(db, actor, action_id)
        if current["status"] in ("completed", "cancelled"):
            raise HTTPException(409, "Completed or cancelled actions are read-only.")
        if body.status == "cancelled" and current["session_id"]:
            raise HTTPException(
                409, "Cancel the linked session explicitly to release its reservations."
            )
        db.execute(
            "UPDATE support_actions SET status=?,notes=?,follow_up_date=? WHERE id=?",
            (
                body.status,
                body.notes if "notes" in body.model_fields_set else current["notes"],
                (
                    body.follow_up_date
                    if "follow_up_date" in body.model_fields_set
                    else current["follow_up_date"]
                ),
                action_id,
            ),
        )
        db.commit()
        return svc.own_action(db, actor, action_id)

    @router.post(
        "/support-actions/{action_id}/session", response_model=Session, status_code=201
    )
    def faculty_session(
        action_id: int,
        body: FacultySessionInput,
        actor=Depends(demo_actor),
        db=Depends(get_db),
    ):
        return svc.publish_session(db, actor, body, action_id)

    app.include_router(router)
