# ClassAll Video V2.1 refinement

To reuse the approved V2 recordings with a stronger 126-pixel editorial band, exact opening slogan and recorded-role colors, run `python scripts/video/render_v2_1.py <existing-v2-take>`. This creates `final/classall-demo-v2-1-silent.mp4` and separate V2.1 intermediates; it preserves V1/V2 masters and the approved narration. No new recording is needed.

See the [design report](VIDEO_V2_1_DESIGN_REPORT.md), [Spanish editorial timeline](VIDEO_V2_1_TIMELINE_ES.md) and [QA / exact Windows commands](VIDEO_V2_1_QA_REPORT.md). The renderer uses `-filter_complex` directly instead of `-filter_complex_script`. The original Cloud take is absent; production rendering is to run locally on the user's successful existing Windows take. The documented measured cloud encode is a labeled static fixture.

# ClassAll Video V2 production

V2 adds a nine-segment, 179-second edit to the existing V1 pipeline. All product code and the exclusive-create presentation initializer are unchanged. V1 remains available with its existing commands and eight-scene configuration below. V2 defaults to `work/video-v2/`, unique takes, `v2-scene-*.mp4`, and `classall-demo-v2-silent.mp4`; it does not replace V1 recordings or masters.

## Windows: update, install, record and render V2

Run from the repository root in PowerShell. Commit or stash unrelated local edits before changing branches. Use Python 3.11+, Node 20+ and FFmpeg with ffprobe/libx264 on PATH. No new paid tools, services, Python packages or npm dependencies are introduced.

```powershell
git switch feature/classall-demo-video
git pull --ff-only origin feature/classall-demo-video
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
npm ci --prefix frontend
Push-Location frontend
npx playwright install chromium ffmpeg
Pop-Location
ffmpeg -version
ffprobe -version
$env:CLASSALL_PYTHON = (Resolve-Path .venv\Scripts\python.exe).Path
node frontend\scripts\record-video.cjs --v2
if ($LASTEXITCODE -ne 0) { throw 'Recording failed; inspect the retained take' }
$take = (Get-Content work\video-v2\latest.txt -Raw).Trim()
& $env:CLASSALL_PYTHON scripts\video\render_v2.py $take
if ($LASTEXITCODE -ne 0) { throw 'V2 rendering failed' }
Start-Process (Join-Path $take 'final\classall-demo-v2-silent.mp4')
```

The recorder builds the frontend, chooses loopback ports, starts its own private backend and preview server, creates a fresh isolated database, records the real UI journey and verifies persisted state. Do not set `CLASSALL_DB_PATH` for this command. A new take is retained even after a failure; check command exit status before using `latest.txt`. An alternative media root is supported: `node frontend/scripts/record-video.cjs D:\ClassAll-media-v2 --v2`. Keep all generated media outside Git.

If FFmpeg is absent, one installation option is `winget install --id Gyan.FFmpeg -e`; reopen PowerShell afterward. On Linux use `CLASSALL_PYTHON=python` with backend requirements installed. `CLASSALL_CHROMIUM` can select an installed compatible browser; otherwise use Playwright's installed Chromium. A managed environment may need its own local FFmpeg cache adaptation, described in the QA report; this is not needed on the user's working Windows setup.

## Adjust timing and rerender without recording

Edit `scripts/video/scenes-v2.json`. Durations must be positive whole frames at 30 fps and sum to **strictly less than 180 seconds**. The default is 179 seconds. Update the narration and worksheet if changing the timeline. No database or browser is needed for these commands:

```powershell
$take = (Get-Content work\video-v2\latest.txt -Raw).Trim()
notepad scripts\video\scenes-v2.json
& $env:CLASSALL_PYTHON scripts\video\render_v2.py $take
if ($LASTEXITCODE -ne 0) { throw 'Render failed' }
# Re-encode only scene 4 after changing just that scene:
& $env:CLASSALL_PYTHON scripts\video\render_v2.py $take --scene 4
if ($LASTEXITCODE -ne 0) { throw 'Scene render failed' }
# Reassemble already edited scenes without re-encoding:
& $env:CLASSALL_PYTHON scripts\video\render_v2.py $take --assemble-only
```

A one-scene render requires a previous complete render. Changes to other scenes cause a clear failure so the cached clips cannot silently disagree with the configuration. The renderer reuses V1's FFmpeg/probe helpers. Scenes and masters are encoded to temporary MP4s and replace their V2 targets only after validation, keeping the previous valid file available during rendering. It preserves real important clicks (including 0.85 seconds before the action), recorded result holds and chronological order; routine navigation and form entry are cut. Meaningful footage is retimed only as necessary, with a maximum of 1.35×; longer scenes retain a final saved-state hold. If meaningful footage cannot fit, the render fails rather than discarding the result. `kept_ranges`, playback speed, source hashes, mapped interactions and measured beat timestamps are written to the manifest.

The recording-only pointer is installed on every new document, including reloads. It has no pointer events or focus targets and cannot intercept controls. Its position follows actual browser pointer events; click rings come only from trusted pointer-down events. Playwright moves toward the actual locator box before clicking normally. The overlay never changes saved application state. The film keeps the full application inside a 1748×984 area above a separate 96-pixel editorial band. Names, roles and pillar messages cannot cover application controls. The tiny scaling difference between those dimensions and 16:9 is below 0.1%.

## Four human voices later

Use the complete Spanish script in `VIDEO_V2_NARRATION_ES.md` and the recording worksheet `VIDEO_V2_RECORDING_ES.md`. Deliver nine WAV files to `work/team-voice-v2/`. Names, speakers and scene-relative entry offsets are in `scenes-v2.json`.

```powershell
& $env:CLASSALL_PYTHON scripts\video\render_v2.py $take --audio work\team-voice-v2 --check-audio
if ($LASTEXITCODE -ne 0) { throw 'Missing or overlong voice segments: inspect audio-preflight-v2.json' }
& $env:CLASSALL_PYTHON scripts\video\render_v2.py $take --audio work\team-voice-v2
if ($LASTEXITCODE -ne 0) { throw 'Voice assembly failed' }
Start-Process (Join-Path $take 'final\classall-demo-v2-voiced.mp4')
```

Audio import validates all nine files before encoding, reports missing/overlong recordings together, preserves natural pauses and levels, and adds configured silence before each segment. Each validated voice is aligned inside its own bounded PCM WAV slot; the nine slots are concatenated and encoded once to AAC. Aligned intermediates are retained under `audio-v2/`. It never shortens or time-stretches a recording. Video is copied from the existing silent master; the master is not rewritten. Output is AAC in a separate voiced MP4, still below 180 seconds. The team's actual recordings and final mix must be reviewed together; no voices or music are generated.

## V2 artifacts and QA

Each successful take includes `raw/scene-01.webm` through `scene-09.webm`, `edited/v2-scene-01.mp4` through `v2-scene-09.mp4`, the silent master, recorded checkpoints, `recording.json`, `state-qa.json`, `scene-manifest-v2.json`, `timing-config-v2.json`, a fresh synthetic database, and service logs. The manifest maps source cuts, real click events and persona transitions to the final timeline.

```powershell
& $env:CLASSALL_PYTHON scripts\video\verify.py (Join-Path $take 'database\classall-v5-presentation.sqlite3') $take
& $env:CLASSALL_PYTHON scripts\video\test_v2.py
& $env:CLASSALL_PYTHON scripts\video\review_v2.py $take
Start-Process (Join-Path $take 'frames\review-v2\index.html')
ffprobe -v error -show_streams -show_format (Join-Path $take 'final\classall-demo-v2-silent.mp4')
```

Verification opens only the take database in SQLite read-only mode. V2 additionally checks trusted recorded clicks and the support action's topic, action type, participant/request counts, Learning Check topic, human-review flag and complete captured evidence. Availability is recomputed at the saved decision time, allowing archived takes to be checked after their session dates. The same saved approval, session, booking, formative check, synthetic attendance, private-feedback protection and 40 + 20 = 60 contribution checks remain in place.

Read `VIDEO_V2_QA_REPORT.md` for the measured output, reviewed frames, exercised commands and limits. Watch the complete film before submission: frame review and state checks cannot establish audience comprehension. No deployment or merge is part of this workflow.

---

# ClassAll silent demo production

Base: merged `main` fa9f68f (includes V6.1 54a1df3). This workflow changes no product code. All characters, attendance and evidence are fictional. It requires no Ollama, keys, public hosting, music or speech service.

## Windows PowerShell

From the repository root, install Python 3.11+, Node 20+ and FFmpeg. FFmpeg must provide both `ffmpeg` and `ffprobe` on PATH, with the `libx264` encoder. One Windows installation option is `winget install --id Gyan.FFmpeg -e`; reopen PowerShell after installation. Use your organization's approved installer if winget is unavailable.

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
npm ci --prefix frontend
Push-Location frontend
npx playwright install chromium ffmpeg
Pop-Location
ffmpeg -version
ffprobe -version
ffmpeg -encoders | Select-String libx264
$env:CLASSALL_PYTHON = (Resolve-Path .venv\Scripts\python.exe).Path
node frontend\scripts\record-video.cjs
if ($LASTEXITCODE -ne 0) { throw 'Recording failed: inspect the retained take' }
$take = (Get-Content work\video\latest.txt -Raw).Trim()
& $env:CLASSALL_PYTHON scripts\video\render.py $take
if ($LASTEXITCODE -ne 0) { throw 'Render failed' }
Start-Process (Join-Path $take 'final\classall-demo-silent.mp4')
```

The recording command prepares a fresh database, builds the existing frontend and starts private loopback FastAPI/Vite preview services on available ports, records eight independent WebMs, checks persisted state, stops services, and retains its take. No separately running development servers are needed. Every invocation creates `work/video/take-<unique>/database/classall-v5-presentation.sqlite3` using the unchanged `app.presentation` exclusive-create initializer. The V5 filename is its required compatibility name. There is no reset command; existing takes and the normal database are preserved. Do not set CLASSALL_DB_PATH yourself for this workflow.

On Linux/macOS use `CLASSALL_PYTHON=python` with the project's activated environment. When using an existing compatible Chromium, set `CLASSALL_CHROMIUM` to its executable path. Otherwise install Playwright Chromium as above. Use `node frontend/scripts/record-video.cjs <output-root>` for an alternative local media directory.

## Adjustable edit and repeat render

Edit only `scripts/video/scenes.json` for scene durations. The default is 169 seconds. Keep the total under 180. Re-render from existing raw recordings; no browser journey or database changes occur:

```powershell
$take = (Get-Content work\video\latest.txt -Raw).Trim()
& $env:CLASSALL_PYTHON scripts\video\render.py $take
```

To assemble the existing edited MP4 clips without raw files or re-encoding:

```powershell
& $env:CLASSALL_PYTHON scripts\video\render.py $take --assemble-only
```

Clips use actual recorded browser imagery, short fades, limited retiming (0.8–1.4×) and holds on result states. If the complete meaningful recording cannot fit, rendering fails rather than cutting off an action. Increase that scene's duration, reduce another, or adjust intentional holds in `frontend/scripts/video-story.cjs` and record a new take. The default edit contains short Spanish scene labels for three seconds, but no subtitles or audio. Beat notes remain worksheet metadata. Labels use a local Unicode TrueType font (Arial on Windows, DejaVu Sans on Linux); use `--font <path.ttf>` to choose another font.

A take contains:

```text
raw/scene-01.webm … scene-08.webm
edited/scene-01.mp4 … scene-08.mp4
final/classall-demo-silent.mp4
frames/                         # real UI checkpoints and rendered midpoints
recording.json                  # capture beats
scene-manifest.json             # measured durations and final positions
timing-config.json              # snapshot of the edit configuration
narration-worksheet-es.md        # generated from actual edit
state-qa.json                   # read-only database verification
services.log
database/classall-v5-presentation.sqlite3
```

All media and temporary databases live under ignored `work/`. Do not add them to Git. Preserve a take when sharing feedback so its database evidence and narration timings remain aligned. `latest.txt` can point to a failed take; check recording exit status and state-qa.json before rendering.

## Later team narration

Review the silent film before writing full narration. Record one WAV per scene, named `scene-01.wav` through `scene-08.wav`. No speech is generated by this repository.

```powershell
& $env:CLASSALL_PYTHON scripts\video\render.py $take --audio work\team-voice
```

This additionally creates `classall-demo-voiced.mp4`. Each audio file starts at its scene boundary, is padded with silence if shorter, and must not exceed the scene duration. Longer recordings cause an explicit failure; adjust scene timing before rerendering. The silent master is retained.

## QA and recovery

Recording stops on JavaScript errors or API errors. Fixed 1920×1080 viewport, 100% browser zoom, Spanish interface and Europe/Paris timezone are used. Synthetic scenario facts are checked by `scripts/video/verify.py` using SQLite read-only mode. Do not represent the prepared review checklist as live AI, synthetic attendance as verified real attendance, portfolio points as official certification, or formative checks as proof of learning improvement.

To repeat a database check:

```powershell
& $env:CLASSALL_PYTHON scripts\video\verify.py (Join-Path $take 'database\classall-v5-presentation.sqlite3') $take
ffprobe -v error -show_streams -show_format (Join-Path $take 'final\classall-demo-silent.mp4')
```

Inspect every rendered scene and representative checkpoint images. Automated checks establish successful state transitions, codec, dimensions and duration; they do not establish subjective film quality. Watch the assembled film on a laptop before submission.

This workflow's Windows commands are provided for reproduction; actual Windows execution is reported separately in VIDEO_QA_REPORT.md. No public deployment is part of production.

