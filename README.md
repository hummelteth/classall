# ClassAll

**Learning is a shared strength.** A local Hack4Edu 2026 MVP built with React, TypeScript, Vite, Tailwind CSS, Python/FastAPI and SQLite.

The supplied *ClassAll — Complete Product & Experience Concept* was read before development. The repository initially contained only `# classall` in this README; there was no application to preserve. The user's requested technology and initial MVP scope take precedence over the document's proposed future features.

## What works

- Responsive landing page and dashboard, with a shared design system, custom local SVG illustration, mobile navigation and native session dialogs.
- Explicit **demo access** for Laura (learner), David (tutor) and Professor García. The selected demo role persists in the browser; it is **not authentication**.
- Catalog with subject filters, topic/tutor search, in-person/online format, availability filter and sorting. Subject links can be bookmarked (`/app/explore?subject=1`).
- Session details with subject, tutor, synthetic approval, objectives, time, duration, format, location and live seat counts.
- Real REST booking, persistent SQLite storage, confirmation, upcoming/past/cancelled booking views and cancellation with seat restoration.
- Backend protection against duplicate bookings, overbooking, overlaps with learning or teaching, host self-booking, expired/completed sessions and unapproved subjects. Capacity checks run inside a SQLite write transaction.
- Tutor schedule and illustrative engagement points from two **seeded completed sessions**. Tutors can also book someone else's tutoring.
- Professor view of current booking counts and capacity for the two assigned synthetic courses. New bookings and cancellations change these aggregates.
- Loading, retry, empty and booking-error states. The public landing page works with the API stopped.

## Requirements

- **Python 3.12+** (tested with 3.12.14), with `venv` and pip.
- **Node.js 22.12+** (tested with 24.22.1) and npm.
- Two terminal windows. No Docker, API keys, external services or university credentials required.

Run all commands from the extracted `classall` directory unless a command explicitly changes directories. On macOS/Linux, `python3` can be used wherever `python` appears below.

## Install

```sh
python -m venv .venv
```

Activate the environment:

```sh
# macOS / Linux
source .venv/bin/activate
```

```powershell
# Windows PowerShell
.venv\Scripts\Activate.ps1
```

Then install both parts:

```sh
python -m pip install -r backend/requirements.lock.txt
npm ci --prefix frontend
```

`backend/requirements.txt` records the direct dependencies. `requirements.lock.txt` pins the full tested dependency set; `frontend/package-lock.json` locks npm dependencies.

## Start locally

**Terminal 1 — API**, from the project root with the virtual environment activated:

```sh
python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
```

**Terminal 2 — frontend**, from the project root:

```sh
npm run dev --prefix frontend
```

Open **http://127.0.0.1:5173**. If Vite prints a different port because 5173 is occupied, use that printed URL.

- Landing: `http://127.0.0.1:5173/`
- Demo workspace: `http://127.0.0.1:5173/app`
- API health: `http://127.0.0.1:8000/api/health`
- Interactive API documentation: `http://127.0.0.1:8000/docs`

The SQLite database is created and seeded automatically at **`backend/data/classall.sqlite3`** during API startup. Restarting the API preserves bookings and does not duplicate seed data. Dates are seeded relative to the first initialization: six future sessions, two completed sessions, five subjects and eight fictional people. Session timestamps are stored in UTC and displayed in the browser's time zone.

Both services bind to loopback. No public deployment is configured. Stop each service with **Ctrl+C**.

### Local production build

With the API still running:

```sh
npm run build --prefix frontend
npm run preview --prefix frontend
```

Open the URL printed by Vite (normally `http://127.0.0.1:4173`). The preview configuration also proxies `/api` to the Python API. Opening `dist/index.html` as a file will not work; use a server.

## Two-minute demonstration

1. Open the landing page and choose **Find your learning community**.
2. Leave **Demo access → Learner** selected; this is fictional Laura Martín.
3. Open **Find tutoring**, try the Mathematics filter and open **Make sense of the chain rule**.
4. Choose **Book a free seat**. The success screen appears only after the API confirms the database write.
5. Choose **See my sessions**. Refresh the page to demonstrate persistence.
6. Switch to **Professor**. Mathematics' confirmed booking count includes Laura's new booking; no learner names are shown.
7. Switch to **Tutor**. David's schedule shows the new seat count. His 40 illustrative points are from seeded completed sessions, not this new booking.
8. Switch back to **Learner**, open **My sessions**, choose **Cancel booking**, and confirm. The seat becomes available again; the booking moves to **Cancelled**.

## Test

Install both sets of dependencies first, then from the project root:

```sh
# Backend tests (temporary, isolated SQLite databases)
cd backend
python -m pytest -v
cd ..

# React tests plus a real HTTP integration test
npm test --prefix frontend

# TypeScript validation and production bundle
npm run build --prefix frontend
```

The frontend integration test launches its own temporary FastAPI subprocess on a free **loopback** port, drives the React UI in JSDOM, verifies persisted bookings and professor counts, cancels through the UI, and stops the subprocess. It does not touch your demo database. It uses `.venv/bin/python` on macOS/Linux and `.venv/Scripts/python.exe` on Windows. For a different virtual environment, set `CLASSALL_PYTHON` to its absolute Python executable path before testing.

See [docs/TEST_REPORT.md](docs/TEST_REPORT.md) for exact results and verification limits. Browser screenshots, responsive visual inspection and native dialog focus/keyboard behavior still require manual browser checks; JSDOM cannot establish those.

## Reset the demo

Only reset when you want to discard **all local demo bookings and history**. Stop the API first, then run from the project root:

```sh
python -c "from pathlib import Path; p=Path('backend/data/classall.sqlite3'); p.unlink(missing_ok=True)"
```

Restart the API. A fresh synthetic database is seeded with new upcoming dates. The app does not move session dates on every startup: if the catalog becomes empty after the original dates pass, reset it intentionally. The role preference can be reset by choosing **Learner** in the UI.

You can select another database path before API startup:

```sh
# macOS / Linux example
CLASSALL_DB_PATH=/absolute/path/to/demo.sqlite3 python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000
```

There is deliberately no unauthenticated reset API endpoint.

## Architecture

```text
classall/
├── frontend/
│   ├── src/
│   │   ├── pages/             # Learner, catalog, schedule, tutor, faculty, impact, groups
│   │   ├── components/        # Shell, cards, booking dialog, shared UI and illustration
│   │   ├── lib/               # Typed REST client, demo context, booking helpers, types
│   │   ├── App.tsx            # Routes
│   │   ├── Landing.tsx        # Backend-independent public page
│   │   └── *.test.tsx         # Component and real API integration tests
│   ├── vite.config.ts        # React, Tailwind, test setup, /api proxy
│   └── package-lock.json
├── backend/
│   ├── app/
│   │   ├── main.py            # App factory, API routes and demo role guards
│   │   ├── schemas.py         # Validated API input/output contracts
│   │   ├── booking_service.py # Transactional booking/cancellation rules
│   │   ├── repository.py      # Parameterized queries and record serialization
│   │   ├── db.py              # Schema and connection lifecycle
│   │   └── seed.py            # Synthetic personas, approvals, courses and sessions
│   ├── data/                 # Generated SQLite database (gitignored)
│   └── tests/                # Real service/database tests, including concurrency
└── docs/
```

The frontend uses relative `/api` requests. Vite forwards them to `http://127.0.0.1:8000`, so frontend and backend remain separate and no permissive CORS configuration is needed. A different hosting setup must supply an equivalent reverse proxy. The UI has no client secrets, remote fonts, trackers or external image dependencies.

### REST endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Database readiness and synthetic-demo status |
| GET | `/api/demo-users` | The three selectable synthetic personas |
| GET | `/api/subjects` | All synthetic university subjects |
| GET | `/api/sessions` | Upcoming sessions; optional `subject_id`, `q`, `delivery` |
| GET | `/api/sessions/{id}` | Full session details and current seats |
| GET | `/api/bookings` | Selected demo user's bookings |
| POST | `/api/bookings` | Reserve a seat; JSON `{"session_id": 1}` |
| POST | `/api/bookings/{id}/cancel` | Cancel own upcoming booking; idempotent |
| GET | `/api/tutor/overview` | Tutor's upcoming teaching, approvals and seeded contribution metrics |
| GET | `/api/insights` | Professor's assigned-course booking/capacity aggregates |

Persona-specific endpoints require `X-Demo-User-Id`: `1` (Laura), `2` (David), or `3` (professor). This is an intentionally forgeable local demo selector, **not identity verification or production authorization**. Role and ownership checks demonstrate business rules only.

Example with the API running:

```sh
curl http://127.0.0.1:8000/api/subjects
curl -X POST http://127.0.0.1:8000/api/bookings -H 'Content-Type: application/json' -H 'X-Demo-User-Id: 1' -d '{"session_id":1}'
```

## Deliberately incomplete

- Real sign-in, verified university membership, production access control and multi-university support.
- Session publishing/editing, real tutor applications, instructor approval decisions and attendance verification. Approval badges refer only to the seeded fictional dataset.
- AI qualification, learning checks, recommendations, early-warning models or individual academic alerts. Booking counts are not evidence of learning difficulty.
- Working study groups, messaging, moderation, faculty TA scheduling and calendar/email invitations.
- Assessed competencies, verified new contribution points, certificates, credit, rewards or portfolio export. The tutor portfolio is illustrative.
- Online meeting links, real campus reservations, payments, LMS integrations and offline support.
- Automated accessibility audit or visual testing in a browser. Responsive styles and accessible controls are implemented but still need device review.

Future features are labeled in the UI and have no misleading submit/join/generate actions. New points are not awarded merely for bookings. There are no forms that solicit real student information, and no paid services or public hosting were activated.
