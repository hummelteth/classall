# ClassAll V6 — verification report

Validated 4 November 2026 against merged V5 `519536e6`, on `feature/classall-v6-experience-design`. Environment: Linux, Python 3.12.14, Node 24.22.1 and real headless Chromium 155.0.8059.79, with Europe/Paris browser time zone for the demo journeys. No public deployment was performed.

## Results

| Check | Result | Evidence / scope |
| --- | --- | --- |
| Backend pytest | **107 passed** | Existing API, SQLite, concurrency, authorization, applications, attendance, feedback, contribution ledger, learning, groups, Studio and migration tests |
| Frontend Vitest | **22 passed in 5 files** | React flows, real HTTP/temporary SQLite integrations, error recovery, learning, role navigation, translations and native validation |
| TypeScript | **Passed** | Strict `tsc -b`, included in production build |
| Vite production build | **Passed** | Separate Applications and Studio route chunks; no oversized-chunk warning |
| General browser regression | **Passed** | Pulse/support persistence, group joining/creation/edit/cancellation, approved tutor publishing, booking, pre/post checks, simulation, faculty evidence/actions, faculty session publishing and reservation |
| General browser layout matrix | **54 checks passed** | Existing role/route/viewport checks, mobile navigation, zero page errors |
| V5 English presentation | **Passed** | Full dedicated-presentation-database journey, with desktop/tablet/mobile screenshots |
| V5 Spanish presentation | **Passed** | Same real persisted journey in ES, with desktop/tablet/mobile screenshots |
| V6 design matrix | **96 combinations passed** | 16 screen states × EN/ES × 1440/768/390; no horizontal overflow and no visible primary `.button` below 44px |
| V6 accessibility automation | **32 states: zero axe violations** | WCAG 2 A/AA and WCAG 2.1 AA axe rules on the 390px state of each screen in EN/ES; optional axe source installed only in scratch tooling, not an application dependency |
| Keyboard navigation | **Passed in EN/ES** | 25 successive Tabs stay inside the open mobile sidebar; background is inert; Escape closes and restores trigger focus |
| Application draft behavior | **Passed in EN/ES** | Text survives section closing/reopening and language switching; incomplete knowledge responses keep submission disabled; normal complete submission persists through the existing core journey |
| Final Spanish wording check | **Passed** | Rendered faculty comparisons translate dynamic “no complete pairs” and suppression labels |
| Literal translation catalog coverage | **Passed** | Existing catalog test and additional TypeScript AST inspection found no missing literal translation keys |
| Source whitespace check | **Passed** | `git diff --check` |

The backend suite reports one upstream Starlette/AnyIO `BlockingPortal` deprecation warning. It does not fail the tests. The final build produces approximately 497 kB main JS / 152 kB gzip, 99 kB CSS / 21 kB gzip, 12 kB Applications JS and 19 kB Studio JS. No application dependency was added.

## What the presentation journeys verify

The new database is created exclusively by the unchanged `app.presentation` initializer. David initially has Statistics permission but no Mathematics permission. The journey records Laura's voluntary reflection and support request, submits David's application, saves García's explicit human authorization, and verifies that Mathematics appears in the publishing form afterward.

David publishes a new session; Laura books and completes her pre-check. David proposes attendance for the actual booking; Laura independently confirms fictional participation, submits feedback and completes the post-check. David's portfolio shows **60 points**, including **40 preserved historical synthetic points plus one new 20-point contribution**. A reload preserves the contribution source. The private learner comment is absent from the tutor portfolio. Faculty then save a human-confirmed action with aggregate evidence.

Existing backend tests retain their idempotency, subject/ownership permissions, feedback restrictions, immutability, scoring and suppression assertions. UI selectors were updated only for the intended presentation changes: opening application/source disclosures and finding the new portfolio heading/point display. Numeric, privacy and persistence assertions were retained.

## Rendered inspection

Reviewed actual Chromium screenshots of landing, learner home, reflection, tutoring discovery, groups, application, faculty review, tutor dashboard, teaching management, attendance/feedback, contribution portfolio, topic history, faculty insights, support actions, Studio and a saved Learning Check. Both languages and all three viewport widths were inspected using overview sheets plus full-size application, portfolio and mobile captures. The existing browser journeys also capture expanded review, attendance and publication states.

Problems found and fixed during inspection:

- Inherited card/header selectors reduced important actions to 32–36px despite shared button rules. Contextual overrides now retain the 44px minimum.
- A sticky mobile application action row could cover fields. It now stays in normal document flow.
- The old mobile breakpoint and new tablet navigation needed one consistent 900px shell transition.
- Reduced-motion transition durations could delay inherited visibility and prevent immediate sidebar focus. Reduced motion now removes transitions; focus containment and restoration are checked in the browser.
- Long Spanish tutor statistics overflowed at 390px. Metrics now use shrinkable columns and a single-column mobile layout.
- Light secondary text, avatars, filters, tabs, notices and tutor labels failed contrast checks. Those colors and small labels were corrected and rescanned.
- Long mobile pathways were shortened into compact numbered grids; the tutor banner action no longer wraps into a narrow column.
- The upcoming-session card is visible on mobile and appears earlier, rather than being hidden by the inherited responsive rules.
- A legacy advisory label and dynamic comparison wording remained English in ES. These now translate while original participant text remains unchanged.

Selected screenshots and machine-readable results are committed in [previews/v6](previews/v6). See [layout-results.json](previews/v6/layout-results.json) and [accessibility-results.json](previews/v6/accessibility-results.json). Full local browser artifacts remain under ignored `work/` directories.

## Reproduce

Install the pinned Python requirements and `npm ci --prefix frontend` first. From the repository root with `.venv` activated:

```sh
python -m pytest -q backend
npm test --prefix frontend
npm run build --prefix frontend
npm run test:browser --prefix frontend
npm run test:browser:v5 --prefix frontend
npm run test:browser:v5:es --prefix frontend
npm run test:browser:design --prefix frontend
```

If Playwright has no bundled Chromium, set `CLASSALL_CHROMIUM` to your installed Chromium executable (this run used `/usr/bin/chromium`). Alternatively install Playwright's browser normally for your platform. `CLASSALL_PYTHON` can select a different Python executable. `CLASSALL_ARTIFACTS` can select an absolute artifact directory; otherwise captures go to `work/browser-qa`.

The design script runs the English core journey first, then inspects the persisted rehearsal state. To include the optional axe checks, provide an installed `axe.min.js` path through `CLASSALL_AXE_SOURCE`; without it, layout, controls, keyboard and draft checks still run. This verification used axe-core from separate scratch tooling. A standalone review export is retained in the committed JSON summary.

All browser runners create isolated temporary databases and remove only those test-owned temporary directories on completion. They do not connect to the normal running demo database. The exclusive-create presentation initializer is unchanged. No existing SQLite data was reset or deleted.

## Limits

- Screenshots and axe do not establish complete accessibility. Screen readers, multiple browsers, zoom/device combinations and representative users still need a real pilot.
- The 6:45 bilingual presentation guide is a rehearsable pacing plan with prepared snippets; no timed human presentation or user study was conducted.
- Prepared offline Studio content, uploads, review, immutable publication, revision and assignment were tested. Live Ollama generation was not available or required for this presentation; its existing integration remains optional.
- The app remains a local synthetic prototype. Authentication, institutional attendance verification, assessment validity, certification and production privacy guarantees are not established by these results.
- In-page application drafts are not saved before submission. This is explicitly disclosed; only submitted applications persist.
