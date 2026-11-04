# ClassAll V5 — a connected 6–7 minute demonstration

All people, attendance, records and examples are fictional. Keep the API and frontend on loopback. Demo-role selection is not secure authentication. Live Ollama is optional; the main presentation uses prepared content.

## Safe preparation and repetition

The normal database remains at `backend/data/classall.sqlite3`. **Do not delete or reset it.** The V5 initializer exclusively creates a NEW database with the exact filename `classall-v5-presentation.sqlite3`. It refuses existing files and the normal database path. There is no reset API or reset switch.

With dependencies installed and the root virtual environment active, create a new rehearsal directory each time. From the repository root:

```sh
# macOS/Linux; choose a new directory for every rehearsal
PYTHONPATH=backend python -m app.presentation --database work/rehearsal-01/classall-v5-presentation.sqlite3
CLASSALL_DB_PATH="$PWD/work/rehearsal-01/classall-v5-presentation.sqlite3" python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000
```

```powershell
# Windows PowerShell, repository root; choose a new directory each time
$env:PYTHONPATH = (Join-Path $PWD 'backend')
.venv\Scripts\python.exe -m app.presentation --database work\rehearsal-01\classall-v5-presentation.sqlite3
$env:CLASSALL_DB_PATH = (Join-Path $PWD 'work\rehearsal-01\classall-v5-presentation.sqlite3')
.venv\Scripts\python.exe -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000
```

In a second terminal run `npm run dev --prefix frontend`. Open http://127.0.0.1:5173/app. Stop the API before selecting a different database. To repeat, use `rehearsal-02`, then `rehearsal-03`, retaining the previous presentation history. Remove/unset `CLASSALL_DB_PATH` only when intentionally returning to the normal database.

The fresh presentation scenario retains original synthetic history, including David's 40 historical points and past bookings. Only inside this NEW database, his current Mathematics authorization is absent and the original future Mathematics session is hosted by Amira, who receives the corresponding synthetic approval. David retains Statistics authorization. This makes before/after Mathematics publishing permissions demonstrable without rewriting the user's normal database, historical sessions, bookings, answers or publications. Historical synthetic experience does not stand in for current subject authorization.

No model needs to run. **Open prepared review checklist** stores an explicitly prepared rubric checklist, not an invented AI evaluation of the applicant. Optional local feedback uses the existing `qwen3:8b` provider; a failure does not silently substitute prepared output. If wanted, set `CLASSALL_AI_DEMO=true` to disable live generation. The existing prepared Studio example remains available separately.

Default new recognition is 20 points per eligible session. `CLASSALL_CONTRIBUTION_POINTS` configures future awards (integer 1–1000; values outside the range are bounded). Historical ledger entries retain their original values. For this script use the default. No reward depends on test results or feedback ratings.

## English guided presentation — 6 minutes 45 seconds

| Time | Persona / screen | Interaction | Expected visible result | ClassAll principle / suggested narration |
| --- | --- | --- | --- | --- |
| 0:00–0:40 | Laura / **Learning Pulse** | Choose Mathematics → Chain rule. Select “I'm struggling and would like support.” Save check-in, then **Request help with this topic**. | Saved reflection and an open support request. Matching support appears. | **Need without stigma.** “Asking for help is a normal part of learning. These are voluntary reflections and explicit requests, not academic risk labels.” |
| 0:40–1:45 | David / **Become a Tutor** | Briefly open My teaching → Create a session: Mathematics is absent; Statistics remains available. Open Become a Tutor → Start an application. Select Mathematics / Chain rule, fill six short teaching fields, answer both questions and give an explanation. Submit; open prepared review checklist. | Persistent pending application, saved responses, clearly labeled prepared checklist. Refresh once. | **Making strengths visible.** “Students can contribute as well as learn. We ask for knowledge, a teaching plan and an explanation. This checklist supports a professor; it does not make the decision.” |
| 1:45–2:25 | Professor García / **Tutor applications** | Read David's plan and responses. Compare reference answers. Enter comments, choose **Approve subject authorization**, check the human-review confirmation and save. | Approved status, professor ID, decision date, comments and history. | **Academic trust.** “A professor responsible for the subject makes a recorded decision. Other professors cannot approve outside their assigned subjects.” |
| 2:25–3:05 | David / **My teaching → Create a session** | Mathematics now appears. Choose Chain rule. Publish **V5 chain rule peer tutoring**, a future nonoverlapping time, 60 minutes, six seats, fictional library and objectives. | Session appears in teaching and the catalog. No new points yet. | **Approval has real effect.** “The backend now permits Mathematics publishing. This approval does not authorize Physics.” |
| 3:05–3:45 | Laura / **Find support → My sessions** | Search the new session title, book a free seat, open the optional pre-session Learning Check, answer and submit. | Persisted booking and private saved check. Her support request is matched. | **Peer support and formative practice.** “The check supports reflection. Its score does not decide the tutor's recognition.” |
| 3:45–4:25 | David, then Laura / **My teaching**, then **My sessions** | David expands **Synthetic attendance confirmation**, selects Laura's actual booking, acknowledges the fictional demo and proposes attendance. Switch to Laura and explicitly confirm her fictional participation. | Host proposal, then learner confirmation. Session becomes completed and one ledger award is created. | **Documented participation.** “This two-party process is explicitly synthetic. It illustrates an institutional process we would still need to verify independently in production.” |
| 4:25–5:05 | Laura / **My sessions → Past → saved check** | Choose short feedback responses and an optional private reflection; submit. Open the saved pre-check → See progress & demo follow-up → Start post-session check. Answer and submit. | Feedback saved once; post-check available after attendance, with saved private learning history. | **Constructive experience.** “Feedback concerns explanation, preparation and atmosphere. It is not evidence of academic improvement. The check simulation remains a separate mechanism and never awards points.” |
| 5:05–5:50 | David / **My impact** | Open private portfolio, inspect contribution history and refresh. | 60 total points: 40 preserved synthetic history + 20 new two-party synthetic contribution; three documented hours; one newly confirmed learner. Feedback summary is suppressed. | **Meaningful recognition.** “We distinguish recorded activity, documented experience and suggested strengths. One person's feedback stays below our illustrative three-distinct-learner threshold. Nothing is a certificate, credit or university endorsement.” |
| 5:50–6:45 | Professor García / **Learning insights → Support actions** | Review topic-level requests, available support and limited checks. Create an action, select additional practice or a TA session, record rationale, explicitly confirm. For a TA action, choose an approved host and future date and publish. | Persisted action with an aggregate-evidence snapshot; a TA offering uses the normal catalog and booking service. | **Faculty insight and human action.** “Observed demand suggests a support opportunity; it does not prove underperformance. The professor chooses what to do next.” |

Suggested short application content, safe to prepare in a text editor before presenting:

- Motivation: “I enjoy helping classmates feel comfortable asking questions.”
- Experience: “I have studied calculus and supported our informal study group.”
- Topic: “Understanding the chain rule.”
- Objectives: “Identify the inner function and explain why derivatives multiply.”
- Plan: “Start with a diagram, work through an example, then practise together.”
- Activities: “Ask the learner to identify each function and explain the next step.”
- Knowledge reference responses: `3x + 1` and `6(2x + 1)²`. The professor can inspect the prepared references after submission.
- Explanation: “A change in x first changes the inner function, which changes the outer function. Multiply those two rates. For (2x + 1)³, the outer derivative is 3(2x + 1)² and the inner derivative is 2, giving 6(2x + 1)². Let's draw the two stages and try a new example together.”

The old Learning Check demo-completion button is still available for V4 practice, but is unnecessary in this V5 story: Laura's confirmed synthetic attendance unlocks the post-check after her pre-check. Checks remain optional; attendance does not require a test or score.

## Presentación guiada en español — 6 minutos y 45 segundos

Selecciona **ES** en el encabezado antes de empezar. El idioma de la interfaz no traduce los textos escritos por las personas. Puedes escribir el título y la solicitud en español. Todo el escenario es ficticio; los contenidos de cualificación preparados están disponibles en ambos idiomas.

| Tiempo | Persona / pantalla | Interacción | Resultado visible esperado | Principio y narración sugerida |
| --- | --- | --- | --- | --- |
| 0:00–0:40 | Laura / **Pulso de aprendizaje** | Elige Matemáticas → Regla de la cadena. Indica que necesitas apoyo, guarda la reflexión y pulsa **Solicitar ayuda con este tema**. | Reflexión guardada y solicitud abierta con opciones de apoyo. | **Pedir ayuda sin estigma.** «Necesitar apoyo es normal. Son reflexiones voluntarias y solicitudes explícitas, no etiquetas de riesgo académico». |
| 0:40–1:45 | David / **Hazte tutor** | Muestra que Matemáticas aún no aparece en Crear una sesión, aunque Estadística sigue disponible. Abre Hazte tutor → Iniciar una solicitud. Completa los campos, las dos preguntas y la explicación. Envía y abre la guía preparada. | Solicitud pendiente persistente, respuestas guardadas y guía de revisión claramente preparada. Recarga una vez. | **Hacer visibles las fortalezas.** «Un estudiante también puede enseñar. Valoramos sus conocimientos y su propuesta docente. La guía orienta; no decide». |
| 1:45–2:25 | Profesora García / **Solicitudes de tutoría** | Revisa el plan y las respuestas de David, añade comentarios, elige **Aprobar autorización de la asignatura**, confirma la revisión humana y guarda. | Estado aprobado, identidad de revisión, fecha, comentarios e historial. | **Confianza académica.** «La decisión corresponde al profesorado de la asignatura y queda registrada». |
| 2:25–3:05 | David / **Mis tutorías → Crear una sesión** | Ahora selecciona Matemáticas / Regla de la cadena. Publica **Tutoría V5 de regla de la cadena**, fecha futura sin solapamientos, 60 minutos, seis plazas y biblioteca ficticia. | Sesión visible en tutorías y catálogo; todavía sin puntos nuevos. | **Permisos efectivos.** «La autorización habilita realmente la publicación en Matemáticas, pero no en Física». |
| 3:05–3:45 | Laura / **Buscar apoyo → Mis sesiones** | Busca el nuevo título, reserva una plaza gratis, responde a la evaluación previa opcional y envíala. | Reserva persistente y resultado privado. La solicitud queda vinculada al apoyo reservado. | **Apoyo entre iguales.** «La evaluación sirve para reflexionar; su resultado no decide la recompensa del tutor». |
| 3:45–4:25 | David y después Laura / **Mis tutorías**, después **Mis sesiones** | David abre **Confirmación de asistencia sintética**, selecciona la reserva de Laura, reconoce la demostración ficticia y propone la asistencia. Laura confirma su participación ficticia por separado. | Propuesta y confirmación persistentes; sesión completada y una única contribución. | **Participación documentada.** «La asistencia es explícitamente sintética. Una implantación real necesitaría verificación institucional independiente». |
| 4:25–5:05 | Laura / **Mis sesiones → Anteriores → evaluación guardada** | Envía comentarios constructivos y una reflexión privada opcional. Abre la evaluación previa guardada, continúa al progreso y a la evaluación posterior, responde y envía. | Comentarios guardados una sola vez y resultados privados antes y después. | **Experiencia constructiva.** «Los comentarios valoran la experiencia docente, no la inteligencia ni una mejora académica demostrada. La simulación de evaluación es independiente y no concede puntos». |
| 5:05–5:50 | David / **Mi impacto** | Revisa el portafolio, la contribución y recarga. | 60 puntos: 40 históricos sintéticos + 20 nuevos; tres horas documentadas; un estudiante con asistencia nueva confirmada. Resumen de comentarios oculto por muestra pequeña. | **Reconocimiento con significado.** «Separamos actividad registrada, experiencia documentada y fortalezas sugeridas. No hay clasificaciones, certificados ni créditos». |
| 5:50–6:45 | Profesora García / **Información sobre el aprendizaje → Acciones de apoyo** | Revisa la demanda agregada y la disponibilidad. Crea una acción con justificación y confirmación humana: práctica adicional o una sesión de apoyo con un tutor autorizado. | Acción persistente con evidencia agregada; si se publica una sesión, aparece en el catálogo habitual. | **Información y acción docente.** «La demanda no prueba bajo rendimiento. El profesorado interpreta la evidencia y organiza el apoyo». |

Texto breve preparado para David:

- Motivación: «Me gusta ayudar a mis compañeros a preguntar sin miedo».
- Experiencia: «He estudiado cálculo y he colaborado en nuestro grupo de estudio».
- Tema: «Comprender la regla de la cadena».
- Objetivos: «Identificar la función interior y explicar por qué se multiplican las derivadas».
- Plan: «Comenzar con un diagrama, resolver un ejemplo y practicar juntos».
- Actividades: «Pedir al estudiante que identifique cada función y explique el siguiente paso».
- Respuestas de referencia: `3x + 1` y `6(2x + 1)²`.
- Explicación: «Un cambio en x modifica primero la función interior y después la exterior. Multiplicamos esas dos tasas. En (2x + 1)³, la derivada exterior es 3(2x + 1)² y la interior es 2, por lo que obtenemos 6(2x + 1)². Dibujemos las dos etapas y probemos otro ejemplo juntos».

## Rehearsal checks and recovery

- Start a new scenario before presenting; never attempt to replay approval against David's already approved Mathematics application.
- Use the title of the NEW session; the original seeded chain-rule session belongs to Amira in this presentation database.
- If a date overlaps, choose another future time. Do not change historical dates.
- If the API is unavailable, restart it using the same presentation path. Reload preserves completed steps.
- Attendance needs at least one actual confirmed booking, a host proposal and that booking owner's confirmation. Cancelled bookings cannot confirm. Repeated confirmation does not add points.
- Prepared checklists are deliberately generic review prompts, not personalized model output. The professor still inspects the actual explanation.
- Faculty small-group suppression is unchanged. Feedback uses at least three DISTINCT learners across a tutor's sessions. These thresholds are illustrative; they do not establish production privacy guarantees.
- Do not show a single learner's academic answers to a tutor. Only Laura's own role opens her checks.
- To repeat safely, stop the API and initialize a new directory. Existing presentation files are retained and cannot be overwritten by the initializer.
