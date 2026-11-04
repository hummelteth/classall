# ClassAll Video V2 — QA report

Review date: 2026-11-05 (Europe/Paris). Branch: `feature/classall-demo-video`; existing PR #7. Starting commit: `2c45301aa09418f403d9648d9c2b6f83e49d97bf` (the validated V1 pipeline on merged V6.1).

## Delivered silent first cut

Final take: `work/video-v2/take-TrSYmU/`. Master: `final/classall-demo-v2-silent.mp4`.

Measured duration: **179.00 seconds**, strictly below 180 seconds. Encoding: 1920×1080, 30 fps, H.264 / yuv420p, MP4, BT.709 limited range, faststart. Exactly one video stream; **no audio or subtitle stream**. The 179-second timeline contains 5370 video frames. Nine independent raw WebMs and nine edited MP4 scenes are retained.

SHA-256: `15af50df4af2a04c948c992503484afffaca70728e28432f9db775ef4863db00`.

| Scene | Measured final interval | Duration | Meaningful footage rate |
|---|---|---:|---:|
| 01 | 0.00–20.00 s | 20.00 s | 0.815× |
| 02 | 20.00–49.00 s | 29.00 s | 0.938× |
| 03 | 49.00–74.00 s | 25.00 s | 0.857× |
| 04 | 74.00–93.00 s | 19.00 s | 1.178× |
| 05 | 93.00–111.00 s | 18.00 s | 0.800× |
| 06 | 111.00–136.00 s | 25.00 s | 0.800× |
| 07 | 136.00–159.00 s | 23.00 s | 1.055× |
| 08 | 159.00–174.00 s | 15.00 s | 1.131× |
| 09 | 174.00–179.00 s | 5.00 s | 0.983× |

## Changes from V1

- A nine-segment story separates David's publication from Laura's booking, preserving the required authorization-before-publication order. The film opens with the real landing page and an editorial question about unseen support needs, then the three pillars.
- A visible, noninteractive recorded pointer follows real Playwright coordinates. Smooth approaches and subtle 750 ms click rings come from trusted browser pointer events. The pointer moves to the margin after clicking so saved results remain readable. A context init script restores the overlay across navigation and reloads.
- A separate 96-pixel band identifies the actual interface and reinforces the pillars without covering controls. Laura, David and Elena are identified at every perspective change, including the brief two-party participation exchange. No fake app notifications or analytics are introduced.
- The edit retains important clicks and the actual click preceding each checkpoint. It cuts routine navigation, typing and repeated form inspection, with modest retiming and longer saved-state holds. A frame-review issue where an older session remained in view after publishing was corrected by scrolling the newly saved session into view.
- The complete Spanish script has **294 words**, four assigned speakers, nine separate recordings, exact time slots, word counts, estimated 120–140 wpm durations, pause budgets and handover cues. Approximate speech at 130 wpm: 135.7 seconds; the rest allows pauses and reading outcomes.
- A simple FFmpeg audio importer validates every segment before encoding, aligns entry offsets, keeps natural pauses, reports overruns and creates a separate voiced MP4 while preserving the silent master.

## Recordings and persisted state

Two complete V2 UI takes succeeded: `take-BmySsg` and the corrected `take-TrSYmU`. Both passed read-only verification. The first draft rendered to 179.00 s; the corrected take is the delivered master. An initial cloud attempt could not bind a loopback port in the restricted command sandbox; rerunning with the environment's supported network-enabled execution allowed the private services. No application changes were needed.

The final recorder completed with no JavaScript errors, failing API responses or unexpected failed API requests. It captured 57 trusted pointer clicks and 11 explicitly emphasized actions. SQLite was opened using `mode=ro` for post-recording checks:

- Laura's voluntary topic-1 support pulse and explicit help request persisted.
- David's Mathematics application is approved by professor 3, with comments and actual subject authorization. Approval precedes publication in the captured UI journey.
- Newly published session ID 9 is owned by David; Laura's confirmed booking ID 10 references that exact session.
- The optional pre-session Learning Check submission persisted. No learning-improvement claim is made.
- Synthetic attendance has `synthetic-two-party` provenance and separate learner confirmation. Constructive feedback persisted. The recorded portfolio check confirms Laura's private reflection is absent from David's view.
- The actual UI and ledger show 40 historical synthetic points plus exactly one new 20-point entry: **60 total**. They are documented demo contributions, not official credits or certifications.
- Elena's `practice` action has the correct topic, rationale, human-review flag, synthetic flag and capture timestamp. Its complete saved aggregate snapshot, including Learning Check evidence, was compared with the available state at the saved capture time through the same read-only connection, so archived takes remain verifiable after their session dates. Participant and open-request counts were also checked directly with SQL.
- Foreign-key verification returned no errors.

The unchanged initializer was run against an existing take and refused it with FileExistsError; the database SHA-256 stayed unchanged. No `backend/data/classall.sqlite3` exists in this workspace. All recording writes use newly created isolated take databases. V2 uses a separate default media root and versioned edited/final filenames. Existing raw clips and masters were not deleted. No product frontend/backend source or normal database lifecycle code changed; V1's renderer and scene configuration remain unchanged.

## Visual and encoding review

`review_v2.py` extracted **71 representative final-output frames**, covering every scene start/end, persona change, explicitly emphasized click and saved-result checkpoint. Full-size frames and contact sheets were inspected for the opening, Laura's request, David's application, Elena's review and authorization, the newly published session, Laura's reservation and optional result, synthetic participation and feedback, actual 60-point portfolio, aggregated evidence/action and closing.

The pointer and click rings are visible in the encoded output; reviewed rings align with the real actions. Persona labels match the current interface, including David → Laura → David in the synthetic exchange. Pillar messages remain outside the application. Controls and important saved results remain readable, with no error screens or loading failures in reviewed frames. The interface controls are Spanish. Some inherited synthetic history/session titles and topic metadata remain English; no product copy or historical records were rewritten for the film.

The complete final MP4 was decoded with FFmpeg without errors and its 5370 frames were counted with ffprobe. Automated output checks validate each scene's codec, frame rate, dimensions, pixel format, absence of audio and exact assigned duration. Final runtime is measured after concatenation. A single-scene rerender and an assemble-only pass succeeded without rerecording or database writes. Scenes and masters now replace their V2 targets only after a temporary MP4 has passed validation. A decoder attempt that overlapped an earlier reassembly was repeated sequentially against the completed atomic output; that final check passed.

This review uses representative frames and continuous decoder validation; it is **not a full real-time human screening**. The team must watch the entire film on its intended laptop to judge pacing, comprehension and the eventual voice performance. No claim of demonstrated educational effectiveness is made.

## Audio and regression checks

Four focused editorial-safety tests pass: preserve a real key action before the first result checkpoint and map its time correctly; reject exactly 180 seconds; keep a previous valid master when reassembly validation fails; report missing and overlong voice files without touching the silent master. Node syntax checks, Python compilation and the production TypeScript/Vite build pass.

An actual FFmpeg integration smoke test used nine **test-only WAVs with silence and single-sample alignment markers**, not synthesized voices, narration or music. A 30-second overlong segment was rejected before encoding. Nine fitting segments then aligned and exported successfully, with video copied and AAC audio present, final duration below 180 seconds, and the original silent-master SHA-256 unchanged. All nine markers were checked in the aligned PCM files: each starts at the configured entry offset plus its original 100 ms leading pause, with exactly the assigned scene sample count. A mixed-stream padding failure found in the final smoke test was removed by aligning bounded PCM slots and concatenating them before a single AAC encode. Test audio and its video are excluded from the deliverable media bundle. The team has not yet supplied human recordings.

## Commands exercised in this Linux environment

```sh
npm ci --prefix frontend --cache /workspace/work/npm-cache
npm run build --prefix frontend
PLAYWRIGHT_BROWSERS_PATH="$PWD/work/pw" CLASSALL_PYTHON=python CLASSALL_CHROMIUM=/usr/bin/chromium node frontend/scripts/record-video.cjs --v2
python scripts/video/verify.py /workspace/classall/work/video-v2/take-TrSYmU/database/classall-v5-presentation.sqlite3 /workspace/classall/work/video-v2/take-TrSYmU
python scripts/video/render_v2.py /workspace/classall/work/video-v2/take-TrSYmU
python scripts/video/render_v2.py /workspace/classall/work/video-v2/take-TrSYmU --scene 4
python scripts/video/render_v2.py /workspace/classall/work/video-v2/take-TrSYmU --assemble-only
python scripts/video/review_v2.py /workspace/classall/work/video-v2/take-TrSYmU
python scripts/video/test_v2.py
node --check frontend/scripts/record-video.cjs
node --check frontend/scripts/video-story.cjs
node --check frontend/scripts/video-director.cjs
python -m py_compile scripts/video/render.py scripts/video/render_v2.py scripts/video/review_v2.py scripts/video/verify.py
```

Execution used Node 24, installed Chromium, Python 3.12 and FFmpeg 7.1.5. Playwright's recording FFmpeg executable was linked to the installed system FFmpeg inside ignored `work/pw/ffmpeg-1011/`; no dependency was added to the repository.

## Windows handoff and remaining review

Exact copyable PowerShell commands for branch updates, dependency installation, fresh recording, rendering, opening, timing adjustment, a single-scene rerender, reassembly and later voice import are in `VIDEO_PRODUCTION.md`. The team's WAV delivery instructions and file names are in `VIDEO_V2_RECORDING_ES.md`. **This execution was on Linux; Windows V2 execution is not claimed.** V1 was already confirmed by the user on Windows.

Source and documentation are delivered on the existing video branch and PR #7. Large media remains outside Git. The MP4 and an editable take bundle with raw/edited clips, manifests, synthetic verification evidence and review frames are retained under `work/video-v2/handoff/` in the cloud workspace. The configured chat-output directory `/codex/browser/projectless/0009-files-pasted-by-the-user-uploaded-pasted-text-po/output` could not be created: it is absent and its parent is not writable by this environment. No direct chat media attachment is claimed. Retrieve the retained archive from the cloud workspace or regenerate locally with the documented commands. Download or rerender these explicitly on Windows; cloud media does not appear on the laptop automatically. No merge or public deployment was performed.
