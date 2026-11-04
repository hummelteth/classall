# Phase 3 verification

Executed on **4 November 2026** in Linux with Python 3.12.14, Node.js 24.22.1 and real system Chromium. Baseline was merged Version 2 (`55fe089`): **28 backend + 12 frontend = 40 passing tests**.

## Final results

| Executed check | Result |
| --- | --- |
| `cd backend && python -m pytest -q` | **58 passed** |
| `npm test --prefix frontend` | **13 passed** across 3 files |
| `npm run build --prefix frontend` | **Passed**, strict TypeScript + Vite production build |
| `CLASSALL_CHROMIUM=/usr/bin/chromium npm run test:browser --prefix frontend` | **Passed**, real Chromium → Vite proxy → FastAPI → temporary SQLite |
| Browser layout matrix | **54 role/route/viewport combinations passed**, 390/768/1440px, no horizontal overflow or error alerts |
| Additional mobile forms | Group creation and professor action creation at 390px passed overflow checks |
| Browser page errors | **0** in the complete journey and layout matrix |
| `git diff --check` | Passed |

**71 backend/React tests pass**, plus the separate browser runner. The 40 original cases remain; role-navigation assertions now require professor-specific links and the existing Learning Check integration opens the dedicated insights page before inspecting its unchanged assessment behavior. One new HTTP/React integration covers the connected journey. Playwright is a development-only dependency; it does not enter the application bundle.

## What was exercised

Backend coverage retains booking/cancellation, overlap, ownership, last-seat races, scoring, duplicate submissions, private history, independent assessment suppression, matched comparisons and the frozen MVP migration fixture. New coverage verifies:

- Pulse creation/update/withdrawal, one learner counted once, privacy, small-group suppression and invalid topics/responses.
- Explicit request persistence, duplicates, ownership, independent suppression, booking/group matching and reopening on cancellation/leave/topic changes.
- Group creation/edit/join/leave/cancel, creator membership/counts, concurrent last-place competition, ownership, filters, past/invalid dates, time-zone requirement and bounded fields.
- Approved tutoring publication, catalog and curated checks, booking, host overlap, unapproved subjects, safe/unsafe edits, topic changes before history, cancellation and attendee-list permissions.
- Professor assignments and cross-professor ownership, mandatory human confirmation, status transitions, partial updates preserving notes/date, evidence snapshots and restart persistence.
- Faculty organizer/host separation, approved-host restrictions, linked action/catalog/tutor schedule, real learner booking, fixed triggering topic and explicit cancellation.
- Migration idempotence, foreign-key integrity and preservation of original/new records; additive fresh examples without moving old dates; no unearned tutor points.

Three real-HTTP React tests use temporary servers/databases: original booking/count/cancel; original pre/post/progress/suppression; and new Pulse/request/group/publishing/booking/professor/faculty flow. Other React tests retain connection recovery, filters, empty states and error handling. A form-readiness test race found during parallel checks was corrected by awaiting the loaded form label.

The separate Chromium runner verifies Pulse/request refresh, group join/dashboard/leave, group create/edit/cancel, approved tutor publication, booking with native dialog keyboard Tab/Escape, pre/post checks and saved-result refresh, human-confirmed professor action, faculty publication, host schedule and learner reservation. It then visits 18 role-specific routes at each of three widths and operates every role’s mobile navigation. It also opens student/professor forms at mobile width. Browser captures were visually inspected for representative desktop dashboards and the mobile group form. This is not a complete visual regression or accessibility audit.

The final production bundle is approximately 72.20 kB CSS (15.81 kB gzip) and 371.22 kB JavaScript (111.79 kB gzip), with no runtime external fonts/images or AI service.

## Reproduce and limits

Use README installation/tests. Browser runner selects free loopback ports, uses a separate temporary SQLite file, stops its processes and removes the test database. Screenshots and service logs go to gitignored `work/browser-qa/`; no real student data or normal demonstration history is touched. `CLASSALL_PYTHON` and `CLASSALL_CHROMIUM` select alternate local executables.

Sandboxed environments must allow loopback sockets for FastAPI/TestClient, Vite and Chromium. Initial runs without that capability failed or stalled; the reported successful runs used the supported network-enabled execution profile. No external notification, paid service or public deployment was enabled.

pytest reports one upstream Starlette/AnyIO `BlockingPortal` deprecation warning. It does not fail tests. Windows execution, Firefox/Safari, full keyboard/screen-reader coverage, WCAG contrast audit, real-device low-resource performance, institutional load and production privacy/security verification remain **manual or future work**. See DEMO_CHECKLIST.md. Passing local demo tests does not establish production identity protection or privacy.


## V5 regression and complete core experience (4 November 2026)

V5 adds 9 backend journey/integrity tests (107 backend tests total) and a fifth React/HTTP/SQLite integration journey (22 frontend tests total). TypeScript and production build pass. The original Chromium connected-learning and Spanish Studio suites pass, as do complete English and Spanish V5 journeys at 1440, 768 and 390px. Tests include migration preservation of every V4 record, an immutable publication and user-created group; duplicate/concurrent attendance; subject/faculty ownership; and private feedback suppression.

See [V5_IMPLEMENTATION_REPORT.md](V5_IMPLEMENTATION_REPORT.md) for exact commands, results, warnings and limits. Live Ollama is mocked where needed; Windows/GPU inference was not retested. No public deployment or normal database reset was performed.
