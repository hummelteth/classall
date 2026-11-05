# ClassAll V2.1 — cronología editorial

179 segundos; nueve escenas; sin cambios en la narración aprobada, las voces, las pausas de entrada ni los nombres de los archivos WAV. La banda acompaña la narración; no es necesario leer cada rótulo. `scenes-v2-1.json` es la fuente reproducible del texto.

| Escena | Intervalo | Voz | Identidad de la interfaz | Mensaje principal | Línea secundaria |
|---|---|---:|---|---|---|
| 1 | 00:00–00:20 | 1 | CLASSALL · violeta | Cada estudiante tiene algo que aprender y algo que aportar. | Aprender juntos · Reconocer fortalezas · Apoyar a tiempo |
| 2 | 00:20–00:49 | 2 | LAURA MARTÍN · ESTUDIANTE · azul | Las necesidades de aprendizaje se hacen visibles | APOYAR A TIEMPO |
| 3 | 00:49–01:14 | 3 | DAVID CHEN · ESTUDIANTE / TUTOR · verde | El conocimiento también está entre compañeros | APRENDER JUNTOS |
| 4 | 01:14–01:33 | 4 | ELENA GARCÍA · PROFESORA · oro | La confianza se construye con revisión humana | DECISIÓN ACADÉMICA HUMANA |
| 5 | 01:33–01:51 | 3 | DAVID CHEN · ESTUDIANTE / TUTOR · verde | De una fortaleza a una oportunidad compartida | APRENDER JUNTOS |
| 6 | 01:51–02:16 | 2 | LAURA MARTÍN · ESTUDIANTE · azul | Aprender juntos y orientar el siguiente paso | APRENDER JUNTOS · Evaluación formativa opcional |
| 7 | 02:16–02:39 | 3 | David → Laura → David, según los eventos grabados | Ayudar también tiene valor | RECONOCER FORTALEZAS · Ejemplo sintético |
| 8 | 02:39–02:54 | 4 | ELENA GARCÍA · PROFESORA · oro | De las necesidades detectadas al apoyo concreto | APOYAR A TIEMPO |
| 9 | 02:54–02:59 | 1 | CLASSALL · violeta | Aprender juntos · Reconocer fortalezas · Apoyar a tiempo | Necesidades → Fortalezas → Apoyo entre compañeros → Acción docente |

Conceptos bajo cada rol: Laura — «Necesita apoyo»; David — «Comparte conocimientos»; Elena — «Orienta el apoyo». La tabla resume la progresión prevista; la etiqueta exacta en cada fotograma la determina el evento de persona grabado, incluso durante cambios breves dentro de una escena.

No se modifica `VIDEO_V2_NARRATION_ES.md`. Se conservan los nueve WAV y sus offsets: 0,4 s en las escenas 1–8 y 0,15 s en la escena 9. Las cuatro personas del equipo siguen grabando las voces reales. No se añade música ni voz sintética.

Los tiempos de los cambios internos de persona deben revisarse en `scene-manifest-v2-1.json` al renderizar la toma original. No se han inventado tiempos de cambio para suplir la ausencia de esa toma.
