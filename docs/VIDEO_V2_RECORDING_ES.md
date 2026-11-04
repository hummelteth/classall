# ClassAll V2 — Grabación del equipo

Leer primero `VIDEO_V2_NARRATION_ES.md` y ver el montaje silencioso. Hay cuatro voces y nueve archivos: cada intervención se graba por separado, incluso cuando se repite la misma persona. No leer nombres de archivo, tiempos, rótulos ni instrucciones.

| Voz | Segmentos | Papel |
|---|---|---|
| 1 | 01 y 09 | Introducción y cierre |
| 2 | 02 y 06 | Laura |
| 3 | 03, 05 y 07 | David; intercambio sintético con Laura en 07 |
| 4 | 04 y 08 | Elena |

1. Grabar en una habitación tranquila, con el mismo micrófono y una distancia estable cuando sea posible. Usar auriculares para evitar grabar el sonido de otro dispositivo.
2. Exportar WAV PCM, preferiblemente 48 kHz, mono o estéreo. No hace falta una aplicación especial; una grabadora que exporte WAV basta. No añadir música, reverberación ni efectos.
3. Hablar con naturalidad, unas 120–140 palabras/minuto. Separar las frases con pequeñas pausas. Grabar varias tomas si hace falta; no correr para llenar todo el intervalo.
4. Recortar únicamente el silencio accidental antes de empezar. Conservar respiraciones y pausas naturales. La configuración ya añade 0,4 s de entrada (0,15 s en el cierre). El silencio que quede dentro del WAV cuenta en su duración.
5. Igualar niveles de escucha entre voces sin saturar. El importador conserva los niveles entregados: no normaliza ni acelera la voz automáticamente. Escuchar los archivos antes de exportar.
6. Guardar los nueve archivos en `work/team-voice-v2/` con los nombres exactos de la tabla siguiente. Comprobar que Windows no haya añadido una segunda extensión `.wav`.

| Archivo | Intervalo de vídeo | Duración máxima del WAV |
|---|---|---:|
| segment-01-speaker-1.wav | 00:00–00:20 | 19,60 s |
| segment-02-speaker-2.wav | 00:20–00:49 | 28,60 s |
| segment-03-speaker-3.wav | 00:49–01:14 | 24,60 s |
| segment-04-speaker-4.wav | 01:14–01:33 | 18,60 s |
| segment-05-speaker-3.wav | 01:33–01:51 | 17,60 s |
| segment-06-speaker-2.wav | 01:51–02:16 | 24,60 s |
| segment-07-speaker-3.wav | 02:16–02:39 | 22,60 s |
| segment-08-speaker-4.wav | 02:39–02:54 | 14,60 s |
| segment-09-speaker-1.wav | 02:54–02:59 | 4,85 s |

Desde PowerShell, en la raíz del repositorio:

```powershell
$python = (Resolve-Path .venv\Scripts\python.exe).Path
$take = (Get-Content work\video-v2\latest.txt -Raw).Trim()
& $python scripts\video\render_v2.py $take --audio work\team-voice-v2 --check-audio
if ($LASTEXITCODE -ne 0) { throw 'Revisar los archivos que faltan o exceden su intervalo' }
& $python scripts\video\render_v2.py $take --audio work\team-voice-v2
if ($LASTEXITCODE -ne 0) { throw 'No se ha completado la integración de voz' }
Start-Process (Join-Path $take 'final\classall-demo-v2-voiced.mp4')
```

El primer comando solo comprueba. El segundo alinea cada voz en un WAV PCM de duración fija, conserva los silencios, concatena los nueve intervalos y crea el MP4 con audio sin volver a codificar la imagen. Los WAV originales no se modifican. Los archivos ausentes o demasiado largos se indican juntos en `audio-preflight-v2.json`. Si uno no cabe, grabarlo de nuevo o redistribuir duraciones y renderizar de nuevo, siempre por debajo de 180 s. No se corta ninguna frase automáticamente. El master silencioso se conserva. Ver el vídeo completo entre los cuatro antes de entregar; confirmar que cada relevo, clic y resultado coincide con la voz.
