# ClassAll Video V2.1 — visual design

This is a separate editorial render of the V2 take, retaining nine scenes, 179 seconds, recorded pointer/click effects, real interactions and the approved four-person narration. No product code or recording journey changes. Production-footage screening remains pending because the original V2 take is not present in this session.

## Palette grounded in the frontend

The effective V6.1 tokens in `frontend/src/experience.css` are violet `#6550B5`, teal `#29685C`, paper `#FAF9F6` and ink `#2D3330`. They override the older violet in `styles.css`.

| Identity | Accent | Relationship | White-text contrast |
|---|---|---|---:|
| CLASSALL | #6550B5 | Exact current violet token | 6.24:1 |
| LAURA MARTÍN · ESTUDIANTE | #355F87 | Muted blue extension, similar lightness to the existing teal | 6.69:1 |
| DAVID CHEN · ESTUDIANTE / TUTOR | #29685C | Exact current teal token; green contribution identity | 6.50:1 |
| ELENA GARCÍA · PROFESORA | #87621F | Muted warm gold extension of the warm paper palette | 5.53:1 |

Blue and gold are new editorial accents, not existing application tokens. All identity text exceeds WCAG AA normal-text contrast. Names and written roles supplement every color. Main text uses ink on paper; secondary pillar text uses brand violet on paper. No color conveys a decision on its own.

## Composition and typography

- Output: 1920×1080, 30 fps; independent band at y=954, height 126 px, including a 5 px role-colored top rule.
- Application: complete 1696×954 rectangle, x=112, y=0. This is exactly 16:9. No application crop, cover or stretch. Unexpected non-16:9 recordings fail explicitly.
- Identity panel: x=40, y=969, 472×98. Name 28 px, role 20 px, concept 18 px; white on the current accent. Brand label 34 px.
- Main message: x=552, y=982, 32 px; introductory slogan 34 px. Pillar at x=554, y=1035, 20 px. Positions remain stable across scenes.
- Unicode TrueType: Arial on Windows by default; DejaVu Sans on Linux; Arial on macOS. `--font` selects a supplied TTF. No font download or dependency. This keeps the frontend's sans-serif character while retaining the existing portable font workflow.

The exact opening sentence is **Cada estudiante tiene algo que aprender y algo que aportar.** Its full wording and punctuation remain intact, with a subordinate three-pillar line. At the tested DejaVu Sans size, it measures about 1033 px against 1328 px of available width. Arial and custom-font layouts must also be reviewed locally.

The role concepts are «Necesita apoyo», «Comparte conocimientos» and «Orienta el apoyo». The educational message remains the main line; one relevant pillar reinforces it. Scene 4 uses «DECISIÓN ACADÉMICA HUMANA». Scene 7 retains the explicit synthetic example qualification. Scene 6 retains optional formative evaluation. The closing connects the three pillars with needs, strengths, peer support and academic action.

## Motion and story continuity

Persona events come from the existing recording, mapped through V2's unchanged kept ranges and playback speed. There are no speaker-based or arbitrary-timestamp role guesses. A missing persona event fails instead of inventing a role. In Scene 7, David → Laura → David follows the real recorded interface while Speaker 3 continues narrating.

At a persona switch, the accent changes immediately and the new identity text fades in over 180 ms. The old identity disappears at the exact boundary; no overlapping names. This is a deliberate short color cut rather than a continuous color interpolation, making fast switches unambiguous. The existing 150 ms scene fades remain. Pillar changes use the scene fade; no added flashing, pulsing or extra timeline duration.

## Preservation and review limits

V2.1 has its own renderer, configuration, text files, filter diagnostics, edited clips, manifest, timing snapshot, audio slots, preflight report and silent/voiced masters. It reads V2 raw recordings and verified-state metadata. Original V1/V2 masters, narration and recording scripts remain unchanged. No voices or music are generated.

The application is roughly 3% smaller than V2's 984-pixel-tall composition. Readability, cursor visibility, actual role synchronization and the before/after effect must be checked on the original footage and a laptop before submission. Fixture checks cannot establish those production qualities.
