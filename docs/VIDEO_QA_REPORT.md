# Video production QA — 4 November 2026

## Delivered first cut

- Base: merged `main` `fa9f68f2770236451dd53cbad6684714f15a427a`, containing V6.1 polish `54a1df38ea32761473432d78cb71b051867ab867` and `docs/V6_DEMO.md`.
- Branch: `feature/classall-demo-video`.
- Successful final take: `work/video/take-FWgHhT/`. All eight scenes recorded in one complete real UI journey. A preceding full take also passed persisted-state verification.
- Final: `final/classall-demo-silent.mp4`; measured **169.00 seconds (2:49)**; 1920×1080, 30 fps, H.264 High / yuv420p, BT.709, MP4 with faststart. Exactly one video stream; **no audio stream**.
- Eight independent raw WebMs and eight edited MP4s are retained. Media is ignored by Git; the handoff bundle contains the generated assets.
- Final MP4 SHA-256: `e25484c66579d0402374125097ee7d0642939ab2428a9c41346445ca6f9e44f9`.

| Scene | Actual duration | Final interval |
|---|---:|---|
| 01 — ¿Y si aprender fuera una experiencia compartida? | 12.00 s | 0.00–12.00 s |
| 02 — Laura · Encontrar apoyo | 22.00 s | 12.00–34.00 s |
| 03 — David · Compartir fortalezas | 32.00 s | 34.00–66.00 s |
| 04 — Elena · La decisión académica es humana | 20.00 s | 66.00–86.00 s |
| 05 — Una nueva oportunidad para aprender | 30.00 s | 86.00–116.00 s |
| 06 — Aprendizaje y contribución · Escenario sintético | 29.00 s | 116.00–145.00 s |
| 07 — Elena · Apoyar a tiempo | 18.00 s | 145.00–163.00 s |
| 08 — ClassAll · Aprender juntos | 6.00 s | 163.00–169.00 s |

## Persisted state verified

`scripts/video/verify.py` opened only the dedicated presentation database in SQLite read-only mode and checked:

- Laura: saved support pulse and explicit help request for topic 1.
- David: approved Mathematics application with professor 3 as reviewer, a saved professor comment and a real subject authorization.
- A new 60-minute, six-seat Mathematics session (ID 9) and Laura’s confirmed booking (ID 10).
- Saved optional pre-session Learning Check submission.
- Host proposal and separate learner confirmation, with `synthetic-two-party` provenance.
- Saved constructive feedback; the learner’s private comment is not shown in David’s portfolio.
- Exactly 40 historical synthetic points plus one new 20-point ledger entry = 60. The recorded UI displays its stored result.
- A human-confirmed professor support action with a saved aggregate evidence snapshot.
- No foreign-key violations; all eight raw scene files exist.

The initializer is unchanged. A safety check tried initializing an existing presentation file: it failed with FileExistsError and its SHA-256 stayed unchanged. No normal `backend/data/classall.sqlite3` file was created in this workspace. Each take uses exclusive creation in a new directory; old takes are retained. No product source or database lifecycle implementation was changed.

## Rendering and review

The renderer measured every source and edited clip with ffprobe, checked exact scene durations, H.264/yuv420p/1080p output, absence of audio, and final duration below 180 seconds. An assemble-only run from existing edited clips also passed on the preceding full render.

Representative raw checkpoints and rendered midpoint frames from all eight scenes were inspected. The sequence covers the Spanish landing page; Laura’s need and related opportunities; David’s four application sections and Pending state; Elena’s evidence review and approval; publishing, booking and a saved pre-check; fictional two-party attendance, feedback and the actual portfolio; aggregate insights and a saved support action; the ClassAll closing landing composition. No visible errors, failed loading states or broken layouts were found in the inspected checkpoints.

A full-range WebM to limited-range H.264 conversion issue found during frame review was corrected. Final encoding explicitly converts the detected source range to BT.709 limited range. Short Spanish scene labels, 150 ms edge fades, modest retiming and result-state holds are applied in FFmpeg. No application DOM was changed to invent an outcome.

Visual review here is based on representative frames and meaningful states, not a complete human screening in real time. Automated checks do not validate subjective pacing or jury comprehension. The team should watch the 2:49 first cut on its laptop before recording its Spanish narration.

## Commands actually exercised

```sh
npm ci --prefix frontend --cache /workspace/work/npm-cache
npm run build --prefix frontend
PLAYWRIGHT_BROWSERS_PATH=/workspace/work/pw CLASSALL_PYTHON=python CLASSALL_CHROMIUM=/usr/bin/chromium node frontend/scripts/record-video.cjs
python scripts/video/verify.py work/video/take-FWgHhT/database/classall-v5-presentation.sqlite3 work/video/take-FWgHhT
python scripts/video/render.py work/video/take-FWgHhT
python scripts/video/render.py work/video/take-JIb2rP --assemble-only
node --check frontend/scripts/record-video.cjs
node --check frontend/scripts/video-story.cjs
python -m py_compile scripts/video/render.py scripts/video/verify.py
```

Managed Linux execution used Node 24, installed Chromium 155 and FFmpeg 7.1.5. Playwright’s FFmpeg CDN download was denied by this environment’s host policy; its local cache executable was linked to the already installed system FFmpeg. Recording and rendering then ran locally. This is an environment setup adaptation, not a product change or network-policy bypass.

## Remaining limits

- Windows PowerShell instructions are documented in VIDEO_PRODUCTION.md, but this execution was on Linux. Actual Windows execution has **not** been claimed or tested.
- The interface, prepared application text, new session and new comments are Spanish. Some inherited synthetic titles/history and topic metadata remain English, and existing translated count wording is imperfect. These are authentic V6.1 states; product copy was preserved.
- No human narration was finalized, recorded or synthesized. Per-scene WAV import is implemented for the later production phase, but has not been exercised with team recordings.
- No optional live AI clip was produced. The main story needs no Ollama; the visible review guide explicitly identifies itself as prepared and advisory.
- No deployment, automatic merge, official certification, independent attendance verification or proven learning-improvement claim is part of this work.
