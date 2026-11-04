"""Local professor content workflow. Additive storage; publication snapshots never mutate."""

import hashlib
import io
import json
import uuid
from pathlib import Path

from fastapi import HTTPException
from pypdf import PdfReader

from .learning import now
from .studio_schemas import QuestionPair

MAX_BYTES = 8 * 1024 * 1024
MAX_PAGES = 40
DEMO_PDF = Path(__file__).resolve().parents[2] / "docs" / "demo" / "chain-rule.pdf"


def migrate(db):
    db.executescript("""
    CREATE TABLE IF NOT EXISTS studio_documents (
      id TEXT PRIMARY KEY, professor_id INTEGER NOT NULL REFERENCES users(id),
      subject_id INTEGER NOT NULL REFERENCES subjects(id), filename TEXT NOT NULL,
      sha256 TEXT NOT NULL, pages INTEGER NOT NULL, created_at TEXT NOT NULL, pdf BLOB NOT NULL);
    CREATE TABLE IF NOT EXISTS studio_passages (
      id TEXT PRIMARY KEY, document_id TEXT NOT NULL REFERENCES studio_documents(id),
      page INTEGER NOT NULL, ordinal INTEGER NOT NULL, text TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS studio_analyses (
      id INTEGER PRIMARY KEY, document_id TEXT NOT NULL REFERENCES studio_documents(id),
      language TEXT NOT NULL, mode TEXT NOT NULL, content TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft', created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS studio_assessments (
      id INTEGER PRIMARY KEY, professor_id INTEGER NOT NULL REFERENCES users(id),
      document_id TEXT NOT NULL REFERENCES studio_documents(id), analysis_id INTEGER NOT NULL REFERENCES studio_analyses(id),
      topic_id INTEGER NOT NULL REFERENCES topics(id), language TEXT NOT NULL, mode TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft', revision INTEGER NOT NULL DEFAULT 1,
      objectives TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS studio_questions (
      id INTEGER PRIMARY KEY, assessment_id INTEGER NOT NULL REFERENCES studio_assessments(id),
      content TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'draft', revision INTEGER NOT NULL DEFAULT 1);
    CREATE TABLE IF NOT EXISTS studio_publications (
      id INTEGER PRIMARY KEY, assessment_id INTEGER NOT NULL UNIQUE REFERENCES studio_assessments(id),
      professor_id INTEGER NOT NULL REFERENCES users(id), topic_id INTEGER NOT NULL REFERENCES topics(id),
      language TEXT NOT NULL, mode TEXT NOT NULL, snapshot TEXT NOT NULL, published_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS studio_check_sources (
      check_id INTEGER PRIMARY KEY REFERENCES learning_checks(id) ON DELETE CASCADE,
      publication_id INTEGER NOT NULL REFERENCES studio_publications(id));
    """)


def professor(db, actor, subject_id=None):
    if actor["role"] != "professor":
        raise HTTPException(
            403, "Choose the Professor demo role to open AI Learning Studio."
        )
    if (
        subject_id is not None
        and not db.execute(
            "SELECT 1 FROM professor_subjects WHERE professor_id=? AND subject_id=?",
            (actor["id"], subject_id),
        ).fetchone()
    ):
        raise HTTPException(403, "This course is not assigned to this demo professor.")


def document(db, actor, did):
    professor(db, actor)
    row = db.execute(
        "SELECT id,professor_id,subject_id,filename,sha256,pages,created_at FROM studio_documents WHERE id=? AND professor_id=?",
        (did, actor["id"]),
    ).fetchone()
    if row is None:
        raise HTTPException(404, "Course document not found.")
    professor(db, actor, row["subject_id"])
    return {
        **dict(row),
        "passages": [
            dict(p)
            for p in db.execute(
                "SELECT id,page,ordinal,text FROM studio_passages WHERE document_id=? ORDER BY page,ordinal",
                (did,),
            )
        ],
    }


def upload(db, actor, subject_id, filename, content, mime):
    professor(db, actor, subject_id)
    if len(content) > MAX_BYTES:
        raise HTTPException(413, "PDF must be no larger than 8 MB.")
    if (
        not filename
        or not filename.lower().endswith(".pdf")
        or mime not in ("application/pdf", "application/octet-stream")
        or not content.startswith(b"%PDF-")
    ):
        raise HTTPException(422, "Upload a valid text-based PDF file.")
    try:
        reader = PdfReader(io.BytesIO(content), strict=True)
        if reader.is_encrypted:
            raise HTTPException(
                422,
                "Encrypted PDFs are not supported. Upload an unencrypted text-based PDF.",
            )
        if not 1 <= len(reader.pages) <= MAX_PAGES:
            raise HTTPException(
                422, "PDF must contain 1 to 40 pages. Upload a shorter chapter."
            )
        passages = []
        for page, item in enumerate(reader.pages, 1):
            # Limit retained text and reject pathological pages before extraction where possible.
            stream = item.get_contents()
            if stream is not None and len(stream.get_data()) > 2 * 1024 * 1024:
                raise HTTPException(
                    422, "PDF page is too complex. Export a simpler chapter."
                )
            text = item.extract_text() or ""
            if len(text) > 30000:
                raise HTTPException(
                    422, "PDF page contains too much text. Upload a shorter chapter."
                )
            text = " ".join(text.split())
            for ordinal, start in enumerate(range(0, len(text), 900)):
                excerpt = text[start : start + 900]
                if excerpt.strip():
                    passages.append((page, ordinal, excerpt))
        if sum(len(p[2]) for p in passages) < 80:
            raise HTTPException(
                422,
                "No readable text found. Scanned-only PDFs need OCR, which this prototype does not provide.",
            )
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(
            422, "PDF could not be read. Use an unencrypted text-based PDF."
        ) from error
    did = uuid.uuid4().hex
    # No user-supplied filename is ever used as a filesystem path.
    safe_name = filename.replace("\\", "/").split("/")[-1][:160]
    db.execute(
        "INSERT INTO studio_documents VALUES (?,?,?,?,?,?,?,?)",
        (
            did,
            actor["id"],
            subject_id,
            safe_name,
            hashlib.sha256(content).hexdigest(),
            len(reader.pages),
            now(),
            content,
        ),
    )
    db.executemany(
        "INSERT INTO studio_passages VALUES (?,?,?,?,?)",
        [(f"{did}-p{p}-{n}", did, p, n, t) for p, n, t in passages],
    )
    return document(db, actor, did)


def select_passages(doc, ids):
    found = {p["id"]: p for p in doc["passages"]}
    if len(ids) != len(set(ids)) or any(pid not in found for pid in ids):
        raise HTTPException(
            422, "Every source reference must belong to the selected document."
        )
    selected = [found[pid] for pid in ids]
    if sum(len(p["text"]) for p in selected) > 2700:
        raise HTTPException(422, "Select a shorter source section.")
    return selected


def validate_analysis(content, allowed):
    for topic in content.topics:
        if any(pid not in allowed for pid in topic.passage_ids):
            raise HTTPException(422, "Analysis cites an unknown source passage.")


def analysis(db, actor, aid):
    row = db.execute("SELECT * FROM studio_analyses WHERE id=?", (aid,)).fetchone()
    if row is None:
        raise HTTPException(404, "Content analysis not found.")
    document(db, actor, row["document_id"])
    return {**dict(row), "content": json.loads(row["content"])}


def save_analysis(db, doc, language, mode, content):
    validate_analysis(content, {p["id"] for p in doc["passages"]})
    aid = db.execute(
        "INSERT INTO studio_analyses(document_id,language,mode,content,created_at) VALUES (?,?,?,?,?)",
        (doc["id"], language, mode, content.model_dump_json(), now()),
    ).lastrowid
    return aid


def assessment(db, actor, aid):
    professor(db, actor)
    row = db.execute(
        "SELECT * FROM studio_assessments WHERE id=? AND professor_id=?",
        (aid, actor["id"]),
    ).fetchone()
    if row is None:
        raise HTTPException(404, "Assessment draft not found.")
    doc = document(db, actor, row["document_id"])
    passages = {p["id"]: p for p in doc["passages"]}
    questions = []
    for q in db.execute(
        "SELECT * FROM studio_questions WHERE assessment_id=? ORDER BY id", (aid,)
    ):
        content = json.loads(q["content"])
        questions.append(
            {**dict(q), "content": content, "source": passages[content["passage_id"]]}
        )
    return {
        **dict(row),
        "objectives": json.loads(row["objectives"]),
        "questions": questions,
    }


def validate_pair(pair, body, objectives, allowed):
    if len(pair.questions) != body.count * 2 or set(body.objective_ids) != {
        q.objective_id for q in pair.questions
    }:
        raise HTTPException(
            422,
            "Question count and objective coverage must match the requested assessment.",
        )
    for q in pair.questions:
        if q.passage_id not in allowed or q.objective_id not in objectives:
            raise HTTPException(
                422, "Question cites an unknown source or learning objective."
            )
        if q.language != body.language or q.difficulty != body.difficulty:
            raise HTTPException(
                422, "Question language and difficulty must match the request."
            )


def save_pair(db, actor, doc, body, mode, objectives, pair):
    aid = db.execute(
        """INSERT INTO studio_assessments(professor_id,document_id,analysis_id,topic_id,language,mode,objectives,created_at)
                       VALUES (?,?,?,?,?,?,?,?)""",
        (
            actor["id"],
            doc["id"],
            body.analysis_id,
            body.topic_id,
            body.language,
            mode,
            json.dumps(objectives, ensure_ascii=False),
            now(),
        ),
    ).lastrowid
    db.executemany(
        "INSERT INTO studio_questions(assessment_id,content) VALUES (?,?)",
        [(aid, q.model_dump_json()) for q in pair.questions],
    )
    return assessment(db, actor, aid)


def mutable(db, actor, aid):
    current = assessment(db, actor, aid)
    if current["status"] == "published":
        raise HTTPException(
            409,
            "Published content is immutable. Create a new revision to make changes.",
        )
    return current


def publish(db, actor, aid):
    db.execute("BEGIN IMMEDIATE")
    current = mutable(db, actor, aid)
    if not current["questions"] or any(
        q["status"] != "reviewed" for q in current["questions"]
    ):
        raise HTTPException(
            409,
            "Review and approve every question before publishing a complete assessment.",
        )
    try:
        pair = QuestionPair.model_validate(
            {"questions": [q["content"] for q in current["questions"]]}
        )
    except ValueError as error:
        raise HTTPException(
            422,
            "Pre/post sets must be distinct and cover the same objectives at comparable difficulty.",
        ) from error
    ids = {o["id"] for o in current["objectives"]}
    if ids != {q.objective_id for q in pair.questions}:
        raise HTTPException(422, "All approved objectives must be represented.")
    snapshot = {**current, "status": "published"}
    pid = db.execute(
        """INSERT INTO studio_publications(assessment_id,professor_id,topic_id,language,mode,snapshot,published_at)
                        VALUES (?,?,?,?,?,?,?)""",
        (
            aid,
            actor["id"],
            current["topic_id"],
            current["language"],
            current["mode"],
            json.dumps(snapshot, ensure_ascii=False),
            now(),
        ),
    ).lastrowid
    db.execute("UPDATE studio_assessments SET status='published' WHERE id=?", (aid,))
    return {"id": pid, "assessment_id": aid, "status": "published"}


def assign(db, actor, pid, sid):
    db.execute("BEGIN IMMEDIATE")
    publication = db.execute(
        "SELECT * FROM studio_publications WHERE id=? AND professor_id=?",
        (pid, actor["id"]),
    ).fetchone()
    if publication is None:
        raise HTTPException(404, "Published assessment not found.")
    session = db.execute("SELECT * FROM sessions WHERE id=?", (sid,)).fetchone()
    if session is None:
        raise HTTPException(404, "Tutoring session not found.")
    professor(db, actor, session["subject_id"])
    if (
        session["status"] != "upcoming"
        or not db.execute(
            "SELECT 1 FROM session_topics WHERE session_id=? AND topic_id=?",
            (sid, publication["topic_id"]),
        ).fetchone()
    ):
        raise HTTPException(
            422, "Choose an upcoming session covering this course topic."
        )
    if db.execute(
        "SELECT 1 FROM assessment_submissions s JOIN learning_checks c ON c.id=s.check_id WHERE c.session_id=?",
        (sid,),
    ).fetchone():
        raise HTTPException(
            409,
            "This session has submitted assessments. Assign to a new session to preserve every saved result.",
        )
    # Once assigned, keep that immutable snapshot, even before the first answer is submitted.
    if db.execute(
        "SELECT 1 FROM studio_check_sources x JOIN learning_checks c ON c.id=x.check_id WHERE c.session_id=?",
        (sid,),
    ).fetchone():
        raise HTTPException(
            409,
            "This session already has an immutable published assessment. Choose a new session.",
        )
    snapshot = json.loads(publication["snapshot"])
    mapping = {}
    for objective in snapshot["objectives"]:
        # Reuse equivalent objectives so assigning to several sessions does not duplicate history goals.
        existing = db.execute(
            "SELECT id FROM learning_objectives WHERE topic_id=? AND description=?",
            (publication["topic_id"], objective["description"]),
        ).fetchone()
        mapping[objective["id"]] = (
            existing[0]
            if existing
            else db.execute(
                "INSERT INTO learning_objectives(topic_id,description) VALUES (?,?)",
                (publication["topic_id"], objective["description"]),
            ).lastrowid
        )
    for stage in ("pre", "post"):
        old = db.execute(
            "SELECT id FROM learning_checks WHERE session_id=? AND stage=?",
            (sid, stage),
        ).fetchone()
        if old:
            cid = old[0]
            db.execute(
                "DELETE FROM answer_options WHERE question_id IN (SELECT id FROM assessment_questions WHERE check_id=?)",
                (cid,),
            )
            db.execute("DELETE FROM assessment_questions WHERE check_id=?", (cid,))
        else:
            cid = db.execute(
                "INSERT INTO learning_checks(session_id,stage) VALUES (?,?)",
                (sid, stage),
            ).lastrowid
        for item in snapshot["questions"]:
            q = item["content"]
            if q["stage"] != stage:
                continue
            qid = db.execute(
                "INSERT INTO assessment_questions(check_id,objective_id,prompt,explanation) VALUES (?,?,?,?)",
                (cid, mapping[q["objective_id"]], q["prompt"], q["explanation"]),
            ).lastrowid
            db.executemany(
                "INSERT INTO answer_options(question_id,label,is_correct) VALUES (?,?,?)",
                [
                    (qid, label, int(i == q["correct_index"]))
                    for i, label in enumerate(q["options"])
                ],
            )
        db.execute("INSERT INTO studio_check_sources VALUES (?,?)", (cid, pid))
    return {"session_id": sid, "publication_id": pid, "status": "assigned"}
