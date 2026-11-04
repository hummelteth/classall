# ClassAll

**Learning is a shared strength.** A local, synthetic Hack4Edu 2026 connected learning ecosystem using React/TypeScript/Vite, FastAPI and SQLite.

Phase 3 extends merged Version 2 (`55fe089`) without rebuilding the project or resetting its database. Peer tutoring, bookings/cancellation, curated Learning Checks, private progress, professor aggregates and David’s original contribution rules remain.

## What works

- Focused role navigation: learner learning space; tutor teaching/publishing with full learner access; professor courses, insights and support actions.
- Voluntary topic **Learning Pulse** with update/withdrawal, supportive matching suggestions and explicit open/matched/withdrawn support requests.
- Persistent **Study Groups**: subject/topic/date/availability filters, creation, joining, leaving, personal groups, creator editing/cancellation and real capacity checks. These are student-organized activities, separate from approved tutoring.
- **Tutor publishing** for approved subjects, immediate catalog visibility, host booking lists, safe edits and explicit cancellation of reservations.
- **Professor actions** for assigned courses: rationale, human confirmation, timestamped aggregate evidence, status, follow-up and notes. TA actions can publish faculty-organized sessions with an approved synthetic host, using the original catalog and booking service.
- Topic links connect reflection → support → booking/group → checks → aggregate evidence → faculty opportunity. Refresh preserves SQLite records and the selected demo role.
- Clear labels distinguish seeded synthetic examples, new demo interactions, peer tutoring and faculty-organized synthetic support. Online format has no meeting integration.
- Responsive layouts, semantic forms, keyboard-accessible controls, native booking dialogs and loading/retry/empty/error/success states.

The product recognizes **support needs**, not individual academic risk. Voluntary reflection, explicit demand and two-question check results are different evidence. Deterministic recommendations require human review; there is **no AI or machine learning**, automatic student contact or academic decision. Every person and observation is fictional. `X-Demo-User-Id` is **not authentication**. Do not expose this demo publicly or enter real student information.

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

Stop both local servers and back up `backend/data/classall.sqlite3` while stopped. Commit/stash your own source changes, fetch, and switch to `feature/classall-connected-learning` (after PR merge, use the updated `main`). From the project root:

```powershell
git fetch origin
git switch feature/classall-connected-learning
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

- [Architecture, initial audit, migrations, tables and new APIs](docs/CONNECTED_LEARNING.md)
- [Hack4Edu demonstration sequence](docs/HACK4EDU_DEMO.md)
- [Pilot and transferability](docs/PILOT_AND_TRANSFER.md)
- [Manual QA checklist](docs/DEMO_CHECKLIST.md)
- [Executed checks and limits](docs/TEST_REPORT.md)
- [Phase 3 delivery report](docs/PHASE3_REPORT.md)
- [Original Learning Check design](docs/LEARNING_INTELLIGENCE.md)

Original API routes remain compatible, including `/api/bookings`, checks/history, tutor overview and assigned-course `/api/insights`. See `/docs` or the architecture document for the full new endpoint inventory.

## Prototype limits and future work

Real identity, institutional authorization, multi-institution boundaries, tutor applications/professor approval reviews, moderation, production privacy, reviewed assessment instruments, attendance verification, backup operations and load testing are future work. The existing fictional tutor approvals are enforced now. There is no real early-warning model, grade ingestion, official accreditation, university endorsement, live video/chat, notifications, payments, LMS/calendar integration or offline synchronization. Faculty snapshot retention and differencing-resistant privacy need institutional review before any real-data pilot. Discovery and aggregation are optimized for a small local dataset, not measured institutional scale.

No real student data, public deployment, automated messages or paid integrations are used.
