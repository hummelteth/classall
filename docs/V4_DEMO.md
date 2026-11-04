# ClassAll V4 — bilingual Hack4Edu demonstration

Use fictional people and original synthetic materials only. Do not delete a database.
The EN/ES selector controls the interface; the Studio's content selector controls
new educational content. Original titles, descriptions, professor edits and source
text keep their original language.

## Reliable prepared demonstration (no Ollama needed)

1. **EN:** Switch to Tutor → Create a session. Publish a new Mathematics / Chain rule
   session on a free future date. This provides a clean assessment destination while
   keeping all original bookings and results.
   **ES:** Cambia a Tutoría → Crear una sesión. Publica una sesión nueva de Matemáticas /
   Regla de la cadena en una fecha futura libre. Así conservamos las reservas y resultados anteriores.
2. **EN:** Switch to Professor → AI Learning Studio. Explain the local status indicator.
   Choose ES in the header; the interface changes immediately and survives reload.
   **ES:** Cambia a Profesorado → Estudio de aprendizaje con IA. Comprueba el estado local.
   El selector EN/ES cambia la interfaz y conserva la preferencia al recargar.
3. **EN:** Select educational content language, then Open prepared example. Point to
   the **Prepared example** badge: these are prewritten examples, not a live inference.
   The repository's original PDF and extracted passages remain local.
   **ES:** Elige el idioma del contenido y abre el ejemplo preparado. La etiqueta
   indica que son ejemplos previamente escritos, no una generación en tiempo real.
4. **EN:** Inspect/edit the proposed topic, concepts, summary and objectives. Save
   them with the review checkbox. Open a source passage and verify its page.
   **ES:** Revisa el tema, los conceptos, el resumen y los objetivos. Guárdalos con
   la casilla de revisión. Consulta un fragmento y su página de origen.
5. **EN:** Explain that the two pre and two post questions cover the same objectives
   with distinct wording. Edit one question; save before approval. Reject an item
   to show publication remains blocked, then correct/review it. Approve all four.
   **ES:** Las dos preguntas iniciales y las dos finales cubren los mismos objetivos
   con enunciados distintos. Edita y guarda una pregunta. Rechaza otra para mostrar
   el bloqueo de publicación; corrígela y apruébala. Revisa las cuatro.
6. **EN:** Confirm academic review and publish the complete pair. Assign it to the
   new compatible tutoring session. Published versions are immutable.
   **ES:** Confirma la revisión académica y publica ambas evaluaciones. Asígnalas a
   la nueva sesión compatible. Las versiones publicadas son inmutables.
7. **EN:** Switch to Learner. Book that session, open its pre-check, answer and submit.
   Answers/explanations are shown only after submission. Simulate completion using
   the labelled demo control in My progress, then complete the distinct post-check.
   **ES:** Cambia a Estudiante, reserva la sesión y envía la evaluación inicial.
   Las respuestas correctas y las explicaciones aparecen después del envío. Simula
   la finalización desde Mi progreso y completa la evaluación final diferente.
8. **EN:** Reload saved results, switch interface language and show that published
   content retains its reviewed language. Return to professor insights: small
   groups remain suppressed; differences do not prove a tutoring effect.
   **ES:** Recarga los resultados y cambia la interfaz: el contenido conserva el
   idioma aprobado. Las vistas docentes siguen ocultando los grupos pequeños;
   las diferencias no prueban un efecto de la tutoría.
9. **EN:** Create a new draft revision. Its edits do not change earlier results.
   **ES:** Crea una nueva versión en borrador. Los cambios no alteran los resultados anteriores.

## Real Windows / Intel Arc Ollama verification — outstanding in Cloud

Run these checks on the target laptop. Record version/model, duration and success;
do not report the supplied GPU observations as new measurements.

1. Stop ClassAll, back up the SQLite file while stopped, update dependencies using
   the README, then restart both loopback-bound services. Verify existing bookings,
   groups, Pulse and old check results remain.
2. Run `ollama --version`, `ollama list`, `ollama show qwen3:8b` and the `/api/tags`
   command from README. Confirm the exact model tag and local endpoint.
3. Open Studio and click Check connection. It must report Local AI connected.
   Check Ollama's structured `/api/chat` support with the installed version. The
   provider sends `format` as a JSON schema and `think: false` by default; unknown
   or incompatible response formats must fail honestly, without publishing content.
4. Upload `docs/demo/chain-rule.pdf`; choose one short passage and EN content.
   Analyze live. Verify the live-local badge, source IDs/pages, editable concepts,
   summary and objectives. Inspect citations and academic meaning manually.
5. Approve one objective, request one introductory question per stage and generate.
   Record elapsed wall time. Inspect Ollama's own `ollama ps` output for GPU/context
   information. Inspect both sets, distractors, reasoning and explanations yourself.
   Do not infer psychometric comparability solely from matching difficulty labels.
6. Repeat with ES content. Inspect natural language and mathematical notation. A
   professor can correct generated text, but a valid schema is not proof of correctness.
7. Increase to two objectives / two questions per stage. If output truncates or the
   timeout/context guard triggers, reduce the batch/passage, or deliberately increase
   the relevant environment limit within the documented bounds and restart the API.
8. Review, publish and assign to a new session. Complete both learner checks, reload
   results and create a revised draft. Verify scores, histories, secrecy and unchanged
   published snapshots.
9. Stop Ollama; check status and try a live action. Confirm recovery text and that
   **Open prepared example** remains available. Restart Ollama and recheck connection.
10. Confirm no browser request targets port 11434 and no document is uploaded to an
    external AI service. Keep API/frontend bound to 127.0.0.1; do not deploy publicly.
