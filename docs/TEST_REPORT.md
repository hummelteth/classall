# ClassAll Phase 2 verification

Verified on **4 November 2026**, using Python 3.12 and Node.js 24.22.1. The starting implementation is merged MVP `90cbeb1`; its 18 tests remain present and pass.

## Final results

| Check | Result |
| --- | --- |
| `.venv/bin/python -m pytest -q backend` | **28 passed** (10 existing + 18 new cases) |
| `npm test --prefix frontend` | **12 passed** (8 existing + 4 new tests) |
| `npm run build --prefix frontend` | **Passed**: strict TypeScript (`tsc -b`) and Vite production bundle |
| `git diff --check` | **Passed** |
| Headless Chromium through Vite's real proxy | **Passed**: booking → pre-check → simulation → post-check → saved progress → professor recommendation |
| Responsive overflow checks | **Passed** at 390, 768 and 1440px for quiz, progress and professor views |
| Browser runtime errors during smoke flow | **None** |

**40 automated tests pass.** Tests use temporary SQLite databases. Chromium used a separate scratch database, not a user demonstration database. No application dependencies were added, no public deployment occurred, and no real student information or university credentials were used.

## Acceptance coverage

1. **Booking and pre-check access:** original booking tests remain; a real HTTP React integration test books chain-rule tutoring and opens its pre-check from confirmation. All six curated topics are exercised through backend pre/post submission.
2. **Backend scoring:** one-correct, zero-correct and all-correct cases; backend private-bank oracle checks percentages and answer explanations. Unsubmitted payloads expose no keys or explanations, and locked post checks expose no questions.
3. **Persistence:** SQLite contains individual selections and scores; reopening the app returns identical saved results. Migration from a frozen original schema preserves every original user, subject, approval, session and booking, including a cancelled non-seed booking, across repeated initialization.
4. **Demo post-check:** pre-check prerequisite, future-session lock, idempotent simulation, different questions on the same objectives, natural time-based unlocking, unchanged session status and unchanged tutor points.
5. **Comparison:** exact positive and negative percentage-point differences; pending when data are incomplete; real React/API integration displays saved results and revisits explanations without a submit action.
6. **Professor updates:** persisted pre/post means, paired means and changes, sample sizes, observed recommendation signals, human-review label and exclusion of individual identities/answers. A real UI test changes the course aggregates through learner submissions.
7. **Missing/insufficient data:** no data, n=2 suppression, n=3 publication, independent suppression for pre/post/matched groups, missing checks not scored zero, cancellation returning groups below threshold, fresh checks after rebooking and older sessions with no bank.
8. **Demo ownership:** learner, tutor, professor and other fictional personas cannot read or submit a different selected identity's check or simulate its booking. History lists only that selected learner. A frontend test removes previously rendered answers immediately on role change. This remains a forgeable demo selector, not real authentication.
9. **Booking preservation:** all 10 original backend tests and all 8 original frontend tests pass. Duplicate booking, concurrency, capacity, conflicts, cancellation, restored seats, rebooking, filters, roles and error recovery remain covered.
10. **Frontend checks:** strict TypeScript and production build pass. New component tests cover incomplete forms, locked checks, retained selections after submission failure and no stale cross-role results. Chromium screenshots were inspected for the mobile quiz and professor view; layout checks cover phone/tablet/desktop.

The full flow also verifies that a zero post-check result produces a supportive practice recommendation and that no individual answers appear in the professor UI.

## Issues found and resolved

- The first new integration run used a singular query for an advisory label rendered for both assigned topics. The assertion now expects both labels; the underlying flow had completed.
- Chromium caught horizontal overflow in the expanded professor cards at 768px. Their columns now adapt to the available width beside the existing sidebar. The full browser flow and all three viewport checks pass after the fix.
- The default command sandbox blocked dependency downloads and the event-loop socket used by test clients. Dependency installation and tests completed with network-enabled command permissions. The connected GitHub tools provided the exact merged source when shell Git access was unavailable. These were environment issues, not unverified product behavior.

## Verification limits

- There is one upstream **DeprecationWarning** from Starlette's test client referencing AnyIO's `BlockingPortal` alias. It does not fail tests.
- Chromium smoke and overflow checks are not a full accessibility audit. Screen-reader support, contrast, native dialog focus restoration, all keyboard-only paths and target-device presentation still merit manual review using `DEMO_CHECKLIST.md`.
- Only Linux/Chromium was exercised. Safari, Firefox, Windows and macOS were not tested.
- The synthetic two-question checks, n=3 suppression and recommendation thresholds are illustrative, not validated educational or privacy policy. No claims of causal or scientifically established improvement are made.
- Session dates remain fixed at first seed. For an expired demonstration dataset, preserve it and select a fresh `CLASSALL_DB_PATH`; upgrading does not require deletion.
- Production authentication, real attendance, retakes/draft synchronization, TA scheduling, real academic records and automated student contact remain outside scope.

## Changed-file guide

- `backend/app/learning.py`: additive migration and curated bank; scoring, readiness, demo simulation, history, privacy suppression and advisory rules.
- `backend/app/db.py`, `main.py`, `schemas.py`, `repository.py`: startup upgrade, typed input, new routes, assigned-course insights and session check availability. Original booking service unchanged.
- `frontend/src/pages/LearningCheck.tsx`, `components/LearningProgress.tsx`, `components/TeacherLearningInsights.tsx`: quiz, saved results, personal comparisons and explainable teacher evidence.
- `App.tsx`, `lib/types.ts`, `pages/Impact.tsx`, `pages/MySessions.tsx`, `pages/ProfessorHome.tsx`, `components/BookingDialog.tsx`, `styles.css`: existing route and page integrations with responsive styles.
- `backend/tests/test_learning.py`, `backend/tests/fixtures/mvp_schema.sql`, `frontend/src/LearningCheck.test.tsx`, `frontend/src/App.integration.test.tsx`: acceptance, upgrade, privacy and real HTTP UI coverage.
- `README.md`, `docs/LEARNING_INTELLIGENCE.md`, `docs/DEMO_CHECKLIST.md`, `docs/TEST_REPORT.md`: setup, demonstration, indicator definitions, limitations and verification.
