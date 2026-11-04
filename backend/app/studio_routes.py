import json

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import Response

from . import studio as svc
from .ai import AISettings, OllamaProvider
from .learning import now
from .studio_demo import prepared_analysis, prepared_pair
from .studio_schemas import (
    Analysis,
    AnalysisRequest,
    AnalysisReview,
    Assignment,
    GenerateRequest,
    QuestionEdit,
    QuestionPair,
    ReviewQuestion,
)


def register(app, get_db, demo_actor):
    router = APIRouter(prefix="/api/studio")
    # Tests may inject a provider implementing the same boundary, with no live inference.
    app.state.ai_settings = AISettings.from_env()
    app.state.ai_provider = OllamaProvider(app.state.ai_settings)

    @router.get("/status")
    def status(request: Request, actor=Depends(demo_actor), db=Depends(get_db)):
        svc.professor(db, actor)
        settings = request.app.state.ai_settings
        result = request.app.state.ai_provider.status()
        return {
            **result,
            "demo_enabled": settings.demo,
            "processing": "local",
            "max_bytes": svc.MAX_BYTES,
            "max_pages": svc.MAX_PAGES,
        }

    @router.get("/workspace")
    def workspace(actor=Depends(demo_actor), db=Depends(get_db)):
        svc.professor(db, actor)
        courses = [
            dict(r)
            for r in db.execute(
                "SELECT s.* FROM subjects s JOIN professor_subjects p ON p.subject_id=s.id WHERE p.professor_id=?",
                (actor["id"],),
            )
        ]
        documents = [
            dict(r)
            for r in db.execute(
                "SELECT id,subject_id,filename,pages,created_at FROM studio_documents WHERE professor_id=? ORDER BY created_at DESC",
                (actor["id"],),
            )
        ]
        analyses = [
            svc.analysis(db, actor, r[0])
            for r in db.execute(
                "SELECT a.id FROM studio_analyses a JOIN studio_documents d ON d.id=a.document_id WHERE d.professor_id=? ORDER BY a.id DESC",
                (actor["id"],),
            ).fetchall()
        ]
        assessments = [
            svc.assessment(db, actor, r[0])
            for r in db.execute(
                "SELECT id FROM studio_assessments WHERE professor_id=? ORDER BY id DESC",
                (actor["id"],),
            ).fetchall()
        ]
        publications = [
            dict(r)
            for r in db.execute(
                "SELECT id,assessment_id,topic_id,language,mode,published_at FROM studio_publications WHERE professor_id=? ORDER BY id DESC",
                (actor["id"],),
            )
        ]
        sessions = [
            dict(r)
            for r in db.execute(
                """SELECT s.id,s.title,st.topic_id,
          EXISTS(SELECT 1 FROM assessment_submissions x JOIN learning_checks c ON c.id=x.check_id WHERE c.session_id=s.id) AS has_submissions,
          EXISTS(SELECT 1 FROM studio_check_sources x JOIN learning_checks c ON c.id=x.check_id WHERE c.session_id=s.id) AS assigned
          FROM sessions s JOIN session_topics st ON st.session_id=s.id JOIN professor_subjects p ON p.subject_id=s.subject_id
          WHERE p.professor_id=? AND s.status='upcoming' """,
                (actor["id"],),
            )
        ]
        return {
            "courses": courses,
            "documents": documents,
            "analyses": analyses,
            "assessments": assessments,
            "publications": publications,
            "sessions": sessions,
        }

    @router.post("/documents", status_code=201)
    async def upload(
        subject_id: int = Form(...),
        file: UploadFile = File(...),
        actor=Depends(demo_actor),
        db=Depends(get_db),
    ):
        svc.professor(db, actor, subject_id)
        try:
            content = await file.read(svc.MAX_BYTES + 1)
            return svc.upload(
                db, actor, subject_id, file.filename, content, file.content_type
            )
        finally:
            await file.close()

    @router.get("/documents/{did}")
    def document(did: str, actor=Depends(demo_actor), db=Depends(get_db)):
        return svc.document(db, actor, did)

    @router.get("/demo/pdf")
    def demo_pdf(actor=Depends(demo_actor), db=Depends(get_db)):
        svc.professor(db, actor)
        return Response(
            svc.DEMO_PDF.read_bytes(),
            media_type="application/pdf",
            headers={
                "Content-Disposition": 'attachment; filename="classall-chain-rule.pdf"'
            },
        )

    @router.post("/demo", status_code=201)
    def demo(language: str = "en", actor=Depends(demo_actor), db=Depends(get_db)):
        if language not in ("en", "es"):
            raise HTTPException(422, "Choose English or Spanish for the content.")
        svc.professor(db, actor, 1)
        # Explicit button is the authorization to load a prepared example. No inference is attempted.
        doc = svc.upload(
            db,
            actor,
            1,
            "classall-chain-rule.pdf",
            svc.DEMO_PDF.read_bytes(),
            "application/pdf",
        )
        content = prepared_analysis(doc["passages"][:1], language)
        aid = svc.save_analysis(db, doc, language, "prepared-demo", content)
        # Prepared objectives are still drafts and must be reviewed before normal generation.
        body = GenerateRequest(
            analysis_id=aid,
            topic_id=1,
            objective_ids=["inner", "differentiate"],
            passage_ids=[doc["passages"][0]["id"]],
            language=language,
            count=2,
        )
        pair = prepared_pair(doc["passages"], language)
        assessment = svc.save_pair(
            db,
            actor,
            doc,
            body,
            "prepared-demo",
            [o.model_dump() for o in content.topics[0].objectives],
            pair,
        )
        return {
            "document": doc,
            "analysis": svc.analysis(db, actor, aid),
            "assessment": assessment,
            "mode": "prepared-demo",
        }

    @router.post("/documents/{did}/analyze", status_code=201)
    def analyze(
        did: str,
        body: AnalysisRequest,
        request: Request,
        actor=Depends(demo_actor),
        db=Depends(get_db),
    ):
        doc = svc.document(db, actor, did)
        passages = svc.select_passages(doc, body.passage_ids)
        if request.app.state.ai_settings.demo:
            raise HTTPException(
                409,
                "Prepared demo mode is enabled. Open the prepared example; no live inference is running.",
            )
        content = request.app.state.ai_provider.generate(
            Analysis,
            {
                "task": "Propose topics, concepts, learning objectives and short summaries as drafts.",
                "language": body.language,
                "source_passages": passages,
            },
        )
        svc.validate_analysis(content, set(body.passage_ids))
        aid = svc.save_analysis(db, doc, body.language, "live-local", content)
        return svc.analysis(db, actor, aid)

    @router.put("/analyses/{aid}")
    def review_analysis(
        aid: int, body: AnalysisReview, actor=Depends(demo_actor), db=Depends(get_db)
    ):
        current = svc.analysis(db, actor, aid)
        doc = svc.document(db, actor, current["document_id"])
        svc.validate_analysis(body.content, {p["id"] for p in doc["passages"]})
        db.execute(
            "UPDATE studio_analyses SET content=?,status=? WHERE id=?",
            (
                body.content.model_dump_json(),
                "reviewed" if body.reviewed else "draft",
                aid,
            ),
        )
        return svc.analysis(db, actor, aid)

    @router.post("/assessments", status_code=201)
    def generate(
        body: GenerateRequest,
        request: Request,
        actor=Depends(demo_actor),
        db=Depends(get_db),
    ):
        current = svc.analysis(db, actor, body.analysis_id)
        doc = svc.document(db, actor, current["document_id"])
        topic = db.execute(
            "SELECT * FROM topics WHERE id=? AND subject_id=?",
            (body.topic_id, doc["subject_id"]),
        ).fetchone()
        if not topic:
            raise HTTPException(422, "Select a topic belonging to this course.")
        if current["status"] != "reviewed":
            raise HTTPException(
                409,
                "Review and approve the learning objectives before generating questions.",
            )
        objectives = [
            o
            for t in current["content"]["topics"]
            for o in t["objectives"]
            if o["id"] in body.objective_ids
        ]
        if (
            len(body.objective_ids) != len(set(body.objective_ids))
            or len(objectives) != len(body.objective_ids)
            or len(objectives) > body.count
        ):
            raise HTTPException(
                422,
                "Select approved objectives, with at least one question per objective in each stage.",
            )
        passages = svc.select_passages(doc, body.passage_ids)
        if request.app.state.ai_settings.demo:
            raise HTTPException(
                409,
                "Prepared demo mode is enabled. Open the prepared example; no live inference is running.",
            )
        pair = request.app.state.ai_provider.generate(
            QuestionPair,
            {
                "task": "Generate a complete pair of distinct pre-session and post-session multiple-choice assessments.",
                "questions_per_stage": body.count,
                "topic": topic["name"],
                "language": body.language,
                "difficulty": body.difficulty,
                "approved_objectives": objectives,
                "source_passages": passages,
            },
        )
        svc.validate_pair(
            pair, body, {o["id"] for o in objectives}, set(body.passage_ids)
        )
        return svc.save_pair(db, actor, doc, body, "live-local", objectives, pair)

    @router.get("/assessments/{aid}")
    def assessment(aid: int, actor=Depends(demo_actor), db=Depends(get_db)):
        return svc.assessment(db, actor, aid)

    @router.put("/assessments/{aid}/questions/{qid}")
    def edit(
        aid: int,
        qid: int,
        body: QuestionEdit,
        actor=Depends(demo_actor),
        db=Depends(get_db),
    ):
        db.execute("BEGIN IMMEDIATE")
        current = svc.mutable(db, actor, aid)
        question = next((q for q in current["questions"] if q["id"] == qid), None)
        if not question:
            raise HTTPException(404, "Question not found.")
        if question["revision"] != body.revision:
            raise HTTPException(409, "This question changed. Reload it before saving.")
        doc = svc.document(db, actor, current["document_id"])
        svc.select_passages(doc, [body.content.passage_id])
        if (
            body.content.objective_id not in {o["id"] for o in current["objectives"]}
            or body.content.language != current["language"]
        ):
            raise HTTPException(
                422, "Use an approved objective and the assessment content language."
            )
        db.execute(
            "UPDATE studio_questions SET content=?,status='draft',revision=revision+1 WHERE id=?",
            (body.content.model_dump_json(), qid),
        )
        db.execute(
            "UPDATE studio_assessments SET status='draft',revision=revision+1 WHERE id=?",
            (aid,),
        )
        return svc.assessment(db, actor, aid)

    @router.post("/assessments/{aid}/questions/{qid}/review")
    def review(
        aid: int,
        qid: int,
        body: ReviewQuestion,
        actor=Depends(demo_actor),
        db=Depends(get_db),
    ):
        db.execute("BEGIN IMMEDIATE")
        current = svc.mutable(db, actor, aid)
        question = next((q for q in current["questions"] if q["id"] == qid), None)
        if not question:
            raise HTTPException(404, "Question not found.")
        if question["revision"] != body.revision:
            raise HTTPException(
                409, "This question changed. Reload it before reviewing."
            )
        db.execute(
            "UPDATE studio_questions SET status=?,revision=revision+1 WHERE id=?",
            (body.status, qid),
        )
        all_reviewed = not db.execute(
            "SELECT 1 FROM studio_questions WHERE assessment_id=? AND status!='reviewed'",
            (aid,),
        ).fetchone()
        db.execute(
            "UPDATE studio_assessments SET status=?,revision=revision+1 WHERE id=?",
            ("reviewed" if all_reviewed else "draft", aid),
        )
        return svc.assessment(db, actor, aid)

    @router.post("/assessments/{aid}/publish", status_code=201)
    def publish(aid: int, actor=Depends(demo_actor), db=Depends(get_db)):
        return svc.publish(db, actor, aid)

    @router.post("/assessments/{aid}/revise", status_code=201)
    def revise(aid: int, actor=Depends(demo_actor), db=Depends(get_db)):
        current = svc.assessment(db, actor, aid)
        new = db.execute(
            """INSERT INTO studio_assessments(professor_id,document_id,analysis_id,topic_id,language,mode,objectives,created_at)
          VALUES (?,?,?,?,?,?,?,?)""",
            (
                actor["id"],
                current["document_id"],
                current["analysis_id"],
                current["topic_id"],
                current["language"],
                current["mode"],
                json.dumps(current["objectives"], ensure_ascii=False),
                now(),
            ),
        ).lastrowid
        db.executemany(
            "INSERT INTO studio_questions(assessment_id,content) VALUES (?,?)",
            [
                (new, json.dumps(q["content"], ensure_ascii=False))
                for q in current["questions"]
            ],
        )
        return svc.assessment(db, actor, new)

    @router.post("/publications/{pid}/assign")
    def assign(
        pid: int, body: Assignment, actor=Depends(demo_actor), db=Depends(get_db)
    ):
        return svc.assign(db, actor, pid, body.session_id)

    from .studio_upload import StudioUploadLimit

    app.add_middleware(StudioUploadLimit)
    app.include_router(router)
