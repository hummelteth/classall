# ClassAll V5 implementation report

Date: 4 November 2026. Base: latest `main` at the start of this task, `0f0a8d2` (merged V4). Branch: `feature/classall-core-experience-v5`.

## Audit and scope

The environment's initial checkout was the original MVP (`90cbeb1`). GitHub's current `main` was fetched before creating the V5 branch. V4 already supplied EN/ES translation, SQLite migrations, tutor publishing and subject approvals, topic-level Pulse/support requests, study groups, pre/post Learning Checks and private history, suppressed faculty aggregates, human-confirmed support actions/TA offerings, and the local Ollama/PDF/review/publication Studio. Those services were extended in place; no application rebuild, authentication replacement or normal database reset was performed.

The missing lifecycle was qualification → current subject authorization → attended teaching → documented recognition. The previous role checks admitted only the fixed `tutor` demo persona to publishing/host-management even if a learner had a subject approval. Previous points were calculated directly from completed-session counts, with two historical synthetic examples. V5 uses a contribution ledger and accepts approved students as hosts without changing their learner identity.

## Delivered experience

1. **Tutor applications.** Every student has Become a Tutor in navigation. A subject/topic, motivation, relevant experience, proposed topic, objectives, teaching plan, activities, two knowledge responses and a teaching explanation are persisted. The prepared V4 curated bank and its Spanish equivalents are reused, with the source and its illustrative limits disclosed. Submitted applications snapshot questions, answer keys, language and responses; subsequent UI language changes do not rewrite authored content or stored references. Unsubmitted form input is not autosaved.
2. **Qualification and advisory feedback.** Applicants see questions before submission, and reference answers after submission. Professors inspect both responses and explanations. A five-criterion rubric covers accuracy, clarity, educational reasoning, learner fit and misleading/omitted material. The reliable offline path stores an explicitly prepared review checklist; it does not pretend to evaluate an applicant's writing. Optional live feedback reuses the bounded, local-only Ollama provider and structured Pydantic validation. The server chooses a qualification-specific system instruction and places applicant text in the explicitly untrusted `source_passages` field. Output is advisory, never an approval score or decision. Live errors remain explicit and do not silently substitute prepared content.
3. **Human decisions and permissions.** Pending, changes requested, approved and rejected states work. Request changes allows the applicant to revise and resubmit; rejection permits a separate new application. Reviewers must be professors assigned to the application's subject and cannot be the applicant. Decisions record reviewer ID, timestamp and comments. A transaction inserts the exact `(student, subject)` authorization when approved. The existing publishing and edit services enforce subject authorization. Mathematics approval does not imply Physics authorization. Learner personas can publish/host with approval and continue booking as learners. Existing tutor/professor home experiences remain.
4. **Attendance and completion.** The host sees actual registered participants, proposes an immutable set of eligible booking IDs and explicitly acknowledges synthetic attendance. The booking owner separately acknowledges fictional participation. At least one learner confirmation is required to complete the session and trigger recognition. Cancellation, wrong-session booking IDs, other learners, unauthorized hosts and missing proposals are rejected. Proposal retries are idempotent for the same set; a changed proposal is rejected. Attendance is unique per booking. Completed/cancelled offerings remain in teaching history. This is a demonstrable two-party synthetic process, not independent real-world verification.
5. **Recognition ledger.** One contribution event per session is protected by a unique database constraint and SQLite write transaction. The first eligible learner confirmation creates the award; later confirmations do not multiply it. Publishing, booking, cancelling, editing, checks, test scores and feedback do not create points. The default is 20, configurable centrally through `CLASSALL_CONTRIBUTION_POINTS` for future events. Prior completed-session totals are snapshotted once at their existing 20-point value, preserving David's original 40. Every entry has session ID, tutor, amount, time, provenance and, for new confirmation, the confirming actor. Both old history and new attendance are labeled synthetic.
6. **Constructive feedback.** Only an attendee whose own booking remains confirmed in a completed session can submit. Three 1–3 ratings address explanation clarity, preparation/organization and supportive atmosphere, plus an optional private reflection. Unique booking and `(session, learner)` constraints prevent duplication. Comments are visible only in their author's own attendance records. Tutors receive no individual ratings/comments; summaries and suggested strengths require at least three distinct learners across their sessions. This is an illustrative threshold, not a claim of production privacy protection. Feedback does not establish academic improvement or award points.
7. **Private portfolio.** My Learning & Impact retains private Learning Check history and adds current approved subjects, labeled contribution history, documented sessions/hours/topics, count of learners with confirmed synthetic attendance, points, milestones and qualified strengths. Records distinguish authorization, documented experience and suggested strengths. Independently verified session count is explicitly zero. There are no public portfolios, rankings, monetary rewards, academic credit, certificates or university endorsements.
8. **Faculty support.** Existing subject assignments, independent small-group suppression, voluntary evidence and support actions are unchanged. Completing a session removes it from upcoming supply, so existing unmet-demand signals reflect current support. A faculty decision still records human confirmation and an aggregate evidence snapshot; TA publishing uses the existing catalog/booking service and checks the selected host's subject authorization, including approved learner hosts. No individual-risk model or autonomous intervention was added.
9. **EN/ES and navigation.** All new interface strings, prepared questions/tasks, statuses, rubrics, notices, confirmations and service errors are translated. Existing native validation localization remains. Course/topic selects and new rating/decision selects have explicit accessible labels. Authored text retains its original language. New cards reuse the current design system; mobile portfolio cards stack to keep Spanish labels readable.

## Persistence and compatibility

New tables are additive:

| Table | Purpose / uniqueness |
| --- | --- |
| `core_migrations` | One-time legacy-ledger snapshot marker |
| `tutor_applications` | Submitted content, immutable reference snapshot per submission, status, advisory, reviewer/decision data; one active application per student/subject |
| `application_events` | Submission/revision/decision/advisory history with actor, payload and timestamp |
| `synthetic_session_confirmations` | Host proposal and immutable selected booking set, one per session |
| `session_attendance` | Host/learner/session/booking links, proposal and confirmation times, synthetic provenance; one per booking |
| `contribution_ledger` | Stored awards with provenance; one per session |
| `session_feedback` | Private feedback tied to eligible attendance; one per booking and per session/learner |

No existing bookings, learning answers, groups, Pulse rows, professor publications or seed dates are rewritten by migration. An explicit upgrade test creates V4 records including a user-created group and an immutable Spanish Studio publication, snapshots every V4 table, runs V5 initialization twice and compares all original rows. Legacy synthetic points are consistent across repeat initialization.

The intentional API compatibility extension is that `/api/tutor/overview` now also admits learner personas (professors remain blocked). The prior test expecting a blanket learner 403 was updated to verify an empty approval list before qualification; new journeys verify both teaching permissions and continued learner access. `/api/sessions/{id}/attendees` and faculty host discovery likewise accept subject-approved learner hosts.

Confirmed V5 attendance unlocks the existing post-check after a pre-check without writing into `demo_session_completions`. The older check simulation remains independent and grants no attendance or reward. Published assessments and their immutable snapshots remain under the existing V4 guards.

## New API routes

All personal routes require the existing intentionally forgeable `X-Demo-User-Id` selector. It demonstrates business authorization, not secure identity.

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/qualifications/{topic_id}?language=en|es` | Prepared questions/task/rubric without answer keys |
| GET / POST | `/api/tutor-applications` | Own applications or assigned-faculty queue / submit |
| PUT | `/api/tutor-applications/{id}` | Applicant revision after changes requested |
| POST | `/api/tutor-applications/{id}/review` | Assigned professor's explicit human decision |
| POST | `/api/tutor-applications/{id}/advisory?mode=prepared|live` | Explicit prepared checklist or optional local draft |
| POST | `/api/sessions/{id}/synthetic-attendance` | Authorized host proposal against eligible bookings |
| POST | `/api/bookings/{id}/confirm-synthetic-attendance` | Booking owner's separate synthetic confirmation |
| GET | `/api/attendance/mine` | Own attendance proposals, status and private feedback |
| GET | `/api/teaching/records` | Own offerings including completed/cancelled history |
| POST | `/api/bookings/{id}/feedback` | One constructive feedback record per eligible participant/session |
| GET | `/api/portfolio` | Own contribution ledger, experience and suppressed feedback summary |

## Reproducible presentation

`python -m app.presentation --database <new-directory>/classall-v5-presentation.sqlite3` creates a new dedicated fictional database exclusively. It refuses existing paths and the normal database. It never opens the user's normal database to modify it. There is no destructive reset endpoint or switch.

Only inside that newly created scenario, David's current Mathematics authorization is absent, Amira hosts the original future Mathematics session with matching synthetic approval, and all historical sessions/bookings/checks are retained. David keeps Statistics authorization and his 40 historical points. New approval then genuinely grants his Mathematics permission. A normal V5 upgrade preserves his original approval instead; it does not silently revoke it for presentation convenience.

Repeat by using a new directory and selecting that database when restarting the API. Old presentation files remain available. Full setup, recovery, sample application text and a timed 6:45 guided presentation in English and Spanish are in [V5_DEMO.md](V5_DEMO.md).

## Validation

Executed on Linux with Python 3.12.14, Node 24.22.1 and installed Chromium. The test databases and browser services are isolated temporary files and loopback processes. No normal user database is used for tests.

| Check | Result |
| --- | --- |
| `.venv/bin/python -m pytest -q backend/tests` | 107 passed, including nine V5 tests and V4 regression coverage |
| `npm test --prefix frontend` | 22 passed across five files, including five real HTTP/SQLite integration journeys |
| `npm run build --prefix frontend` | TypeScript validation and production build passed |
| `CLASSALL_CHROMIUM=/usr/bin/chromium npm run test:browser --prefix frontend` | Passed: V4 connected journey; 54 role/route/viewport checks; native booking dialog keyboard/navigation checks; Spanish PDF upload, editing/review, immutable publication, session assignment and learner scoring; 57 Spanish viewport checks; zero page errors |
| `CLASSALL_CHROMIUM=/usr/bin/chromium npm run test:browser:v5 --prefix frontend` | Passed: complete English V5 journey with role changes, reloads and 1440/768/390px checks |
| `CLASSALL_CHROMIUM=/usr/bin/chromium npm run test:browser:v5:es --prefix frontend` | Passed: complete Spanish V5 journey with role changes, reloads and 1440/768/390px checks |
| New Python module static checks and `git diff --check` | Passed; FastAPI's established dependency-default pattern retained |

Backend coverage includes before/after publishing permissions, another-subject professor denial, self-review denial, revisions/rejection, dual learner/host access, cancelled/wrong-owner attendance, concurrent duplicate confirmations, configurable rewards, feedback ownership/uniqueness/suppression, local-provider mocks/failures, safe initializer refusal, database restart and every-record V4 upgrade preservation. The V5 browser journey is Laura → David → García → David → Laura → David → Laura → David → García because attendance deliberately requires both host and learner actions.

The initial responsive checks found and corrected long-link and Spanish portfolio overflow. The older native-dialog browser assertion now waits for the loaded booking controls before exercising focus. Resource-intensive browser suites were verified without concurrent source edits; an earlier overloaded parallel run hit existing short UI wait limits and was rerun after checking synchronization.

Non-blocking toolchain warnings remain: the upstream Starlette TestClient/Anyio alias deprecation and Vite's main-bundle size warning (approximately 506 kB minified). No check failure remains in the delivered version. Browser artifacts/logs are generated under gitignored `work/browser-qa/`; they are not committed or mixed into the normal demo database.

## Remaining limits and future improvements

- This is a fictional local prototype. Demo headers can be forged and are not real authentication, verified university membership or institutional authorization.
- Attendance is explicitly synthetic and requires two demo personas; production would need verified identities, independent institutional attendance evidence, dispute/correction handling and retention policies. There is no claim that the synthetic workflow prevents collusion.
- Qualification uses the existing illustrative curated bank and prepared rubric. It is not a validated exam, formal tutor credential or institutional approval framework. Selecting arbitrary Studio publications as qualification banks, tailored explanation tasks across all topics and institution-approved qualification instruments can follow later.
- The offline advisory is a checklist, not personalized AI feedback. Live local drafts require human academic review. Windows GPU behavior and real local inference were not retested in Cloud; provider behavior uses mocks in automated tests.
- Feedback is optional and immutable after submission; private comments stay with their authors. Aggregate strengths are tentative and reflect teaching experience, not measured academic gains. Production privacy needs more than a three-learner threshold, including differencing/retention review.
- Applications are saved on submission, not as unfinished drafts. There are no application notifications, identity verification, approval expiry/revocation tools or attendance correction UI in this phase.
- Legacy completed sessions retain historical synthetic provenance without retroactively inventing attendance or learners supported.
- No individual academic-risk prediction, real grades, public leaderboards, certificates, credits, payments, external AI services, public deployment, LMS integration or automatic merging was introduced.
- Automated browser checks cover responsive layout, role transitions, native dialogs and connected state; they are not a complete accessibility audit or institutional-scale performance test.
