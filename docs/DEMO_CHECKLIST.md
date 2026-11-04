# Manual QA and demonstration checklist

Use synthetic data only. Start from the README; keep the original database. The automated test runner uses its own temporary database. Date-sensitive examples can be refreshed with `python -m app.demo --add-examples` without deleting history.

## Roles and navigation

- [ ] Laura sees her learning space, support, Pulse, sessions, groups and progress.
- [ ] David sees teaching, publishing and impact, and retains his own learner activities.
- [ ] Professor sees only teaching dashboard, courses, insights and actions in primary navigation.
- [ ] Mobile menu opens/closes and each link works. Role changes return to the correct home. Reload preserves the selected persona.

## Connected student journeys

- [ ] Pulse: select a course/topic; save, change and withdraw. Refresh preserves an active response; withdrawal removes it from current aggregates. Nothing requires participation.
- [ ] See topic-specific tutoring, groups and practice objectives. No offers produces an honest empty state and a support-request action.
- [ ] Open and withdraw a support request. Duplicate active requests fail clearly. Booking/joining matching support changes it to matched; cancelling/leaving reopens it if no other match remains.
- [ ] Filter groups by subject, topic, UTC date and free places. Create/edit a future group; creator holds one place.
- [ ] Join/leave and watch place counts and home/My groups update after reload. Full and duplicate joins fail. Another student's edit/cancel fails. Creator cancellation remains in personal history.
- [ ] Online group/session says no meeting integration; no fake video or messaging control appears.
- [ ] Book/cancel tutoring, inspect confirmed/cancelled history, and verify capacity. Booking conflicts do not claim success.
- [ ] Complete/review pre/post checks. Demo completion is labeled, does not award points, and does not record genuine attendance. Scores/explanations persist and stay private.

## Tutor and faculty journeys

- [ ] David publishes only an approved topic, appears in catalog and My teaching, sees booked synthetic names and can edit safely/cancel explicitly.
- [ ] Booked dates/location cannot silently change; safe text/capacity increases work. Cancellation keeps learner records/checks.
- [ ] David’s existing contribution remains 40. New publication/Pulse/group/booking/simulation does not add points.
- [ ] Professor dashboard summarizes capacity, demand needing review and planned/active/completed actions.
- [ ] Insights separate voluntary reflection, support demand and Learning Checks. Latest Pulse updates count once. Small distributions and requests are suppressed independently; absent checks are not zero.
- [ ] Recommendation exposes observed evidence, threshold, missing data, advisory/human-review context. No causal or validated risk claim appears.
- [ ] Create an assigned-topic action only after checking human confirmation. Snapshot, rationale, status, follow-up and notes persist.
- [ ] Publish a synthetic faculty session with approved David as host. Verify shared catalog, Laura’s booking, David’s teaching and professor’s linked offering.
- [ ] Host cannot impersonate the professor publisher or alter faculty offerings. Other-course requests fail. Cancel faculty offering explicitly; reservations and action update consistently.

## Layout and accessibility

- [ ] Inspect home, catalog, bookings/dialog, Pulse, groups/create/edit, teaching/publish, progress, insights and actions at 390/768/1440px. No horizontal overflow, clipped date fields or unreadable cards.
- [ ] Tab through every workflow, activate with Enter/Space, use skip link, close the native booking dialog with Escape, check focus stays inside and returns to the opener.
- [ ] Test mobile menu by keyboard; headings, form labels, radio/checkbox groups and expandable evidence are understandable with a screen reader.
- [ ] Check contrast, 200% zoom, reduced motion and touch target size. Confirm errors and success states are perceivable without color alone.
- [ ] Stop the API and try recovery. No page errors, silent failed mutations or misleading success. Review empty and loading states on slow connections.

## Institutional and platform review still required

- [ ] Execute installation/update/tests on Windows and target institutional devices.
- [ ] Complete a screen-reader/contrast/accessibility audit and low-resource performance review.
- [ ] Before real data, replace demo identity, establish tutor governance, secure hosting, backups, moderation, retention and privacy protection beyond n=3.

See TEST_REPORT.md for what was actually automated. Unchecked items are a manual checklist, not a claim that they were executed.
