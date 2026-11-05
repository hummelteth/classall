# ClassAll — Hack4Edu 2026 handover

## Repository and documentation

- The `main` branch contains the ClassAll V6.1 prototype and merged video-production workflow (PR #7).
- The frontend uses React/TypeScript/Vite, the backend uses Python/FastAPI, and local persistence uses SQLite.
- See [README.md](../README.md) for installation, testing and running the application.
- See [VIDEO_PRODUCTION.md](VIDEO_PRODUCTION.md) for the recording/rendering workflow and Windows instructions.
- See [VIDEO_V2_NARRATION_ES.md](VIDEO_V2_NARRATION_ES.md) and [VIDEO_V2_RECORDING_ES.md](VIDEO_V2_RECORDING_ES.md) for the nine audio segments and recording guidelines.
- See [VIDEO_V2_1_DESIGN_REPORT.md](VIDEO_V2_1_DESIGN_REPORT.md) and [VIDEO_V2_1_QA_REPORT.md](VIDEO_V2_1_QA_REPORT.md) for the visual design and QA notes.
- No production hosting or university deployment is included.

## Video files — separate from Git

The real-footage V2.1 silent MP4 is not committed to GitHub. On the original Windows machine, the take is stored at:

`work/video-v2/take-lkSmHc/`

The expected silent video is:

`work/video-v2/take-lkSmHc/final/classall-demo-v2-1-silent.mp4`

Share the video separately through an appropriate file-transfer or shared-drive service. For further adjustments, preserve a copy of the complete take: `raw/`, `recording.json`, `state-qa.json`, the synthetic demo database, `edited/` and render manifests. Generated media and demo databases are intentionally excluded from Git.

The final submission video still needs the team's recorded narration: review the Spanish script, record the nine human voice segments according to the guide, combine them using the documented renderer, watch the full voiced export and submit it in the required format.

## Prototype scope and safeguards

ClassAll is a local proof of concept with fictional characters, synthetic learning records and synthetic participation. It is not production-secured or ready for deployment with real student data. Demo user headers are not authentication. The prototype does not validate academic-risk prediction or demonstrate measured improvements in learning. Faculty decisions are human; optional AI drafts or prepared checklists are advisory. Do not upload personal student data or publicly deploy this demonstration without appropriate security and privacy work.

## GitHub ownership transfer

The intended destination repository is `SantyXP02/classall`.

1. In the repository settings, choose **General → Danger Zone → Transfer ownership** and specify `SantyXP02`.
2. The receiving account accepts the GitHub transfer invitation when prompted.
3. Confirm the repository appears under the destination account and that `main`, other branches and Git history are present.
4. Grant repository access to the other team members as needed.
5. Update local clone remotes if required, and separately share the video files and submission materials.

Ownership transfer and Hack4Edu submission are separate actions; neither is performed by this document.
