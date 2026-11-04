# ClassAll manual review

Use the two-terminal startup instructions in the root README.

- [ ] Landing loads with API stopped; demo access reports a retryable connection error.
- [ ] Laptop viewport: sidebar, hero and cards fit without horizontal scrolling.
- [ ] Phone viewport (390px): mobile menu opens/closes; cards form a single readable column.
- [ ] Tablet viewport (768px): filters and cards fit; native dialog stays within the screen.
- [ ] Keyboard: skip link, navigation, role selector, search and filters are reachable with visible focus.
- [ ] Session dialog: focus stays in the native modal; Escape closes it and focus returns to the trigger.
- [ ] Book a seat as Laura; confirmation remains visible until dismissed.
- [ ] Reload the page; booking and reduced seat count persist.
- [ ] Cancel with the inline confirmation; seat count is restored and cancelled history is visible.
- [ ] Open the same session in two tabs; the backend rejects stale duplicate/full booking attempts.
- [ ] Switch to David: hosting schedule and 40 illustrative points appear; own session cannot be booked.
- [ ] Switch to the professor: only Mathematics and Statistics aggregates appear; no learner records or risk scores.
- [ ] Study groups and future AI/faculty actions clearly state that they are not active.
- [ ] Every online session explains that no meeting link is provided.

These items are a manual review checklist, not a claim that browser QA has been performed.

## Phase 2 Learning Checks

- [ ] Upgrade an existing MVP database by restarting the API; old bookings and cancellations remain.
- [ ] After booking, open the pre-check from confirmation and My Sessions.
- [ ] Keyboard: radio groups have question legends; arrow keys change selections; submit stays disabled until all questions are answered.
- [ ] Submit, reload and revisit saved answers, correct answers and explanations.
- [ ] Leave a draft incomplete; no score appears, and its loss on navigation is disclosed.
- [ ] My Learning & Impact shows practiced topics, pending checks and a pending comparison.
- [ ] Read the demo-completion disclosure, simulate, and verify no attendance/status or tutor points change.
- [ ] Complete the post-check and compare percentages/percentage points; lower and equal outcomes remain constructive.
- [ ] Switch demo identities while viewing results; previous answers disappear immediately.
- [ ] Professor: seeded n=2 results are suppressed; Laura's submissions bring each eligible group to n=3.
- [ ] Professor: zero submissions display missing data; all means and matched results disclose n.
- [ ] Professor: advisory recommendations state demand and assessment signals and require human review.
- [ ] Cancellation restores capacity, retains private results and suppresses newly small professor groups.
- [ ] Phone/tablet/laptop: quiz options, comparisons and insights fit, with no horizontal scrolling.

Phase 2 automated Chromium smoke checks cover the new end-to-end flow and 390/768/1440px overflow checks. This checklist also includes manual keyboard, assistive-technology and device review that those checks do not establish.
