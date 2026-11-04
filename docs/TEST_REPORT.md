# ClassAll MVP verification

Verified on **4 November 2026** with Python 3.12.14 and Node.js 24.22.1.

## Results

| Check | Result |
| --- | --- |
| `cd backend && python -m pytest -v` | **10 passed** |
| `npm test --prefix frontend` | **8 passed** across 2 test files |
| `npm run build --prefix frontend` | **Passed**: strict TypeScript validation and Vite production bundle |
| Python source compilation | **Passed** |
| Local SQLite initialization | **Passed**: 8 fictional people, 5 subjects, 8 sessions, 9 seeded booking records |

All 18 automated tests pass. No application errors remain in the tested flows.

## Backend coverage

- Startup, health, seed data, subjects and session details.
- Subject, format, topic/tutor search, malformed input and parameterized SQL behavior.
- Booking confirmation, reduced availability, own-booking listing and duplicate rejection.
- Cancellation, restored capacity, cancellation history and rebooking.
- Data survives constructing and starting a new API app against the same SQLite file; seeding remains idempotent.
- Demo-role rules, booking ownership, tutor self-booking rejection, and tutors learning in other subjects.
- Missing, completed, expired, full and unapproved sessions.
- Overlap with booked sessions or own teaching; adjacent non-overlapping sessions remain bookable.
- Two concurrent clients competing for the final seat: exactly one succeeds.
- Professor aggregates update after bookings and contain no individual learner records.

Tests use isolated temporary databases. The normal demonstration database remains freshly seeded.

## Frontend coverage

Seven React component tests in JSDOM cover:

- The landing page renders without API access.
- Bookmarked subject filters work.
- Subject, search and delivery filters work, including empty-state recovery.
- Booking detail → REST request → success → schedule → confirmed cancellation → cancelled history.
- Booking conflicts show the backend error and never show success.
- Learner, tutor and professor navigation, explicit demo labeling and honest roadmap states.
- Startup connection failure and successful retry.

One integration test starts an actual loopback FastAPI server and temporary SQLite database, renders the React application in JSDOM, and verifies:

1. Laura books the chain-rule session through the UI.
2. The backend stores a confirmed booking and reduces available capacity.
3. Switching to the professor shows the new count in the course capacity meter.
4. Switching back to Laura and cancelling through the UI restores capacity and shows cancelled history.

The integration test uses real HTTP and business logic. Its only fetch adapter resolves relative `/api` URLs to the temporary server and bridges JSDOM's abort signals into Node's implementation. It does not substitute API responses. It terminates its server and removes its temporary database.

## Build

Vite 6.4.5 successfully emits the local production bundle:

- HTML: approximately 0.70 kB.
- CSS: approximately 61.30 kB (13.57 kB gzip).
- JavaScript: approximately 324.96 kB (99.86 kB gzip).

Assets use system fonts, local SVG illustration and bundled icons. There are no runtime external image/font calls or frontend secrets.

## Verification limits and unresolved work

- Browser automation was unavailable in the execution environment. No screenshots, real-browser visual/responsive review, native dialog focus audit or accessibility audit were performed. JSDOM tests do not verify layout, CSS contrast or native dialog focus trapping. Use `DEMO_CHECKLIST.md` before presenting on the target device.
- The Vite development/preview proxy is configured for `/api` to `127.0.0.1:8000`, but was not exercised in a real browser. The integration test exercises the same React client against the Python API directly.
- pytest emits one upstream **DeprecationWarning** from Starlette's test client referencing AnyIO's `BlockingPortal` alias. Tests pass; this does not affect app startup or booking behavior.
- Only the Linux execution environment was tested. Windows and macOS startup instructions follow the standard Python/npm workflow and remain unverified on those operating systems.
- Demo identity is intentionally forgeable and must not be used as production authentication. No real student data should be entered.
- Session dates are fixed at first seed. Reset the local demonstration database when those dates have passed.
- Study groups, AI checks/qualification, session publishing, real approval workflows, attendance verification, institutional credentials, TA scheduling, meetings, email and payments are not implemented. The UI and README explicitly identify these limits.

No public deployment or paid service was activated. No browser preview server remains running.
