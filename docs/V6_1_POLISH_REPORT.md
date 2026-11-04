# ClassAll V6.1 — readability and UI polish

Base: V6 `6dae158b28d4093c94817b881aba3ec650d2ed3c`, on `feature/classall-v6-experience-design` / PR #6. Verified 4 November 2026. The initial workspace contained V5; the existing V6 branch was fetched and checked out before implementation.

## Audit

The warm V6 identity, illustrations, three pillars, grouped navigation, four-section application, portfolio and faculty evidence pathway are preserved. No product functionality was added.

- V6 used a 15px body, 13px buttons/navigation, 11–13px session metadata and 10–12px explanations. Legacy breakpoint rules also reduced many labels to 6–12px, including on large recording screens.
- Important information in otherwise spacious cards looked disproportionately small. Fixed card layouts and nowrap controls became cramped once text was readable.
- The tutor capacity component put its translated caption in an absolutely positioned, full-width element below a compact flex row, reserving only 17px. Long Spanish captions could collide with the icon/value or surrounding content.
- Some faculty headings, captions, footer text and secondary metadata retained pale legacy colors.

## Shared typography and contrast

`frontend/src/experience.css` owns a shared rem-based scale. The obsolete small-type declarations in `styles.css` were removed, including responsive overrides, so they cannot silently shrink essential text again.

| Role | Refined scale at the default 16px browser font |
| --- | --- |
| Landing hero | Responsive 42–64px; approximately 54–64px across the tested laptops/recording screen |
| Main headings | Responsive 30–36px |
| Section headings | Responsive 22–26px |
| Card titles | 20px |
| Body and form reading | Responsive 16–17px, 1.6 line height |
| Navigation, buttons, disclosure actions | 15px, generally 44px minimum target height |
| Session metadata, statuses, labels, secondary captions | 14–15px |
| Decorative overlines | 12px |

The neutral secondary text token remains `#66685f`, now applied consistently to inherited components. Its calculated contrast is **5.61:1** on warm white, **5.38:1** on warm paper, **4.76:1** on lavender, **4.66:1** on apricot and **4.77:1** on sage/teal. Faculty headings use darker green `#3f6146`. Placeholder text has explicit readable contrast. Font weights retain the existing hierarchy rather than making all copy bold.

## Components and layout fixes

- Landing: readable header/actions, pillar descriptions and learning-circle labels; a bounded hero scale preserves the original composition and illustration.
- Learner home: larger action-card copy, more useful text width and flexible next-session columns. Mobile action cards use one column to avoid narrow text stacks.
- Catalog: clearer titles, tutor names, dates, duration, format, places and buttons; responsive card tracks. The Spanish sort/filter row wraps rather than overflowing at 390px. Search and sorting remain unchanged.
- Tutor dashboard: `TeachingRow` gives the count its own semantic element and uses an intrinsic grid for icon, value and caption. The caption stays in document flow; narrow cards move the whole statistic below the session details. Existing booked/capacity values and translations are unchanged.
- Forms/application: readable labels, guidance, response choices, section summaries, validation and preview copy; the four sections and all submission/review behavior remain intact.
- Portfolio: readable activity labels, provenance, milestones and feedback captions; a slightly larger, flexible points medallion accommodates Spanish labels.
- Faculty: readable metrics, course/topic evidence, explanatory copy and support prompts; Observation → Interpretation → Human action is unchanged.
- Studio: larger source material, citations, question-review controls, status and approval copy; narrow layouts stack question cards. Six stages and provider behavior are unchanged.
- Guided demo: larger scene titles, descriptions and actions inside the existing scrollable navigation. Language switching, persona selection and real route navigation are preserved.
- Shared shell/dialogs: flexible header and tab rows, visible focus rings, wrapping booking facts and readable footer text.

## Before and after

All images are actual Chromium captures at normal browser zoom, using dedicated synthetic rehearsal databases and the existing presentation journey. V6 baseline captures are from the exact base commit, not the older V5 screenshots. Each run replays the same real workflow; no records were edited for screenshots.

Baseline desktop captures use 1440×1000; the corresponding V6.1 desktop viewport uses 1440×900. Full-page pairs retain their natural content height.

| Screen | V6 baseline | V6.1 |
| --- | --- | --- |
| Landing, EN | [Before](previews/v6_1/before-landing-en-1440.png) | [After](previews/v6_1/after-landing-en-1440.png) |
| Learner dashboard, EN | [Before](previews/v6_1/before-learner-en-1440.png) | [After](previews/v6_1/after-learner-en-1440.png) |
| Tutor/capacity, ES | [Before](previews/v6_1/before-tutor-es-1440.png) | [After](previews/v6_1/after-tutor-es-1440.png) |

Representative results:

- [1920×1080 learner recording viewport](previews/v6_1/learner-en-1920.png)
- [Spanish catalog at 1920×1080](previews/v6_1/catalog-es-1920.png) and [390px](previews/v6_1/catalog-es-390.png)
- [Spanish tutor dashboard/capacity at 390px](previews/v6_1/tutor-es-390.png)
- [Four-section application at 1366px](previews/v6_1/application-es-1366.png)
- [Spanish competency portfolio](previews/v6_1/portfolio-es-1440.png)
- [Spanish faculty dashboard](previews/v6_1/faculty-dashboard-es-1440.png) and [topic evidence](previews/v6_1/faculty-es-1440.png)
- [Spanish Studio at 1366×768](previews/v6_1/studio-es-1366.png)
- [Spanish guided demo](previews/v6_1/guide-es-1440.png)
- [Spanish booking dialog at 390px](previews/v6_1/booking-es-390.png)

## Verification

| Check | Result |
| --- | --- |
| Backend pytest | **107 passed**; one existing upstream Starlette/AnyIO deprecation warning |
| Frontend Vitest | **22 passed**, five files; includes real HTTP/SQLite integration |
| Strict TypeScript and production build | **Passed** |
| General Chromium regression | **Passed**, including 54 role/route/viewport checks |
| Spanish Studio regression | **Passed**: persistence, PDF upload, editable review, immutable publication, assignment, scoring and 57 Spanish viewport checks |
| Complete V5/V6 English presentation | **Passed** through the design runner, including subject authorization, booking, two-party synthetic attendance, private feedback and persisted 60-point portfolio |
| Complete V5/V6 Spanish presentation | **Passed** with desktop/tablet/mobile captures |
| V6.1 layout/readability matrix | **180 combinations passed**: 18 states × two languages × five viewports; zero overflow, undersized primary buttons, undersized checked essential text or capacity overlap |
| Booking dialogs | **10 layout checks passed**: EN/ES at all five widths |
| axe WCAG 2 A/AA and 2.1 AA | **180 scans; zero violations** across every matrix state, language and viewport |
| Keyboard, draft and guided-demo checks | **Passed in EN/ES** |
| Source whitespace | **Passed** (`git diff --check`) |

The expanded `test:browser:design` runner checks 18 real screen states in EN/ES at 390×844, 768×1000, 1366×768, 1440×900 and 1920×1080. It checks overflow, visible primary button heights, essential text sizes and actual icon/value/caption geometry. It additionally opens booking dialogs at all five widths and exercises the expanded guided demo. Mobile keyboard checks cover 25 successive Tab presses inside navigation, inert background, Escape and trigger-focus restoration. Existing application draft/language-switching checks remain.

Machine-readable [layout/accessibility summary](previews/v6_1/layout-results.json) accompanies the selected screenshots. Accessibility scans use optional axe-core installed only in ignored QA tooling; no application dependency or lockfile changed.

Reproduce after installing the repository's pinned Python and npm dependencies:

```sh
.venv/bin/python -m pytest -q backend
npm test --prefix frontend
npm run build --prefix frontend
CLASSALL_CHROMIUM=/usr/bin/chromium npm run test:browser --prefix frontend
CLASSALL_CHROMIUM=/usr/bin/chromium npm run test:browser:v5 --prefix frontend
CLASSALL_CHROMIUM=/usr/bin/chromium npm run test:browser:v5:es --prefix frontend
CLASSALL_CHROMIUM=/usr/bin/chromium npm run test:browser:design --prefix frontend
```

Set `CLASSALL_AXE_SOURCE` to an installed `axe.min.js` to include accessibility scanning. `CLASSALL_PYTHON` and `CLASSALL_ARTIFACTS` can select the Python executable and screenshot directory. Default full artifacts remain under ignored `work/`.

## Preservation and limits

Only frontend presentation, browser QA and documentation changed. Backend/API/schema, seed content, AI providers, business rules and SQLite data were not changed. The existing presentation initializer and test suites created only isolated test-owned databases. No existing user database was opened for manual QA, deleted or reset. No public deployment or automatic merge was performed.

Chromium screenshots and automated accessibility checks do not establish complete accessibility or video legibility for every playback size. Manual screen-reader, other-browser and human video-viewing studies were not performed. Live Ollama inference was not exercised; prepared-source inspection, review, publication and assignment remain covered by existing regressions. User-authored/session text stays in its original language as before; the interface itself is bilingual. Long evidence pages and the expanded navigation guide naturally scroll.
