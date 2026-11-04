# Connected learning architecture and audit

Phase 3 starts from merged Version 2, `55fe089` on `main` (PR #2), not the older MVP checkout. Initial audit covered all backend services, schema/seed/migration code, React routes/components, documentation and the 40 existing tests (28 backend, 12 frontend). All passed before UI changes. The working branch is `feature/classall-connected-learning`.

## Reuse and migration safety

- React 19, TypeScript, Vite, the warm off-white/lavender/green design, local SVG art, `DemoProvider`, `request`/`useRemote`, native booking dialog and shared cards remain.
- FastAPI, SQLite, the original session/booking service, tutor approvals, course assignments, six curated topic banks, pre/post submission service, personal history and suppressed professor aggregates remain.
- `db.initialize` runs the original seed, Version 2 `learning.migrate`, then `connected.migrate`. `CREATE IF NOT EXISTS`, unique indexes and a `connected_migrations` marker make upgrades repeatable. There are no changes to legacy table columns, seed dates, bookings, answers or assessment submissions. A frozen-MVP compatibility test and a new persistence test verify preservation.
- Main audit risks were seat races, demo identity spoofing, old dates, destructive booked-session edits and topic-linked sessions without checks breaking Version 2 history. New writes use `BEGIN IMMEDIATE`; publishing copies the existing curated question content for the selected topic into new session-specific checks. Questions are not generated and results are not invented. Original checks and answers stay intact.

## New tables

| Table | Purpose / integrity |
| --- | --- |
| `connected_migrations` | One-time synthetic data marker |
| `learning_pulses` | One current response per learner/topic; timestamp, active flag, source; withdrawal deletes response |
| `support_requests` | Open/matched/withdrawn demand; unique active learner/topic request; timestamps and source |
| `study_groups` | Creator, topic, event details, constrained capacity/format/status, example source |
| `group_memberships` | Unique group/member pair, joined timestamp; creator occupies one place |
| `session_details` | Existing session ID, peer/faculty kind, separate professor organizer and example source |
| `support_actions` | Professor/topic, type, rationale, status, creation/follow-up/notes, suppressed evidence snapshot, optional unique session link |

Foreign keys are enabled for every connection. Topic IDs determine the subject server-side; clients cannot substitute a subject to bypass approval. Indexes support topic demand, group dates and professor action queries. No duplicate subject, tutor or booking entities were added.

## New API surface

All paths below start with `/api`. Mutations use validated Pydantic schemas with unknown fields rejected. Main list/detail results have response models. OpenAPI is available at `/docs`.

| Method | Path | Responsibility |
| --- | --- | --- |
| GET | `/pulses` | Own latest active responses |
| PUT / DELETE | `/pulses/{topic_id}` | Upsert own voluntary response / withdraw it |
| GET / POST | `/support-requests` | Own requests / open explicit topic demand |
| POST | `/support-requests/{id}/withdraw` | Withdraw own request |
| GET | `/topics/{id}/support` | Matching available sessions/groups and curated practice objectives |
| GET | `/groups` | `subject_id`, `topic_id`, `date` (UTC day), `available`, `mine` filters |
| POST | `/groups` | Create group and creator membership atomically |
| PUT | `/groups/{id}` | Creator-only safe edit |
| POST | `/groups/{id}/join`, `/leave`, `/cancel` | Membership or creator cancellation |
| POST | `/sessions` | Publish peer tutoring for an approved tutor |
| PUT / POST | `/sessions/{id}`, `/sessions/{id}/cancel` | Publisher-only safe edit / explicit cancellation |
| GET | `/sessions/{id}/attendees` | Host-only confirmed synthetic booking list; no assessment or pulse data |
| GET | `/professor/signals` | Assigned-topic Pulse/demand/capacity, suppressed independently |
| GET | `/professor/hosts?topic_id=…` | Approved synthetic hosts for an assigned topic |
| GET / POST | `/support-actions` | Own assigned-course actions / human-confirmed new action |
| PATCH | `/support-actions/{id}` | Status, notes and optional follow-up date |
| POST | `/support-actions/{id}/session` | Faculty offering using an approved host and original booking service |

The original endpoints and response fields remain compatible; session responses additionally expose topics, `kind`, `organizer_id`, `source`.

## Business rules

Events require an explicit time zone, future start, 15–240 minutes, 2–50 places, nonblank title/description, valid topic and an in-person location. UTC is canonical storage; forms accept local browser time and convert it explicitly. Online is an honest demonstration format, not a meeting service.

Students and tutors can create groups without tutor approval. Group capacity/duplicate checks and membership writes hold the SQLite write lock. Members can leave; the creator must cancel instead. Once other members join, only title, description and capacity can change; capacity cannot drop below membership. Cancellation retains memberships as history, removes the group from discovery and shows it cancelled in personal groups. Past/cancelled groups reject further edits and joins.

Peer tutoring requires the selected actor to be a tutor with approval for the topic's subject. Publishing/editing checks the host's existing teaching and learner reservations for overlaps. Once confirmed bookings exist, only text, objectives or a capacity increase can change. A topic cannot change after any booking history, preserving saved checks. Explicit cancellation cancels confirmed reservations, retains their records and saved checks, and shows cancellation in learner history. It awards no points. Curated checks are copied for published topics; content coverage remains the six curated banks.

Faculty publishing requires an assigned professor, their own open TA action for the same topic, no existing linked offering, and a subject-approved synthetic tutor host. Organizer and tutor are distinct identities. No call changes the actor into the tutor. Faculty offerings appear in the same catalog, tutor schedule, professor action schedule and reservation system. Only their professor publisher manages them; the host can view their own booking list. Their topic stays linked to the action. Cancelling an action with a session requires explicitly cancelling the session and its reservations. Completed/cancelled actions are read-only; no automated messages or decisions run.

Support requests become matched when that learner books matching tutoring or joins/creates a matching group. Cancelling/leaving reopens matched requests when no other active matching booking/membership remains. Withdrawal is always personal. Matched means a reservation or membership, not attendance, academic success or proven resolution.

## Evidence and privacy

Pulse counts use the single current active row per learner/topic. Distribution is suppressed below three participants. Open support requests count distinct learners and are independently suppressed below three. Individual response/history endpoints reject professor access. Professor queries use `professor_subjects`; action snapshots contain aggregates and their interpretation, never private submissions. Hosts see only the synthetic names necessary for their own reservation list.

Existing Learning Check stage and paired suppression remain unchanged. A response is voluntary self-reflection; a request is desire for support; a two-question check is limited answer evidence. They are presented separately. Three open requests prompt a deterministic suggestion to review support. Rules state the threshold, missing grades/assignments, uncertainty and need for human review. There is no fabricated demand trend or causal claim. The n=3 policy is illustrative and does not provide production-ready privacy, including against differencing across updates.

This is deterministic educational decision support, **not AI or machine learning**. No real early-warning model, grades, university accreditation or institutional endorsement exists.

## Navigation and operation

Learners: home, support catalog, Pulse, sessions, groups, progress. Tutors add teaching/publishing and retain learner activities. Professors: teaching dashboard, courses, insights, actions. Dashboards summarize; detailed evidence and interpretation use dedicated pages and expandable sections. All roles share the same visual components and mutation feedback.

No application schema or user data is reset on startup. For stale example dates, explicitly run `python -m app.demo --add-examples` from `backend` with the virtual environment active. It appends missing future synthetic opportunities for four group topics and two David topics, leaves historical dates untouched, and is a no-op while suitable future examples exist.

## Deliberate boundaries

The header persona is forgeable demo selection, not authentication. SQLite locking is suitable for this single local prototype, not an institution-scale availability promise. Discovery is not paginated, and availability aggregation uses straightforward queries suitable for this small dataset. There is no group chat/video, live attendance, notifications, external payments, LMS integration or application-review workflow. Tutor applications/professor approval review remain future work; existing fictional subject approvals are enforced in UI and backend. See the pilot document for production requirements.
