# ClassAll V6 — experience and design report

Base: merged V5 on `main`, `519536e6633ef03e688954b09649c2e1b93d3a8a` (PR #5). Branch: `feature/classall-v6-experience-design`.

## Audit and direction

The audit covered all React routes, shared components, the existing English-source/Spanish-catalog translation system, API contracts, role permissions, responsive styles and V5 journey scripts. Baseline screenshots were captured from the exact merged V5 source, using an isolated rehearsal API.

| Problem in V5 | Implemented response | Why it helps |
| --- | --- | --- |
| Nine ungrouped student navigation items mix learning, teaching and history | Learning / sharing strengths / private journey groups; faculty overview / support groups | People can choose by intention; approved students retain both learning and teaching routes |
| Essential actions use small links and 35px controls | Shared 44px buttons, larger labels, prominent support/application/review actions, wrapped labels | Next steps are visible and touch targets remain usable in Spanish |
| Landing describes shipped features as roadmap work and focuses on tutoring alone | Three distinct linked pillar cards, reciprocal learning-circle diagram, corrected working-feature copy | The purpose becomes visible without a feature inventory |
| Long application with six textareas and tasks at once | Four numbered disclosure sections; continuation buttons; actual response preview; invalid sections open automatically | Learners can focus on one part; fields stay mounted and only the complete existing payload is submitted |
| Teaching plan, knowledge responses, explanation and decision blend together | Distinct expandable evidence sections, strong status chip, prominent professor decision and human confirmation | Reviewers can inspect the evidence they need without confusing advisory feedback with authority |
| Plain portfolio totals followed by a long list | Stored-point focal card, real activity totals, subject/topic chips, earned milestones, feedback bars, contribution timeline with source disclosure | Contribution becomes legible without inventing achievements, rankings or certification |
| Learning records repeat without topic structure | Topic-grouped journeys, individual before/after results, expandable objectives | Related practice sits together; incomparable question sets are never combined |
| Faculty actions feel detached from evidence | Observation → Interpretation → Human action pathway; topic capacity bars and prominent topic-linked actions | The evidence-to-decision relationship is visible; suppression and human responsibility remain |
| Studio exposes setup and technical information throughout | Six-stage indicator through assignment, current-stage emphasis, connection disclosure, collapsible material/analysis/generation panels | Prepared offline review stays central; source citations, review gates and immutable publications remain accessible |
| Mobile navigation has no focus containment; some secondary colors are too light | Focus trap, Escape/trigger restoration, inert background, reduced-motion handling; contrast fixes after axe inspection | Keyboard and touch workflows remain usable across the responsive shell |

## Shared identity and components

`experience.css` layers the V6 tokens and shared component rules over the existing stylesheet. Violet (`#6550b5`) signals learning; apricot (`#fbe5d6`) contribution; teal/sage (`#e0efea`, `#29685c`) support. Warm paper, darker text, consistent rounded cards, numbered pathways and comfortably sized controls tie the roles together. Semantic states have text labels; students receive no alarming ability/risk labels.

`FlowSteps`, `Pillars` and the optional `GuidedDemo` share the same language and layout system. Generic pathways are explicitly process guides. Teaching-session chips reflect real bookings/proposals, while Studio's current step follows the selected stored draft/publication. The guide changes persona and route only; it never completes a product action.

The original local SVG art and Lucide icons are reused. There are no external images, remote fonts, new application dependencies or heavy animations. Studio and Applications load in separate route bundles.

## Evidence, privacy and bilingual behavior

All portfolio numbers come from `/portfolio`; milestones and strengths are rendered only when returned by the backend. Recorded contributions, synthetic attendance, documented experience, suggested strengths and independent verification remain distinct. Feedback suppression is unchanged. Source disclosures retain session IDs and provenance.

All new interface copy uses the existing `tr`/`t` architecture and Spanish catalog. Original participant text is displayed verbatim. Dates keep the existing locale-aware formatting, and portfolio decimal values use the selected language. Draft answers survive disclosure changes and language switching; the form explains that only submitted applications persist. Synthetic-demo, privacy, assessment and certification limits remain contextual and accessible.

No backend, schema, authorization, migration or seed code changed. No existing SQLite database was opened, reset or deleted for QA. Tests and screenshots use dedicated temporary databases.

## Rendered examples

Screenshots are actual Chromium captures. Baseline and redesigned states use the same merged V5 architecture; the after images include deliberately completed synthetic rehearsal actions where relevant.

| Screen | Before | After |
| --- | --- | --- |
| Landing | [V5](previews/v6/before-landing.png) | [V6](previews/v6/after-landing.png) |
| Learner home | [V5](previews/v6/before-learner.png) | [V6](previews/v6/after-learner.png) |
| Application | [V5](previews/v6/before-applications.png) | [V6](previews/v6/after-application.png) |

- [Spanish portfolio](previews/v6/portfolio-es.png)
- [Faculty evidence](previews/v6/faculty-es.png)
- [Studio review](previews/v6/studio-es.png)
- [Spanish mobile reflection](previews/v6/pulse-es-mobile.png)
- [Spanish mobile application](previews/v6/application-es-mobile.png)

See [V6_QA_REPORT.md](V6_QA_REPORT.md) for verification and [V6_DEMO.md](V6_DEMO.md) for the bilingual story.

## Remaining UX limits

- Application sections preserve an in-page draft; there is no server autosave before submission. The interface says so explicitly.
- The underlying demo access selector is not authentication. This remains a local synthetic educational prototype.
- The portfolio is private and descriptive; its points have no academic credit, monetary value or institutional certification.
- Attendance is a two-party synthetic demonstration, not independent verification. Learning Check differences do not establish a tutoring effect.
- The guide navigates story scenes; it does not infer that prerequisite actions have happened.
- Long evidence pages still require scrolling. Native disclosures reduce the initial load while retaining source and decision detail.
- The inherited stylesheet remains layered. A later cleanup could consolidate legacy selectors; this phase favors compatibility with the working V5 product.
- Automated checks and screenshots do not establish full accessibility, learning efficacy or production readiness. A real pilot still needs representative learners, faculty and assistive-technology review.
