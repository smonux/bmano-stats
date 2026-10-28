# Práctica guiada de voz

Implementación de las [instrucciones aprobadas](instrucciones-entrenamiento-voz.md) y la [demo de referencia](voz-entrenamiento.html). La demo conserva sus simulaciones como referencia visual; la aplicación utiliza el reconocimiento real.

## Recorrido

El entrenamiento sustituye a la bienvenida general y se abre directamente en el primer arranque. Ese recorrido incluye la elección del idioma de interfaz y siempre permite salir. `Practicar voz` permanece en Ajustes y el menú lateral; también se ofrece, con «Ahora no», al preparar voz por primera vez. La práctica siempre empieza enseñando Evento + Equipo + Jugador 1 + Jugador 2, el ejemplo segmentado y el mínimo «Gol nuestro». Los jugadores son opcionales según el evento; reconocer nombres exige incluirlos en la plantilla. Se explica el orden real del intérprete y el papel del segundo jugador, sin atribuir a los conectores una capacidad de reordenación que el parser actual no tiene.

La ruta conserva el origen y Salir vuelve a esa pantalla. La introducción puede recuperarse durante cualquier reto sin perder el borrador. Siguiente exige un resultado verde. Repetir borra el intento actual; las respuestas tardías de capturas canceladas no cambian el reto. Finalizar muestra 4/4 y cuántos se completaron con ayuda, sin puntuación ni clasificación. Revisar un reconocimiento correcto sin cambiarlo conserva «Reconocido por voz».

## Contexto y evaluación

Dos equipos simétricos en memoria, con la perspectiva nuestro = 1 y ellos = 2 explícita. Equipo 1: Marta #7 y Elena #9. Equipo 2: #12 y #8. No se crean registros de catálogo ni de partido. El reloj ficticio permanece en tiempo 1, minuto 0; el editor completo permite modificar la posición y todos los campos habituales.

| Reto | Objetivo semántico |
| --- | --- |
| A · Gol nuestro | Gol del equipo 1; no se exige identificar jugador. |
| B · Gol nuestro de Marta, pase de Elena | Gol del equipo 1, Marta #7 y asistencia de Elena #9, ambas identificadas por nombre. |
| C · Penalti cometido por ellos, número doce, provocado por Elena | Penalti del equipo 2, infractor #12 y beneficiaria Elena #9 del equipo 1. |
| D · Exclusión de ellos | Exclusión del equipo 2; falta deliberadamente #8. Se completa/confirma en el editor. |

Las frases españolas pasan por el intérprete sin modificarlo. Hay equivalentes comprobados en inglés, alemán, francés, italiano, neerlandés y polaco. La frase leída sigue el idioma del reconocimiento, aunque la interfaz use otro idioma. Introducción y reto B comparten las mismas cuatro piezas del ejemplo con Marta y Elena. C mantiene el contraste entre rival identificado por número (#12) y jugadora propia por nombre (Elena #9); A conserva el mínimo y D la exclusión sin dorsal para completar en el editor.

| Idioma | Ejemplo completo de B |
| --- | --- |
| Español | Gol nuestro de Marta, pase de Elena |
| Inglés | Goal for us by Marta, assisted by Elena |
| Alemán | Tor für uns von Marta, Vorlage von Elena |
| Francés | But pour nous de Marta, passe d’Elena |
| Italiano | Gol nostro di Marta, passaggio di Elena |
| Neerlandés | Doelpunt voor ons van Marta, pass van Elena |
| Polaco | Bramka dla nas Marta, asystuje Elena |

El motor recibe únicamente el contexto normal: dos equipos y la plantilla completa. `whistleKeywords` genera las mismas pistas de eventos, nombres y dorsales que en un partido. Los objetivos de la tabla solo se consultan al evaluar después del reconocimiento o de la corrección.

La evaluación reutiliza `eventDraftIssues`, `eventSchema` y la validación de posición extraída del repositorio sin cambiar sus reglas. Primero comprueba si la jugada es registrable; después compara evento, equipo, identidades por dorsal en su equipo y roles. No compara literalmente la transcripción. La posición puede variar dentro de los límites reales; metadatos que contradicen el reto se identifican por su campo.

- Verde, check y texto: coinciden los datos esperados. A acepta jugador desconocido. D requiere el paso de edición indicado en su consigna.
- Amarillo, aviso y texto: la jugada puede registrarse pero faltan detalles, o existen datos válidos que no coinciden con el reto. Se identifican los campos que faltan o hay que revisar; no se presenta como acierto un dato erróneo.
- Rojo, cruz y texto: el validador detecta requisitos ausentes o datos inválidos. Los problemas de micrófono, silencio o preparación se muestran aparte como problemas de voz.

## Aislamiento y reutilización

`VoicePractice` usa `useVoiceCapture` → `VoiceRecorder`/AudioWorklet → Whistle → `recognizeCapture` → intérprete actual → `toVoiceDraft`. El botón `PushToTalkButton` comparte el mismo manejo de puntero, teclado, pérdida de contacto y ocultación con la captura del partido. No hay botones de simulación en producción ni acceso al objetivo desde el motor.

El modo práctica de `EventEditor` termina en un callback que devuelve un clon del borrador, antes de cualquier llamada a `repo.saveEvent`. No se ofrece el inicio de contadores tras una exclusión de práctica. Los catálogos, eventos, estadísticas, último portero y copias usan exclusivamente datos reales. La prueba de aislamiento rechaza escrituras en las cuatro tablas durante los cuatro retos y compara sus snapshots completos. También se comprueba que la exportación ZIP no contiene objetos de práctica.

Solo se persiste `handball-voice-practice-v1 = seen/done`, además de las preferencias habituales de voz si el usuario las cambia. Salir o empezar marca visto; terminar conserva completado incluso después de salir. Recargar la introducción inicial antes de elegir no la omite. Los usuarios con `handball-welcome-v1 = done` no vuelven a ser interrumpidos al actualizar; pueden entrar explícitamente desde Ajustes/menú. Borradores, transcripciones y audio no se guardan. La descarga y preparación siguen el flujo existente; si hay un partido activo, la práctica permite la voz local ya preparada o la corrección manual. El tutorial no condiciona crear un partido ni registrar manualmente.

## Validación y límites

159 pruebas unitarias en 32 archivos; catorce específicas comprueban los cuatro ejemplos y la introducción en siete idiomas con el intérprete real, equivalencia nombre/dorsal, roles opuestos, campos erróneos válidos, requisitos reales, posición, metadatos, traducciones y evaluación sin mutaciones. B comprueba explícitamente equipo 1, goleadora #7 y asistente #9; C, equipo 2, infractor #12 y beneficiaria #9.

40 casos de navegador validados para el cambio a Marta/Elena en Chromium móvil emulado y escritorio: 32 sobre la compilación de producción y ocho de componentes/origen. Incluyen captura real con cuatro WAV sintéticos, funcionamiento offline tras preparar una vez, cancelación durante una grabación con cierre de todas las pistas, ausencia de datos ficticios en ZIP, primer arranque saltable, permisos/silencio con dobles identificados, cancelación tardía, editor completo, corrección D, retorno al partido activo con reloj en marcha y regresión de contadores. La matriz cubre 320/390/430 px, siete idiomas, claro/oscuro, texto al 200 %, foco y controles táctiles; se revisan capturas de introducción y de B con ambos roles.

Los WAV se generaron con Piper para probar el recorrido, no para medir precisión humana; se regenera `assist.wav` con «Gol nuestro de Marta, pase de Elena». Whistle devuelve ambos nombres en B: escritorio interpreta «Hol Nuestro de Marta, Pase de Elena» y da verde; móvil interpreta «Hoy nuestro de Marta pase de Elena.» y necesita corregir el evento. A no reconoce el gol en estas dos ejecuciones; C conserva el infractor #12 pero no identifica Elena. Se conservan los resultados reales antes de corregir con el editor. D mantiene la exclusión sin dorsal y pasa a verde al completar #8. No se alteran modelo, configuración ni parser para hacer pasar las muestras, y no se atribuye mejora de reconocimiento al tutorial. No se ha probado micrófono físico, ruido de pista, Safari/iOS ni Android real.

[Capturas y resultados actuales](evidencias/entrenamiento-nombres/README.md); [evidencia histórica de la entrega inicial](evidencias/entrenamiento-voz/README.md). Compilación regenerada en `dist`. Entrega autorizada en `main`, sin esperar al despliegue.
