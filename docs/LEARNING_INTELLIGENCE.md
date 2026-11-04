# Phase 2: Learning Checks & Teacher Intelligence

Built from the latest merged MVP `90cbeb13a41c467ecd369c4e09e904e1b3de0690` on `feature/classall-learning-intelligence`. The existing React/TypeScript/Tailwind frontend, FastAPI endpoints, synthetic identities, SQLite records and booking rules remain in place.

## Learning cycle and scope

A confirmed booking provides an optional pre-session check. Two curated questions address the first two existing session objectives. A post-session check uses two different, comparable questions for those objectives. Check submission stores all selections and the backend-computed correct/total score. Learners can revisit their own results and explanations from My Sessions or My Learning & Impact. Questions are not randomly generated or psychometrically validated.

The six initial topics are chain rule, Python loops/functions, forces/motion, supply/demand, distributions/confidence intervals, and stacks/queues. Each seeded session has one topic and two assessed objectives; remaining session goals are not assessed. The 24 questions, 72 options, correct-option flags and explanations live in SQLite, seeded from the curated bank in `backend/app/learning.py`. No AI service is called.

Before submission, payloads whitelist question ID, prompt, objective ID and option ID/label. They contain no correctness flags, explanations, correct-option IDs or scores. A completed check reveals its own explanations and correct answers only to its booking's selected demo learner. Post questions stay hidden while locked.

All answers are required. Partial selections stay in the current page only; leaving/reloading discards the draft, and no partial submission or score is stored. Server validation rejects missing, extra, foreign-question and invalid options and client-supplied scores. A write transaction plus unique `(booking_id, check_id)` constraint prevents duplicate or concurrent submissions. Wrong answers can produce zero; an unsubmitted check is always null, never zero.

## Completion and comparisons

Post checks require a submitted pre-check and either the scheduled session end or a separate `demo_session_completions` marker for that booking. The visible **Demo: simulate completed session** button explains the simulation before use. Its endpoint is idempotent. It does not change session status, bookings, dates, attendance or tutor engagement points. Elapsed time unlocks a check; it does not verify attendance either.

Personal comparisons subtract pre percentage from post percentage and report **percentage points**. Both checks must exist; otherwise the comparison remains pending. Results can rise, stay equal or fall. Two-item scores are a limited snapshot of answers to different questions, not real grades, causal tutoring effects or scientifically validated gains. Suggestions are supportive and private. There are no rankings, risk labels, credits, score-based rewards or automatic academic decisions.

Cancellation restores seats through the unchanged booking service. Previously completed checks remain reviewable; new checks and demo simulation are closed for that booking. Rebooking creates fresh checks. Cancelled bookings are excluded from teacher aggregates.

## SQLite upgrade

Startup keeps the original seven tables and indexes, then adds:

- `learning_migrations`: version 1 marks the completed question-bank/data seed.
- `professor_subjects`: explicit demo course assignments (professor 3 → subjects 1 and 5).
- `topics`, `learning_objectives`, `session_topics`: subject-linked topic and objective metadata.
- `learning_checks`, `assessment_questions`, `answer_options`: separate pre/post checks, prompts and private answer keys.
- `assessment_submissions`, `learner_responses`: scored submissions, selections, timestamps and synthetic source markers.
- `demo_session_completions`: a separate simulated-completion timestamp per booking.

DDL uses additive `CREATE TABLE/INDEX IF NOT EXISTS` updates and a versioned seed. Restarting does not recreate submissions or modify original users, subjects, approvals, sessions or bookings. `backend/tests/fixtures/mvp_schema.sql` freezes the merged MVP schema for upgrade testing. Upgrade backups remain sensible operational practice; resetting a database is not required for this feature.

Two existing fictional chain-rule bookings (Noah and Maya) receive clearly labeled seeded synthetic examples: pre 0/2, post 1/2, with simulation markers. No new booking or attendance is manufactured. These two cases deliberately demonstrate small-group suppression. Source values distinguish `seeded-synthetic` from `demo-interaction` submissions. Seeded examples remain persisted demo data, not validated learner observations.

If an old database has expired session dates, preserve it and choose a new `CLASSALL_DB_PATH` for a fresh presentation dataset. The original date policy is unchanged.

## Explainable professor indicators

Only assigned subjects are returned by `/api/insights`. It contains aggregates and metadata, never learner names, IDs, selected answers, booking IDs or private assessment histories.

| Indicator | Population and rule |
| --- | --- |
| Course/subject capacity | Upcoming, future sessions; confirmed seats, total capacity and available seats, using the original booking queries. |
| Topic capacity | Same future-session population, filtered to that topic. |
| Topic demand | Count of confirmed bookings and distinct booked learners for the topic, including past sessions. This signals interest in support, not academic difficulty. |
| Participation | Submitted pre/post checks (`n`) out of distinct topic learners. Latest confirmed booking by booking ID per learner/topic; a newer unanswered booking is missing, not an older score carried forward. |
| Stage means | Arithmetic mean of individual percentage scores, separately for pre and post. `n < 3` returns null and `suppressed: true`; `n=0` explicitly means no submitted data. |
| Matched comparison | Only learners with pre and post submissions on that same latest booking. Matched pre/post means and average percentage-point difference are all null below three distinct pairs. |
| Missing data | Unsubmitted checks excluded from means; UI reports missing counts. Stage means may describe different participants. |

No per-question, per-learner or additional small subgroup means are exposed. The minimum size is applied separately to pre, post and matched results and recalculated after cancellation. This is a demonstration privacy rule, not a claim that a three-person aggregate is safe for real academic data.

Deterministic recommendations:

1. At least **3 distinct confirmed topic learners**, at least **3 post-check participants**, and post mean **below 67%**: advise considering additional practice materials or an official TA-led session.
2. At least 3 distinct confirmed topic learners without a publishable low post mean: advise reviewing tutoring availability, explicitly without inferring difficulty.
3. Otherwise: observe further; insufficient evidence for a teaching change.

These illustrative thresholds are not validated intervention criteria. Each recommendation shows the actual demand signal, available assessment evidence (or its absence), thresholds and **Human review required**. No individual is labeled or contacted. Scheduling is a future action with no inactive scheduling controls.

## Demo trust boundary and limitations

`X-Demo-User-Id` is intentionally forgeable. Ownership checks enforce separation for the selected identity, but changing that header impersonates another fictional user. This is not production authentication or authorization. All new routes inherit the API's synthetic-demo-only scope and loopback startup instructions. Never enter real student data or university credentials.

No public deployment, LMS integration, paid AI service, attendance verification, academic decision, email or automated student contact is enabled. Draft synchronization, retakes, question authoring and TA scheduling are outside this phase. Real deployment would require a separate security/privacy design and validated educational policy.
