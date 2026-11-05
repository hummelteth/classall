# ClassAll

**Learning is a shared strength.** A local, synthetic Hack4Edu 2026 connected learning ecosystem using React/TypeScript/Vite, FastAPI and SQLite.

**V6 experience design** builds on merged V5: three visible learning pillars, grouped role navigation, accessible primary actions, guided applications and faculty review, a visual contribution portfolio, topic-grouped learning history and a simpler six-stage Studio. EN/ES layouts were inspected at 1440, 768 and 390px. See the [design report and screenshots](docs/V6_DESIGN_REPORT.md), [bilingual 6–7 minute demo guide](docs/V6_DEMO.md) and [QA report](docs/V6_QA_REPORT.md). The optional guided demo navigates real application screens; it does not complete actions.

**Silent product video:** the separate [video production workflow](docs/VIDEO_PRODUCTION.md) records a real Spanish UI journey into eight adjustable scenes and assembles a 169-second silent 1080p MP4. See the [Spanish narration worksheet](docs/VIDEO_STORYBOARD_ES.md) and [production QA](docs/VIDEO_QA_REPORT.md). Every take uses a fresh isolated presentation database; normal application data is preserved.

Version 5 extends V4 (`0f0a8d2`) with subject-specific tutor applications, human approval, explicitly synthetic two-party attendance, an idempotent contribution ledger, constructive feedback and a private portfolio. V4 bilingual learning, local AI Studio, professor publications, groups and faculty support actions remain. Existing SQLite records and David’s 40 historical synthetic points are preserved.

## What works

- **Become a Tutor / Hazte tutor** for every student: subject/topic selection, motivation, experience, teaching plan, prepared bilingual knowledge questions and an explanation task. Students remain learners while gaining subject-specific teaching permissions.
- **Professor review**: assigned subjects only, saved responses, advisory prepared checklist or optional local AI draft, comments, request changes, revision/resubmission, approval or rejection with an audit history. Approval grants backend publishing permission for that subject.
- **Attendance → recognition**: host proposes attendance against actual confirmed bookings; each learner separately confirms fictional participation. The first eligible confirmation completes the session and adds one durable award (20 points by default). Refreshes and repeated confirmations do not duplicate awards. The older Learning Check simulation never awards points.
- **Constructive feedback and private portfolio**: three short teaching-experience ratings, learner-only private comments, tutor summaries after three distinct learners, labeled historical and new synthetic contributions, documented hours/topics and carefully qualified suggested strengths. No leaderboard, credits or certificates.
- **Separate presentation database**: an exclusive-create initializer starts David without current Mathematics approval while preserving the normal database. Repeat in a new rehearsal directory. Follow [the 6–7 minute English/Spanish guide](docs/V5_DEMO.md).

- **English/Spanish UI**: instant EN/ES switching in both headers, locally saved preference, localized dates, translated navigation, forms and explanations. Original user-authored content retains its language.
- **Professor AI Learning Studio**: local PDF upload → source analysis → small pre/post question batches → individual review → immutable publication → assignment to tutoring sessions.
- **Local Ollama** through FastAPI only, structured JSON and Pydantic validation, explicit connection status and an honestly labelled bilingual offline example. No API keys or external AI services.

- Focused role navigation: learner learning space; tutor teaching/publishing with full learner access; professor courses, insights and support actions.
- Voluntary topic **Learning Pulse** with update/withdrawal, supportive matching suggestions and explicit open/matched/withdrawn support requests.
- Persistent **Study Groups**: subject/topic/date/availability filters, creation, joining, leaving, personal groups, creator editing/cancellation and real capacity checks. These are student-organized activities, separate from approved tutoring.
- **Tutor publishing** for approved subjects, immediate catalog visibility, host booking lists, safe edits and explicit cancellation of reservations.
- **Professor actions** for assigned courses: rationale, human confirmation, timestamped aggregate evidence, status, follow-up and notes. TA actions can publish faculty-organized sessions with an approved synthetic host, using the original catalog and booking service.
- Topic links connect reflection → support → booking/group → checks → aggregate evidence → faculty opportunity. Refresh preserves SQLite records and the selected demo role.
- Clear labels distinguish seeded synthetic examples, new demo interactions, peer tutoring and faculty-organized synthetic support. Online format has no meeting integration.
- Responsive layouts, semantic forms, keyboard-accessible controls, native booking dialogs and loading/retry/empty/error/success states.

The product recognizes **support needs**, not individual academic risk. Voluntary reflection, explicit demand and two-question check results are different evidence. Deterministic support recommendations require human review. Local AI proposes educational drafts only; it does not contact students or make academic decisions. Every person and observation is fictional. `X-Demo-User-Id` is **not authentication**. Do not expose this demo publicly or enter real student information.

## Install and run

Requires Python 3.12+, Node.js 22.12+ and npm. Tested on Linux with Python 3.12.14 and Node 24.22.1; Windows instructions use the existing Python/Node setup and have not been executed on Windows.

From the repository root:

```sh
python -m venv .venv
```

Activate with `source .venv/bin/activate` (macOS/Linux) or `.venv\Scripts\Activate.ps1` (Windows PowerShell), then:

```sh
python -m pip install -r backend/requirements.lock.txt
npm ci --prefix frontend
```

Terminal 1 (virtual environment active):

```sh
python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
```

Terminal 2:

```sh
npm run dev --prefix frontend
```

Open **http://127.0.0.1:5173/app** (or Vite’s printed port). The landing page is `/`; API health is `http://127.0.0.1:8000/api/health` and interactive API documentation is `/docs` on the API port. Both servers bind to loopback. Stop them with Ctrl+C.

The default database is `backend/data/classall.sqlite3`. Startup performs additive, repeatable migrations and seeds only missing versioned example data. Existing bookings, submissions, history and dates are preserved. **Do not delete an existing database to upgrade.** All event timestamps use UTC storage and the browser’s local display time zone; the group date filter explicitly uses a UTC day.

### Update an existing Windows installation

Stop both local servers and back up `backend/data/classall.sqlite3` while stopped. Commit/stash your own source changes, fetch, and switch to `feature/classall-v6-experience-design` (after PR merge, use the updated `main`). From the project root:

```powershell
git fetch origin
git switch feature/classall-v6-experience-design
git pull --ff-only
.venv\Scripts\Activate.ps1
python -m pip install -r backend/requirements.lock.txt
npm ci --prefix frontend
cd backend
python -m pytest -q
cd ..
npm test --prefix frontend
npm run build --prefix frontend
```

Restart the API and frontend using the commands above. The migration runs automatically. Existing environment variables and custom database paths should remain in place. If PowerShell activation is restricted, use `.venv\Scripts\python.exe` directly instead of changing system-wide execution policy.

### Keep examples useful without resetting history

Examples use dates relative to initial creation. If they have expired, explicitly append fresh synthetic opportunities:

```sh
# With the virtual environment active, from the repository root
cd backend
python -m app.demo --add-examples
cd ..
```

This fills missing future example groups and Mathematics/Statistics tutoring, preserving old records and dates. Repeating it while suitable examples exist adds nothing. Real demo interactions are never relabeled. There is no reset API.

For a separate rehearsal database, set `CLASSALL_DB_PATH` before starting the API:

```powershell
$env:CLASSALL_DB_PATH = "C:\path\to\rehearsal.sqlite3"
```

On macOS/Linux use `CLASSALL_DB_PATH=/path/to/rehearsal.sqlite3 python -m uvicorn ...`. Never reset a database that contains history you want to retain.

## Test and build

```sh
# Virtual environment active
cd backend
python -m pytest -q
cd ..
npm test --prefix frontend
npm run build --prefix frontend
```

Frontend integration tests launch temporary FastAPI/SQLite instances and drive React through real HTTP in JSDOM. Set `CLASSALL_PYTHON` to an absolute Python executable if you use a different virtual environment. Tests do not touch the normal database.

For real Chromium testing, install its browser once:

```sh
cd frontend
npx playwright install chromium
cd ..
npm run test:browser --prefix frontend
```

The browser runner starts its own isolated API, Vite server and temporary SQLite database on free loopback ports, runs all roles and the connected journey, checks 390/768/1440px layouts and stops its services. Screenshots/logs go to gitignored `work/browser-qa/`. To use an installed Chromium, set `CLASSALL_CHROMIUM` to its executable. `CLASSALL_API_TARGET` is an optional Vite proxy override used by the isolated runner; the default remains port 8000.

For a local production preview with the API running:

```sh
npm run build --prefix frontend
npm run preview --prefix frontend
```

Open Vite’s printed URL (normally port 4173). Do not open `dist/index.html` directly.

## Rules worth knowing

- Groups include the creator as one member. With other members, only title, description and capacity can change. The creator cancels rather than leaving.
- Tutors publish only in their approved subjects. With confirmed bookings, only text/objectives or increased capacity can change. Topic stays fixed after any booking history. Explicit cancellation marks reservations cancelled while retaining history and saved checks.
- Faculty must own the action and supervise its topic. Host approval is checked separately. Faculty organizer and tutor host are distinct; hosts cannot change faculty offerings. A faculty action’s topic stays fixed.
- Support requests match when their owner books/joins corresponding support; leaving/cancelling reopens them if no matching reservation remains. A match is not attendance or proof of improvement.
- Latest active Pulse responses count once per learner/topic. Pulse distributions and open-request counts are suppressed independently below three. Existing Learning Check suppression remains. The threshold is illustrative and **not production-ready privacy protection**.
- Publishing, group participation, bookings and demo completion do not award tutor points. The original two completed synthetic sessions still give David 40 illustrative points.

## Documentation

- [V5 implementation and test report](docs/V5_IMPLEMENTATION_REPORT.md)
- [V5 guided presentation in English and Spanish](docs/V5_DEMO.md)
- [Architecture, initial audit, migrations, tables and new APIs](docs/CONNECTED_LEARNING.md)
- [Hack4Edu demonstration sequence](docs/HACK4EDU_DEMO.md)
- [Pilot and transferability](docs/PILOT_AND_TRANSFER.md)
- [Manual QA checklist](docs/DEMO_CHECKLIST.md)
- [Executed checks and limits](docs/TEST_REPORT.md)
- [Phase 3 delivery report](docs/PHASE3_REPORT.md)
- [Original Learning Check design](docs/LEARNING_INTELLIGENCE.md)

Original API routes remain compatible, including `/api/bookings`, checks/history, tutor overview and assigned-course `/api/insights`. See `/docs` or the architecture document for the full new endpoint inventory.

## Prototype limits and future work

Real identity, institutional authorization, multi-institution boundaries, moderation, production privacy, validated assessment instruments, independent attendance verification, backup operations and load testing are future work. V5 application review and explicitly synthetic attendance are functional local demonstrations. The existing fictional tutor approvals are enforced now. There is no real early-warning model, grade ingestion, official accreditation, university endorsement, live video/chat, notifications, payments, LMS/calendar integration or offline synchronization. Faculty snapshot retention and differencing-resistant privacy need institutional review before any real-data pilot. Discovery and aggregation are optimized for a small local dataset, not measured institutional scale.

No real student data, public deployment, automated messages or paid integrations are used.

## V5 presentation and validation

The normal database upgrades automatically with additive tables. Do not reset it. To demonstrate David applying for Mathematics, create a **new dedicated database** with `python -m app.presentation --database work/rehearsal-01/classall-v5-presentation.sqlite3` (set `PYTHONPATH=backend` first), then start the API with `CLASSALL_DB_PATH` pointing to that file. The initializer refuses existing files and the normal database. Use a new directory for each replay; there is no destructive reset command.

`CLASSALL_CONTRIBUTION_POINTS` configures future synthetic session awards (default 20, bounded 1–1000). Existing awards retain their stored values. Scores, publishing, bookings, the Learning Check simulation and feedback never award points.

In addition to the existing backend/frontend/build checks, run:

```sh
npm run test:browser:v5 --prefix frontend
npm run test:browser:v5:es --prefix frontend
```

Both use a new isolated presentation database, real HTTP and Chromium. The original `test:browser` suite still checks V4 connected learning and Studio. To use installed Chromium, set `CLASSALL_CHROMIUM`; otherwise install it through Playwright as above.

See [V5 implementation, tests and remaining limits](docs/V5_IMPLEMENTATION_REPORT.md) and [V5 bilingual guided presentation](docs/V5_DEMO.md). Actual Windows/GPU/Ollama inference was not retested in Cloud.



## Version 4: Windows + Ollama

The target is the user's existing Windows Ollama installation (reported 0.40.14),
`qwen3:8b`, 4096-token context, Intel Arc 140V, approximately 31.5 GB RAM. The
reported GPU utilization and approximately 18 tokens/second are user observations,
**not measurements made in Codex Cloud**. Real Windows/GPU verification remains outstanding.

In PowerShell, check the installed model and local service:

```powershell
ollama --version
ollama list
ollama show qwen3:8b
Invoke-RestMethod http://127.0.0.1:11434/api/tags
```

If the existing Ollama tray application is not running, run `ollama serve` in a
separate terminal. Do not run a second server when the tray service already owns
port 11434. If `qwen3:8b` is absent, explicitly install it with `ollama pull qwen3:8b`.

Set optional configuration **in the backend terminal**, then launch the servers
using the install/run commands above:

```powershell
$env:OLLAMA_BASE_URL = "http://127.0.0.1:11434"
$env:OLLAMA_MODEL = "qwen3:8b"
$env:OLLAMA_THINKING = "false"
$env:OLLAMA_CONTEXT_LIMIT = "4096"
$env:OLLAMA_OUTPUT_LIMIT = "1800"
$env:OLLAMA_TIMEOUT = "180"
$env:OLLAMA_TEMPERATURE = "0.2"
$env:CLASSALL_AI_DEMO = "false"
.venv\Scripts\python.exe -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000
```

Configuration is read from the process environment at startup; `.env` files are not
automatically loaded. Defaults are the values shown above. Timeout allows 1–600
seconds, context 2048–16384, output 512–half the context, temperature 0–2. The
server rejects remote/nonlocal Ollama addresses and user requests cannot set a
provider URL. `localhost`, loopback IPs and `host.docker.internal` are supported;
this prototype is intended to run both processes directly on the same Windows machine.

`CLASSALL_AI_DEMO=true` disables live generation and clearly labels prepared mode.
The prepared-example button also works when this flag is false and Ollama is down.
It never silently substitutes a prepared answer for a failed live request.

### PDF extraction and review

Professor demo access is restricted to assigned courses. Uploads must be PDFs,
up to **8 MB and 40 pages**. `pypdf` extracts text in Python, splits each page into
900-character passages, and retains stable passage IDs, page numbers, original
PDF bytes and a SHA-256 digest in the local SQLite database. Filenames are labels,
not filesystem paths. Encrypted, unreadable, scanned-only and excessively complex
PDFs produce recovery messages. There is no OCR. Formula-heavy PDFs may lose
symbols or reading order; always inspect extracted text. Long documents should
be uploaded as shorter chapters. Select one short passage initially; at most three
passages (2700 characters) are permitted, with a further conservative prompt budget.
A large selection can require reducing the batch or source context.

Analyze proposes editable topics, concepts, objectives and summaries. Check and
approve the objectives before live generation. Select the existing course topic,
approved objectives, English/Spanish content language, difficulty and 1–3 questions
**per stage**. The Studio produces both stages so coverage/difficulty can be checked
as a pair. Start with one objective and one question per stage on the local model.
Structured validation checks count, unique options, one correct index, distinct
pre/post wording, matched objective coverage/difficulty, language, and existing
source IDs. This does not establish academic correctness or psychometric validity.
Document instructions are treated as untrusted evidence in a delimited JSON field.

Inspect every source passage, edit questions/options/correct answer/explanation,
reject unsuitable questions or approve each one. Edits reset approval. All items
must be reviewed before the explicit complete-pair publication. Published versions
are immutable; **Create new draft revision** copies content into a new unreviewed
assessment, leaving published and already-submitted content unchanged.

### How approved content reaches Learning Checks

After publishing, choose an upcoming session of the same course/topic and assign
the pair. Only the assigned demo professor can do this. Assignment is transactional
and copies the immutable snapshot into the original `learning_checks`,
`assessment_questions` and `answer_options` structures, with publication provenance.
Sessions with any submitted assessment or an existing Studio assignment cannot be
reassigned. Choose a new tutor-published or faculty-organized session for new
content. The demo's original chain-rule session has historical answers, so it is
intentionally protected.

Students book normally and open the original pre/post check routes. Backend scoring,
post-session readiness, simulation labels, history and aggregate suppression remain.
No correct answers or explanations appear before the corresponding submission;
locked post checks also withhold their questions. The interface shows course/topic,
content language and professor-reviewed provenance. Published content retains its
approved language when the interface changes. Original curated questions remain the
fallback for unassigned sessions, with equivalent English/Spanish versions selected
by interface language. Existing IDs, answer ordering and stored responses remain.

### Offline presentation and Windows verification

The original, redistributable example is [docs/demo/chain-rule.pdf](docs/demo/chain-rule.pdf).
Its prepared English/Spanish topics, objectives and four questions are in
`backend/app/studio_demo.py`. Loading them creates drafts only and never clears
bookings, groups, Pulse, session dates or learning history.

Follow the [bilingual demonstration and real Windows verification procedure](docs/V4_DEMO.md).
See the [implementation, API, database and test report](docs/V4_IMPLEMENTATION_REPORT.md).

Remaining limits: fictional role headers are not authentication; local SQL/PDF data
is not encrypted at rest; there is no multi-tenant isolation, OCR, malware sandbox,
durable generation job queue, automatic semantic verification or tutor certification.
Generation is a bounded synchronous backend worker request with a responsive browser
progress state. Leaving the page aborts the browser request but may not stop inference
already running in Ollama. Failed/truncated output is rejected, not partially published.
Keep both servers bound to loopback. No public hosting or deployment is included.
