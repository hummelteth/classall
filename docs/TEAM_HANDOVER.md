# ClassAll — team handover (Hack4Edu 2026)

## Project ownership and collaboration

ClassAll was developed for Hack4Edu 2026 through the ideas, product decisions, iterative feedback and creative direction of its **four official team members**. One official team member also actively assisted with prompting and iteration of the AI-assisted development workflow.

**Tim Hummel supported the team as an external technical collaborator**, including coding, integration, GitHub/Codex-assisted implementation and the demonstration-video production workflow. The person shown as author of Git commits is the person who performed those commits; commit attribution alone does not describe the contributions of the whole team. This acknowledgment is not a claim that any individual built or designed ClassAll alone.

The team should decide how to identify its members individually in the Hack4Edu submission. The intended new repository owner is **[SantyXP02](https://github.com/SantyXP02)**, an official team member. Repository ownership transfer must be accepted by that GitHub account.

## Source-code handover status

- Main branch contains the ClassAll V6.1 prototype and the merged video-production workflow (PR #7).
- The UI is React/TypeScript/Vite; the API is Python/FastAPI; local storage is SQLite.
- Use [README.md](../README.md) for install, test and launch instructions.
- Use [VIDEO_PRODUCTION.md](VIDEO_PRODUCTION.md) for repeatable recording/rendering and Windows instructions.
- Use [VIDEO_V2_NARRATION_ES.md](VIDEO_V2_NARRATION_ES.md) and [VIDEO_V2_RECORDING_ES.md](VIDEO_V2_RECORDING_ES.md) for the nine audio segments assigned to the four speakers.
- Use [VIDEO_V2_1_DESIGN_REPORT.md](VIDEO_V2_1_DESIGN_REPORT.md) and [VIDEO_V2_1_QA_REPORT.md](VIDEO_V2_1_QA_REPORT.md) for the final editorial design and validation.
- No production hosting or university deployment is included.

## Media handover — separate from Git

**The final real-footage V2.1 silent MP4 is not stored in GitHub.** On the original Windows machine the successful take is under:

`work/video-v2/take-lkSmHc/`

Its expected silent output is:

`work/video-v2/take-lkSmHc/final/classall-demo-v2-1-silent.mp4`

The team should receive the silent MP4 separately using a shared drive or other file transfer. To recreate/adjust the video, preserve or separately archive the complete take: `raw/`, `recording.json`, `state-qa.json`, the synthetic demo database, `edited/` and the saved render manifests. Generated media and demo databases are intentionally gitignored.

The final spoken entry remains a **team task**: review the Spanish script, record nine human voice segments using the indicated filenames and offsets, mix the voiced film with the documented renderer, review it end-to-end and submit the approved final MP4. The repository includes no generated voices.

## Prototype scope and safeguards

ClassAll is a local proof of concept using fictional people, synthetic learning records and synthetic participation. It is not an institution-ready or production-secured service. The demo role header is **not real authentication**. There is no validated academic-risk prediction or evidence of measured learning improvement. Faculty decisions are human; any AI-assisted drafts or prepared checklists are advisory. Do not upload real student data or publicly deploy this demonstration without a security/privacy redesign.

## Suggested repository transfer procedure

1. Confirm the four-person team's chosen long-term repository owner, e.g. `SantyXP02`, and that they accept responsibility.
2. Review [main](https://github.com/hummelteth/classall/tree/main), the README, team acknowledgment, and this handover note.
3. Current owner: open the repository's **Settings → General → Danger Zone → Transfer ownership**, enter the requested repository name and intended account `SantyXP02`, and confirm.
4. The receiving account must accept the transfer invitation when GitHub requests it. Verify the repository appears under the new owner's account and that `main` and the history remain present.
5. New owner: grant appropriate repository access to the other three official team members. Confirm their access and update cloned Git remotes if desired.
6. Separately share the actual video MP4, recordings, and any required submission materials. Verify the final jury submission meets the organizer's rules.

This handover note records project provenance and operational next steps. It does not itself execute GitHub ownership transfer or submit the Hack4Edu entry.
