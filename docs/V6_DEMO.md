# ClassAll V6 — Hack4Edu demonstration / demostración

**Aprender juntos. Reconocer fortalezas. Apoyar a tiempo.**

The story is unchanged: Laura needs help → David shares his knowledge → García authorizes → Laura receives support → David receives recognition → García organizes support. V6 improves how the story is presented. Keep the main story to about **6 minutes 45 seconds** with prepared text; show Studio as an optional encore. Automated journeys verify the transitions, not a human presentation time.

## Prepare safely / Preparar sin perder datos

Install and run using the repository README. Use the existing V5 exclusive-create initializer with a **new dedicated directory for each rehearsal**. The filename remains `classall-v5-presentation.sqlite3`; this is intentional compatibility with the existing scenario. It refuses existing files and the normal application database.

macOS/Linux, from the repository root with `.venv` activated:

```sh
demo_directory=$(mktemp -d "${TMPDIR:-/tmp}/classall-v6-XXXXXX")
export CLASSALL_DB_PATH="$demo_directory/classall-v5-presentation.sqlite3"
PYTHONPATH=backend python -m app.presentation --database "$CLASSALL_DB_PATH"
python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000
```

Windows PowerShell, from the repository root with `.venv` activated:

```powershell
$demoDirectory = Join-Path $env:TEMP ("classall-v6-" + [guid]::NewGuid().ToString())
New-Item -ItemType Directory -Path $demoDirectory
$env:CLASSALL_DB_PATH = Join-Path $demoDirectory "classall-v5-presentation.sqlite3"
Push-Location backend
python -m app.presentation --database $env:CLASSALL_DB_PATH
Pop-Location
python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000
```

In another terminal / En otra terminal:

```sh
npm run dev --prefix frontend
```

Open `http://127.0.0.1:5173/`. Choose EN or ES in the header. The optional **Guided demo / Demostración guiada** is in the application sidebar, including the mobile menu. It switches persona and screen; complete every action yourself. At 768px and 390px, open navigation with the menu button. Escape closes it and restores keyboard focus.

Do not reset or delete `backend/data/classall.sqlite3`. Reuse a rehearsal by restarting with its existing `CLASSALL_DB_PATH`; create a different new directory to repeat from the beginning. Do not run the initializer against an existing rehearsal. All people and interactions are fictional. No live AI is needed.

No borres ni reinicies `backend/data/classall.sqlite3`. Para continuar un ensayo, conserva su ruta. Para empezar otro, crea un directorio nuevo. No vuelvas a inicializar un archivo existente. Todo es ficticio y no se necesita IA en tiempo real.

## English — 6:45

| Time | Persona / action | Show and say |
| --- | --- | --- |
| 0:00–0:30 | Landing → Laura | Point at the three pillars. “Needs and strengths become a shared university resource.” Enter the demo; **Request support** opens the voluntary topic reflection. |
| 0:30–1:00 | Laura / Learning Pulse | Choose Mathematics / Chain rule. Save a support reflection, then explicitly **Request help with this topic**. Reflection and request are separate; neither diagnoses academic risk. Show relevant tutoring and study groups. |
| 1:00–2:00 | David / Become a Tutor | In the dedicated scenario, Mathematics is initially unauthorized. Start an application. Move through topic → teaching ideas → knowledge/explanation → review. Paste the prepared short responses below; answer the two displayed questions. Submit and show Pending plus the prepared advisory checklist. |
| 2:00–2:40 | García / Tutor applications | Open teaching, knowledge and explanation evidence. Compare the references. Add comments, choose **Approve subject authorization**, confirm the human decision and save. AI/checklists do not authorize anyone. |
| 2:40–3:15 | David / My teaching | Mathematics is now available. **Create a session** for Chain rule, 60 minutes, six places, a future nonoverlapping date and fictional library. Publish. A published session or booking does not award points. |
| 3:15–3:55 | Laura / Find support | Search the new title, open the session and **Book a free seat**. Show the saved booking and complete its optional pre-session Learning Check. |
| 3:55–4:45 | David, then Laura | David opens **Synthetic attendance confirmation**, selects Laura's real booking and proposes attendance with consent. Laura separately confirms her fictional participation in **My sessions**. Show the saved state and send constructive feedback. |
| 4:45–5:20 | Laura / My learning and impact | Open the post-session check through the learning record. Answer and submit. Related sessions sit under the topic; each keeps its own questions/results. “These are limited formative snapshots, not proof of a tutoring effect.” |
| 5:20–6:00 | David / My impact | Show 60 points after exactly one new eligible contribution: 40 historical synthetic points + 20 new. Three documented sessions/hours follow the 60-minute example; read the actual values. Expand the record source and refresh. Tiny feedback remains suppressed; no certification or ranking. |
| 6:00–6:45 | García / Learning insights → Support actions | Follow **Observation → Interpretation → Human action**. Review available topic evidence and capacity; create a reasoned, human-confirmed support action. Show its persisted evidence snapshot. “Faculty decide what support to offer.” |

## Español — 6:45

| Tiempo | Persona / acción | Mostrar y explicar |
| --- | --- | --- |
| 0:00–0:30 | Portada → Laura | Señala los tres pilares. «Convertimos necesidades y fortalezas individuales en un recurso compartido». Entra en la demostración; **Solicitar apoyo** abre la reflexión voluntaria. |
| 0:30–1:00 | Laura / Pulso de aprendizaje | Elige Matemáticas / Regla de la cadena. Guarda la reflexión y solicita ayuda expresamente. Reflexión y solicitud son distintas; ninguna diagnostica riesgo académico. Muestra las tutorías y los grupos relacionados. |
| 1:00–2:00 | David / Hazte tutor | En este escenario David aún no tiene autorización en Matemáticas. Abre la solicitud: tema → ideas docentes → conocimientos y explicación → revisión. Pega las respuestas preparadas, responde a las dos preguntas y envía. Muestra el estado pendiente y la guía orientativa preparada. |
| 2:00–2:40 | García / Solicitudes de tutoría | Abre el plan, las respuestas y la explicación. Compara las referencias, escribe comentarios, elige **Aprobar autorización de la asignatura**, confirma la decisión humana y guarda. La IA no autoriza a nadie. |
| 2:40–3:15 | David / Mis tutorías | Matemáticas ya está disponible. **Crear una sesión**: regla de la cadena, 60 minutos, seis plazas, fecha futura sin solapamientos y biblioteca ficticia. Publica; aún no se conceden puntos. |
| 3:15–3:55 | Laura / Buscar apoyo | Busca el título nuevo, abre la sesión y reserva gratis. Muestra la reserva guardada y responde a su evaluación previa opcional. |
| 3:55–4:45 | David y después Laura | David abre la confirmación de asistencia sintética, selecciona la reserva real de Laura y propone su asistencia con consentimiento. Laura confirma su participación ficticia por separado en **Mis sesiones** y envía comentarios constructivos. |
| 4:45–5:20 | Laura / Mi aprendizaje e impacto | Abre y completa la evaluación posterior desde el registro de aprendizaje. Las sesiones del mismo tema se agrupan; cada una conserva sus preguntas y resultados. «Son observaciones formativas limitadas; no demuestran un efecto de la tutoría». |
| 5:20–6:00 | David / Mi impacto | Tras una contribución nueva elegible: 40 puntos históricos simulados + 20 nuevos = 60. Lee las sesiones y horas realmente registradas. Abre el origen del registro y recarga. Los comentarios de muestras pequeñas siguen ocultos. No hay certificación ni clasificación. |
| 6:00–6:45 | García / Información sobre el aprendizaje → Acciones de apoyo | Sigue **Observación → Interpretación → Acción humana**. Revisa evidencia y plazas disponibles; crea una acción justificada y confirmada por una persona. Muestra la evidencia agregada guardada. «El profesorado decide cómo apoyar». |

## Prepared text / Texto preparado

Prepare these snippets in a text editor before presenting. They are synthetic example responses, not preapproved qualifications. Leaving the application page before submission discards the local draft; moving between sections or switching interface language preserves it.

| Field / campo | English | Español |
| --- | --- | --- |
| Topic / tema | Understanding the chain rule | Comprender la regla de la cadena |
| Motivation / motivación | I enjoy helping classmates feel comfortable asking questions. | Quiero que mis compañeros se sientan cómodos al hacer preguntas. |
| Experience / experiencia | I have studied calculus and supported our informal study group. | He estudiado cálculo y he colaborado con nuestro grupo de estudio. |
| Objectives / objetivos | Identify the inner function and explain why derivatives multiply. | Identificar la función interior y explicar por qué se multiplican las derivadas. |
| Plan / plan | Start with a diagram, work through an example, then practise together. | Empezar con un diagrama, resolver un ejemplo y practicar juntos. |
| Activities / actividades | Ask the learner to identify each function and explain the next step. | Pedir al estudiante que identifique cada función y explique el siguiente paso. |
| Explanation / explicación | A change in x changes the inner function, then the outer function. Multiply the two rates. For (2x + 1)³, multiply 3(2x + 1)² by 2, giving 6(2x + 1)². Let's draw the stages and try another example. | Un cambio en x modifica la función interior y después la exterior. Multiplicamos ambas tasas. En (2x + 1)³, multiplicamos 3(2x + 1)² por 2 y obtenemos 6(2x + 1)². Dibujemos las etapas y probemos otro ejemplo. |

For the current prepared chain-rule questions, reference answers are `3x + 1` and `6(2x + 1)²`. Read the displayed question before choosing; García must review the saved evidence. The interface language never translates participant-authored text.

En las preguntas preparadas actuales, las referencias son `3x + 1` y `6(2x + 1)²`. Lee cada pregunta antes de responder; García debe revisar la evidencia guardada. El idioma de la interfaz no traduce los textos escritos por las personas.

## Optional Studio encore / Estudio opcional

As García, open **AI Learning Studio / Estudio de aprendizaje con IA**. Choose the educational content language independently of the interface, then **Open prepared example / Abrir ejemplo preparado**. No live inference occurs. The workflow highlights Review; completed setup panels collapse but remain available. Open a citation, review every question, record approvals, explicitly confirm publication, publish the immutable pair and assign it to an eligible session. Published revisions require a new draft; saved learner submissions cannot be overwritten.

Con García, abre el estudio y elige el idioma del contenido educativo. Carga el ejemplo preparado: no utiliza inferencia en tiempo real. Revisa las citas y cada pregunta, aprueba, confirma expresamente la publicación y asigna el conjunto a una sesión elegible. Las revisiones crean un borrador nuevo; no sobrescriben resultados guardados.

Live local Ollama (`qwen3:8b`) remains optional. Expand **Local model connection / Conexión con el modelo local** for status and retry controls. The main presentation works without it.

## Rehearsal checks / Comprobaciones

Verify the chosen future session does not overlap either persona's other learning/teaching. Refresh after approval, booking, attendance, contribution and faculty action. If a request or publication fails, use the displayed error and retry; never narrate an unconfirmed result. Keep a prepared text editor and the new rehearsal directory path available. EN/ES browser journeys and responsive review commands are in [V6_QA_REPORT.md](V6_QA_REPORT.md).
