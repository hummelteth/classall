# ClassAll Phase 3 delivery report

Implemented in `hummelteth/classall`, starting from merged Version 2 `55fe089`, on `feature/classall-connected-learning`. This extends the existing application and data model. No public deployment or automatic merge is part of this delivery.

## Implemented

Role-specific navigation and focused dashboards share the original warm visual identity. Learners have Pulse, contextual support suggestions, explicit requests and functional study circles. Approved tutors can publish/manage tutoring and inspect their own bookings while remaining learners themselves. Assigned professors can review separate aggregate signals, confirm support actions and publish synthetic faculty-organized sessions with an approved host.

Study Groups support filters, creation, joining/leaving, personal groups, safe editing, cancellation and real capacity. Tutor publishing validates subject approval, event fields and schedule conflicts. Faculty offerings keep the professor organizer separate from the tutor host and use the existing catalog/reservation implementation. Actions retain rationale, status, notes, follow-up and a reproducible timestamped aggregate snapshot. Cross-links and dashboard counts connect the learning cycle. Seeded examples and demo interactions are labeled, with an explicit additive fresh-example command for expired dates.

## Preserved

The original eight synthetic personas, five subjects, tutor approvals, sessions, bookings and dates are retained. Learning Checks still score server-side, persist answers/explanations, support before/after review and use independent small-group suppression. Personal history stays private; professor access stays assigned-course only. Booking/cancellation/overlap rules and contribution points remain: David’s two original completed sessions still produce 40 illustrative points. New publication, participation, booking and completion simulation do not award points.

## Data and API additions

Seven additive tables: `connected_migrations`, `learning_pulses`, `support_requests`, `study_groups`, `group_memberships`, `session_details`, `support_actions`. They reference existing user/topic/subject/session entities. Legacy table columns were not changed. Versioned migration/seed logic is repeatable, and preservation/foreign-key tests pass.

New APIs cover `/api/pulses`, `/api/support-requests`, topic support suggestions, `/api/groups` and membership operations, session publishing/edit/cancel and host booking lists, `/api/professor/signals`, approved hosts, `/api/support-actions`, action updates and faculty session publication. Existing session responses add topic/kind/organizer/source metadata, and discovery supports a topic filter. Full method/path contracts and rules are in [CONNECTED_LEARNING.md](CONNECTED_LEARNING.md) and local FastAPI `/docs`.

## Functional journeys

1. Laura records/updates/withdraws a voluntary topic Pulse and requests support. Matching tutoring, groups and practice objectives appear; refresh preserves her current records.
2. Laura creates or joins a group, sees it in her home/personal groups, leaves and restores its place. Creator editing/cancellation and capacity restrictions are enforced server-side.
3. David publishes approved Mathematics tutoring. Laura finds/books it and completes/reviews persistent curated pre/post Learning Checks. David sees the reservation.
4. Professor García reviews separate Pulse/demand/check evidence, confirms an assigned-topic action and organizes a synthetic TA-led session with approved David. It appears in the shared catalog, David’s teaching and the professor’s action schedule. Laura can book it through the original service.
5. Explicit cancellation preserves records/checks, cancels reservations visibly and reconciles matched requests. Status/follow-up and dashboard changes persist after restart.

## Verification

- **58 backend tests passed.**
- **13 React tests passed**, including three real FastAPI/SQLite HTTP integration tests.
- **TypeScript and production build passed.**
- **Real Chromium journey passed**, including native dialog Tab/Escape, persistence and faculty booking.
- **54 role/route/viewport checks passed** at 390, 768 and 1440px, plus mobile group/action forms and mobile menu checks. No horizontal overflow or page errors were observed.
- All 40 original cases remain, with navigation assertions adjusted for the intentionally redesigned UI. The new work adds 30 backend cases and one React integration case.

[TEST_REPORT.md](TEST_REPORT.md) distinguishes executed checks from manual review. Automated tests use isolated temporary databases and do not reset the demonstration database. Windows, comprehensive screen-reader/contrast testing, Firefox/Safari and institutional performance/security testing remain unverified. One upstream Starlette/AnyIO deprecation warning remains.

## Limits, responsibility and future work

Demo identities are forgeable header selections, not real authentication. Three-person suppression is illustrative and insufficient for production privacy, particularly across changing aggregates and stored snapshots. No real academic records are ingested; Pulse is voluntary reflection, requests are demand, and short checks are limited answer evidence. Recommendations are deterministic educational decision support, not AI. No ranking, individual risk labeling, automated contact, academic decision, causal effect, qualification or university endorsement is claimed.

Tutor application/professor approval reviews are deliberately deferred; the established fictional approvals are enforced end-to-end. Real identity/enrollment, institutional boundaries, moderation, privacy governance/retention, attendance, reviewed assessments, backups and scale testing remain future work. There is no live video/chat, notifications, payments, LMS/calendar integration or offline sync. The pilot proposal makes no invented customer, partnership, outcome or financial claim.

See [PILOT_AND_TRANSFER.md](PILOT_AND_TRANSFER.md) for a proposed low-resource institutional pilot and [HACK4EDU_DEMO.md](HACK4EDU_DEMO.md) for the presentation sequence.

## Updating and testing on Windows

Stop the local API/frontend and back up the SQLite file while stopped. Preserve local source changes before switching branches. From the repository root:

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

Then start the API in one terminal and frontend in another:

```powershell
python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
```

```powershell
npm run dev --prefix frontend
```

Open `http://127.0.0.1:5173/app`. Migrations run automatically; do not delete the old database. If needed, append current synthetic examples with `cd backend; python -m app.demo --add-examples` (separate commands are also shown in README). To execute Chromium verification, run `npx playwright install chromium` from `frontend`, then `npm run test:browser --prefix frontend` from the root. Set `CLASSALL_PYTHON` for a nonstandard virtual environment. The Windows procedure is documented but was not executed on a Windows host.
