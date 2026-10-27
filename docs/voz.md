# Captura local por voz

## Preparación y uso

La primera vez, elige **Idioma de voz** y pulsa **Cargar reconocimiento de voz** en Nuevo partido o Ajustes. Después, el formulario solo aparece en Ajustes y la aplicación restaura la sesión desde archivos locales verificados. Se descarga y carga únicamente Whistle. Se mantiene el modelo, revisión, parámetros de transcripción y audio de Whistle; los siete idiomas son español, inglés, alemán, francés, italiano, neerlandés y polaco. No se usa Needle para preparar ni interpretar y las preferencias antiguas de capas/equipo por defecto no se aplican.

La preparación comprueba la entrada real de Whistle y su tamaño en CacheStorage; el SDK verifica SHA-256 al cargar. Una caché ausente o truncada no permite preparar la voz. Cambiar idioma reutiliza el mismo archivo. En un partido en curso solo se permite cargar el archivo local, sin descargar modelos. El requisito de preparar voz antes de iniciar se conserva.

Whistle recibe palabras completas de balonmano, colores de tarjeta, equipos, nombres conocidos y dorsales reales de ambas plantillas en cifras y palabras. No se pasan raíces ni expresiones regulares como pistas y no se añaden los cien dorsales si no están en la plantilla. Estas pistas no garantizan la transcripción. El SDK 0.3.0 expone texto y opcionalmente palabras con probabilidad; no ofrece una lista de palabras alternativas para corregir cada posición. No se inventan esas alternativas ni se cambia la configuración de Whistle para obtenerlas.

**Comprobar micrófono** solicita permiso y cierra las pistas. **Voz (mantener)** sigue siendo push to talk directo: mantener pulsado y soltar, también con Espacio o Intro. El límite es veinte segundos y el tiempo/minuto del evento se fija al comenzar. Mientras transcribe aparece el indicador animado y la entrada manual permanece disponible. El audio no se conserva ni se envía a un servicio externo.

## Forma obligatoria del comando

**Evento → equipo → jugador principal → jugador relacionado → metadatos.**

El evento debe aparecer al principio. Se admiten palabras, raíces y expresiones del vocabulario del idioma, con aproximación acotada de palabras de evento. No se interpreta una narración ni se reordenan funciones por verbos. La primera referencia explícita de equipo posterior al evento prevalece; si falta, se usa siempre el equipo 1. Nuestro/nosotras/nosotros se refieren a quien graba; rival/ellos/suyo al equipo 2, con equivalentes por idioma. Local y visitante no cambian esta perspectiva.

En español, inglés, italiano, neerlandés y polaco, una primera palabra que empiece por `gol` o `goal` identifica gol (`goa?l`, con `a` opcional). Esto recupera errores de Whistle como «gol de» transcrito «golden»: «Golden nuestro siete nueve penalti» registra goleador 7, asistente 9 y penalti. Se consume la palabra inicial completa y se conserva la transcripción original. Las palabras posteriores no cambian el evento y Nota/Comentario sigue tratándose como texto libre. Las expresiones literales más específicas, como `goal area violation` en inglés, conservan su tipo de evento.

La regla admite cualquier sufijo de letras, no solo `golden`: depende de que se respete el comando obligatorio y no discrimina palabras como `golf` al principio. No se aplica esa raíz a alemán o francés; mantienen `Tor`/`Treffer` y `but`. La transcripción de Whistle y sus pistas no se modifican.

Los jugadores se asignan por aparición: se consume cada posición antes de examinar la siguiente, sin promover un dorsal conocido que aparezca después. Se reconocen nombres conocidos completos o partes únicas y dorsales 0–99, en cifras y palabras. El nombre se busca en el equipo del rol: asistencia y sustitución en el mismo equipo, lanzador de una parada y demás relacionados en el contrario. Los participantes adicionales se descartan. No hay marcadores de hueco: si solo aparece un jugador, ocupa el primer rol. Pasivo no guarda jugadores.

Las coincidencias aproximadas de nombres requieren al menos cuatro letras en el nombre y cuatro en la palabra examinada. Para cuatro letras se permite una edición; para cinco a siete, dos; para más de siete, tres. Se usa Levenshtein y se advierte la aproximación. Los empates entre jugadores quedan sin resolver. Ana y Eva se admiten literalmente, pero no por parecido con palabras cortas. Los números de minutos y metros no se convierten en dorsales.

Tarjetas: **amarilla** registra amarilla; **roja** registra descalificación; **azul** registra descalificación con azul. «Tarjeta» es **amarilla por defecto**. Solo un color literal completo del idioma puede cambiarla; no se aproxima ni se acepta únicamente su raíz («roj», «azulado»). Se admiten las formas gramaticales de color del vocabulario, como roja/rojo/rojas/rojos. Si aparecen varios colores, prevalece el primero. Las expresiones de siete metros son metadato en gol, parada y fallo; «siete metros» al principio identifica penalti cometido. Pasos, dobles y pisando identifican infracción con su subtipo; «infracción» permite dar el subtipo al final.

| Comando | Resultado |
| --- | --- |
| Gol nuestro veintitrés siete penalti | Goleador 23, asistente 7, gol de 7 m |
| Parada rival uno nueve | Portero rival 1, lanzador nuestro 9 |
| Cambio nuestro siete nueve | Sale 7, entra 9 |
| Tarjeta nuestra siete azul | Descalificación azul de nuestro 7 |
| Infracción nuestra siete pasos | Pasos de nuestro 7 |

No se admite invertir Sale/Entra ni anteponer una asistencia al gol. Nombres compuestos consecutivos y números compuestos pueden tener límites ambiguos, incluso con transcripción correcta. Usar dorsales y repetir «dorsal»/el marcador de número del idioma entre participantes ayuda a separarlos. No se promete reconocer esos casos sin ambigüedad.

| Idioma | Gol propio | Parada rival con lanzador propio |
| --- | --- | --- |
| ES | Gol nuestro 21 | Parada rival 1 9 |
| EN | Goal our 21 | Save their 1 9 |
| DE | Tor unser 21 | Parade Gegner 1 9 |
| FR | But notre 21 | Arrêt adversaire 1 9 |
| IT | Gol nostro 21 | Parata loro 1 9 |
| NL | Doelpunt ons 21 | Redding tegenstander 1 9 |
| PL | Bramka nasza 21 | Obrona rywala 1 9 |

## Revisión y código

La práctica guiada sustituye a la bienvenida general en el primer arranque y se puede reabrir desde Ajustes, el menú lateral y la invitación inicial de preparación de voz. Enseña primero la gramática y después cuatro retos de gol, asistencia, penalti con participantes opuestos y exclusión que se completa en el editor. Reutiliza este mismo pipeline con dos equipos ficticios y su plantilla completa; las respuestas esperadas solo intervienen después, al evaluar los borradores. Puede omitirse o completarse manualmente y no escribe eventos, jugadores, equipos ni contadores reales. [Implementación, pruebas y límites](ui-hmi/entrenamiento-voz.md).

Después del reconocimiento aparece un resumen compacto con transcripción, datos interpretados y posición capturada. La propuesta espera la confirmación explícita: **Guardar evento** registra la jugada; **Editar** abre el formulario completo. Esperar, interactuar u ocultar y volver a mostrar la pestaña no guarda nada. X, Escape y Descartar cancelan. Si falta un dato obligatorio, se indica y el botón cambia a **Guardar pendiente**, sin cómputo. El editor conserva la transcripción y muestra los tiempos de Whistle/reglas al final, en pequeño, sin avisos técnicos de interpretación. Un fallo de guardado mantiene abierto el formulario con el error. El reloj del partido y los tres contadores de exclusión se mantienen.

Guardar una parada con portero identificado lo marca en la plantilla y lo recuerda por equipo/partido. Cuando la voz no resuelve al portero se propone ese último jugador disponible y se identifica en el resumen; un dorsal reconocido siempre prevalece. El editor manual propone el mismo valor al elegir Parada y equipo. La plantilla permite editar la marca y tener varios porteros. Cancelar no modifica la selección persistida y las copias antiguas siguen siendo válidas.

El recorrido activo es `engine.ts` → `commands/index.ts`: `events.ts` consume el evento inicial; `vocabulary.ts` define raíces por idioma; `players.ts` asigna participantes por posición; `distance.ts` contiene Levenshtein. Se reutilizan tokenización, referencias explícitas de equipo, números y contrato del editor. `deterministic.ts`, `event-routing.ts`, `play-schema.ts` e `hybrid.ts` se conservan como experimentos históricos y para comparar regresiones; no procesan la captura activa. Los artefactos antiguos de Needle y sus scripts experimentales se conservan, pero el cliente no los descarga ni carga.

## Verificación y límites

```sh
npm test
npm run build
node scripts/download-voice-test-models.mjs
VOICE_MODELS_DIR="$PWD/node_modules/.cache/voice-models" npm run test:e2e
```

Las pruebas de comandos cubren los doce eventos, colores y dorsales numéricos y hablados 0–99 en siete idiomas; también nombres de hombre/mujer, aproximaciones, empates, perspectiva, orden mixto conocido/desconocido y metadatos. Los recorridos de navegador usan el Whistle real con audio sintético, cambios de idioma y recarga sin conexión; basta `whistle.cact`. `CHROMIUM_PATH` indica el ejecutable de Chromium.

El corpus anterior de frases libres, sus informes y sus herramientas de generación/evaluación se han retirado. Se conservan las pruebas unitarias del protocolo actual y los recorridos de navegador; no constituyen una evaluación independiente de precisión acústica.

No se ha entrenado ningún modelo. Falta validar el protocolo con grabaciones humanas independientes y ruido de pista, además de Android/iOS físicos. La velocidad de texto en Node no acredita el tiempo total ni el consumo de memoria de un móvil.
