# Práctica con dos compañeras conocidas

La introducción y B usan el mismo ejemplo de cuatro piezas: «Gol nuestro de Marta, pase de Elena». Marta #7 marca y Elena #9 asiste en el equipo 1; se elimina la antigua compañera #15 de la plantilla ficticia. C mantiene la oposición rival #12 por número / Elena #9 propia por nombre. A y D conservan sus frases y objetivos.

Capturas revisadas:

- [Introducción en español a 320 px](introduccion-320.png), página completa, sin recorte horizontal.
- [Introducción a 390 px en oscuro](introduccion-390-oscuro.png), mismo ejemplo con ambas jugadoras.
- [B con intérprete real y transcripción controlada](b-nombres-movil.png), roles #7 Marta / #9 Elena en el equipo 1. La captura y ASR se sustituyen expresamente; el evaluador, contexto, editor y base de datos son reales.
- [B con audio sintético y Whistle real en escritorio](b-whistle-escritorio.png): el resultado verde procede del reconocimiento real de esa muestra, sin corrección.

## Comprobaciones

159 unitarias correctas en 32 archivos; 14 de práctica cubren cuatro frases por idioma y las siete introducciones con `interpretCommand` → adaptador → `evaluatePractice`. Las aserciones explícitas exigen B gol/equipo 1/#7/#9 y C penalti/equipo 2/#12/#9; también se prueban nombres/números equivalentes, roles intercambiados, detalles ausentes, requisitos reales y traducciones.

40 recorridos correctos en Chromium móvil emulado/escritorio: 32 de `voice-practice`, `voice-onboarding`, `features`, `hmi-home` y ocho de `tests/review/voice-practice`. Incluyen primer arranque, idioma, salida/retorno al origen, partido activo con reloj, corrección de Elena mediante el editor habitual, D amarillo → editor → verde, cancelación, permisos y silencio con dobles identificados, aislamiento de las cuatro colecciones y ZIP sin datos ficticios. La matriz de interfaz comprueba siete idiomas, 320/390/430 px, temas y texto al 200 %, sin overflow. Formato, TypeScript y build correctos; `dist` regenerado.

## Audio observado y límites

Se regenera solo `tests/fixtures/practice/assist.wav` con Piper y «Gol nuestro de Marta, pase de Elena». Los cuatro WAV recorren VoiceRecorder, AudioWorklet, Whistle, keywords, intérprete y evaluación reales. Tras preparar una vez, se continúa offline y se comprueba cierre de pistas al salir grabando.

Los JSON guardan los resultados antes de cualquier edición: [móvil](whistle-movil.json) y [escritorio](whistle-escritorio.json). En B, escritorio devuelve «Hol Nuestro de Marta, Pase de Elena», que el parser actual interpreta correctamente (verde). Móvil devuelve «Hoy nuestro de Marta pase de Elena.» y no reconoce el evento (rojo); se corrige en el editor. A no reconoce el gol en estas muestras, C conserva el infractor #12 pero omite Elena, y D reconoce la exclusión sin dorsal (amarillo previsto), completada después con #8. La prueba no convierte los fallos de ASR en aciertos: registra el resultado real y usa la corrección normal cuando hace falta.

No se modifica Whistle, su configuración ni el parser. Los únicos keywords diferentes proceden de la plantilla ficticia actualizada, por el generador habitual; nunca se envía la frase ni la respuesta esperada al motor. Los audios son sintéticos y solo de tests. No se acredita precisión humana, micrófono físico, ruido de pista, Safari/iOS ni Android real. Las capturas/transcripciones anteriores se conservan como evidencia histórica, identificadas como tales.
