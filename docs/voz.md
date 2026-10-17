# Captura local por voz

## Preparación y uso durante el partido

Antes del partido, elige **Idioma de voz**, **Versión de Needle** y **Equipo por defecto**, y pulsa **Cargar Cactus** en Nuevo partido o Ajustes. Inicialmente se usan 12 capas y nuestro equipo (equipo 1). Se restauran las preferencias previas válidas. El selector ofrece 4, 8, 12 y 20 capas; las versiones pequeñas son las mismas variantes experimentales preparadas anteriormente, sin entrenamiento. No hay selector de Whistle.

La preparación carga Whistle y solo el Needle seleccionado. Se comprueban ambos archivos reales y sus tamaños en CacheStorage; el SDK verifica SHA-256 al cargar. Un Needle de otra profundidad no satisface la preparación. Cambiar capas invalida la sesión y exige preparar la variante elegida; cambiar idioma o equipo por defecto reutiliza los archivos ya almacenados. Los controles de configuración se bloquean durante la preparación y en el partido.

Whistle conserva su modelo, revisión, configuración de audio y los siete idiomas: español, inglés, alemán, francés, italiano, neerlandés y polaco. Se amplían sus pistas `keywords` con vocabulario de balonmano, nombres de los dos equipos, nombres conocidos y dorsales reales de ambas plantillas, en cifras y palabras del idioma elegido. Se eliminan duplicados y no se corta arbitrariamente la lista en 80 entradas. No se añaden los cien dorsales posibles: únicamente los conocidos en ese partido. Estas pistas ayudan al reconocimiento, pero no garantizan su precisión.

**Comprobar micrófono** solicita permiso y cierra inmediatamente las pistas. La publicación por Tailscale Serve usa HTTPS. Durante el partido, **Voz** es push to talk directo: mantener pulsado y soltar para terminar, también con Espacio o Intro. No hay segundo menú ni grabación con un toque. El límite es 20 segundos y el minuto se toma al comenzar la captura. Whistle trabaja en su worker; mientras transcribe se muestra un indicador animado y sigue disponible la entrada manual.

El editor conserva la transcripción literal y muestra por separado **Whistle en segundos**, **Reglas en milisegundos** y **Needle en segundos**. Durante ambas inferencias hay un indicador animado y sigue disponible la entrada manual. Se revisa antes de guardar; el marcador no cambia por recibir una propuesta. El audio no se conserva ni se envía a un servicio externo. Al recargar un partido solo se cargan archivos locales: si falta cualquiera de los dos modelos seleccionados, se deshabilita voz y aparece la alerta de preparación.

## Intérprete híbrido

El recorrido actual usa `engine.ts`, `event-routing.ts`, `play-schema.ts` e `hybrid.ts`. Se mantiene una sesión de cada modelo en workers, con SDK `cactus-needle` 0.3.0. Las capturas de Needle son independientes entre sí y tienen un límite de 192 tokens y 45 segundos. No se ejecutan herramientas: solo se reciben datos para revisión.

1. **Evento por reglas.** Se reutilizan las palabras clave de `languages/` y la detección de `analysis/events.ts`, con aproximación acotada cuando no hay coincidencia literal. Se busca en toda la transcripción, incluido el comienzo habitual de la orden. Se distingue el penalti de lanzamiento del cometido; negaciones y varias acciones pueden dejar el tipo pendiente. No se consulta un catálogo de frases. Un signo de interrogación aislado no impide enviar un evento identificado a Needle.
2. **Datos mediante una sola inferencia.** Needle recibe el texto original, sin convertir dorsales previamente, y una única herramienta correspondiente al evento. Cada evento tiene un esquema fijo: no se quitan nombre, asistente o penalti porque falte una palabra en la transcripción. No se aplican después las reglas deterministas de extracción de equipo o participantes.
3. **Gol.** La herramienta `gol` contiene equipo, dorsal, nombre, dorsal_asistente, nombre_asistente y penalti. Solo equipo es obligatorio; los dorsales están limitados a 0–99. La aplicación añade el evento y adapta los campos de asistencia al contrato del editor. No se exponen tarjetas ni infracciones.
4. **Perspectiva y valores por defecto.** Equipo es el del actor principal: goleador, portero, infractor, etc. Las instrucciones distinguen «gol nuestro» de «nos han marcado». El equipo válido devuelto por Needle se respeta. Si falta, es desconocido o inválido, se aplica el elegido en preparación y se advierte explícitamente en revisión. No se exige un dorsal para exclusiones. El asistente de gol y quien entra en una sustitución pertenecen al mismo equipo que el principal.
5. **Validación y fallos.** Se validan campos, tipos, rango y pertinencia al evento. Una llamada retenida por baja confianza se muestra como borrador incierto. Respuestas múltiples, de otra herramienta, negadas o marcadas sin respaldo no rellenan participantes. Si el modelo falla, se conserva texto, tipo identificado y equipo por defecto para completar manualmente. Nunca se guardan eventos automáticamente.

El intérprete determinista completo permanece en `deterministic.ts` como referencia y para sus pruebas históricas. Su evaluación no mide el modo híbrido actual. Los experimentos previos de Needle quedan en `docs/benchmarks/needle/`. No se ha entrenado ningún modelo.

## Ejemplos de los siete idiomas

| Idioma | Gol propio | Parada rival con lanzador propio |
| --- | --- | --- |
| ES | Gol nuestro, dorsal veintiuno | Parada rival, dorsal uno; tiro de nuestro nueve |
| EN | Our goal, number twenty-one | Save their number one; shot from our number nine |
| DE | Tor für uns, Nummer einundzwanzig | Parade Gegner Nummer eins; Wurf von unser Nummer neun |
| FR | But pour nous, numéro vingt et un | Arrêt adversaire numéro un; tir de notre numéro neuf |
| IT | Gol nostro, numero ventuno | Parata loro numero uno; tiro di nostro numero nove |
| NL | Doelpunt voor ons, rugnummer eenentwintig | Redding tegenstander rugnummer een; schot van ons rugnummer negen |
| PL | Nasza bramka, numer dwadzieścia jeden | Obrona rywala numer jeden; rzut zawodnika nasz numer dziewięć |

Los comandos breves y explícitos son más predecibles que una narración implícita. Se cubren las formas cardinales 0–99, variantes de género comunes y números compuestos; francés incluye septante/huitante/octante/nonante. La revisión sigue siendo necesaria con nombres nuevos, referencias pronominales ambiguas y expresiones sin palabra de acción reconocible.

Referencias lingüísticas usadas para revisar números compuestos: [Duden](https://www.duden.de/sprachwissen/rechtschreibregeln/getrennt-und-zusammenschreibung), [Académie française](https://www.dictionnaire-academie.fr/article/QDL078), [Treccani](https://www.treccani.it/vocabolario/ventuno/) y [Zintegrowana Platforma Edukacyjna](https://zpe.gov.pl/a/jezykowy-swiat-liczb/DpbQ4CKTd).

## Verificación

```sh
npm test
npm run build
npm run voice:evaluate
node scripts/download-voice-test-models.mjs
VOICE_MODELS_DIR="$PWD/node_modules/.cache/voice-models" npm run test:e2e
```

`voice:evaluate` ejecuta el intérprete determinista anterior sobre las 645 transcripciones sintéticas españolas y publica [resultados y conclusiones](benchmarks/reglas/LEEME.md). No ejecuta Whistle ni Needle y no mide reconocimiento acústico ni precisión del híbrido. Las reglas se ajustaron con ese corpus completo; son resultados de regresión.

Las pruebas de código cubren selección del evento, esquemas por evento, valores por defecto y validación de las respuestas de Needle, además de las regresiones anteriores y las pistas de Whistle. Los recorridos de navegador usan ambos modelos reales, audio sintético, selección de capas, cambios de idioma y recarga sin conexión. Requieren Chromium y `VOICE_MODELS_DIR` con `whistle.cact` y `needle3.cact`; `CHROMIUM_PATH` permite indicar el ejecutable. Los modelos pequeños se sirven desde `dist/models/`.

`scripts/benchmark-hybrid-node.ts` permite comparar las mismas cuatro frases sintéticas con pesos reales y el esquema actual; conserva tiempos y respuestas originales, incluidas sus advertencias. Son ejecuciones individuales de texto en Node/WASM del servidor, sin audio ni extrapolación al teléfono. No sustituyen una evaluación con transcripciones reales independientes.

No se ha evaluado todavía con Android/iOS físicos, ruido de pista ni un corpus acústico equivalente en los otros seis idiomas. La nueva extracción con Needle debe medirse en precisión y latencia; conservar las reglas solo para el evento no garantiza corregir una transcripción errónea.

### Sustituciones

«Cambio» y «sustitución» registran una sustitución. Ejemplo: «Cambio nuestro, sale el 6 y entra el 9», o «Cambio nuestro, entra el 9 por el 6». Quien sale es el participante principal y quien entra el relacionado, siempre del mismo equipo. Ambos campos pueden quedar desconocidos. La rueda manual ofrece «Sustitución» con «Sale» y «Entra». Las estadísticas cuentan una sustitución del equipo y las entradas y salidas de cada jugador, sin calcular minutos jugados. Los dos participantes aparecen en el registro y en el PDF; las copias ZIP/JSON los conservan.

El vocabulario de sustituciones se incluye en las palabras clave que recibe Whistle y en las reglas de los siete idiomas. El dataset español añade 15 familias (45 muestras) de cambios, incluidas entradas antes que salidas, nombres y dorsales, equipo desconocido y participantes no mencionados.
