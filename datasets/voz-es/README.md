# Frases de voz en español para balonmano

Versión 2, 17 de octubre de 2026. Redacción inicial y paráfrasis por **Luna (`gpt-6-luna`)**, con revisión de etiquetas y ampliación de nombres y dorsales por Codex. Las 45 muestras de sustituciones añadidas en la versión 2 están redactadas y anotadas por Codex. Validado contra el esquema de la aplicación. Incluye nombres ficticios de hombre y de mujer, nombres compuestos y con tildes, nombres sin dorsal, dorsales sin nombre y ambos juntos.

Son ejemplos de **posibles transcripciones**, no grabaciones ni resultados obtenidos al ejecutar Whistle. Las variantes sin puntuación, sin tildes, con vacilaciones o con cifras representan hipótesis de transcripción. No se ha medido su frecuencia real en Whistle. No se ha entrenado ningún modelo ni cambiado el reconocimiento de voz de la aplicación.

## Contenido y descarga

- [`../voz-es.zip`](../voz-es.zip): paquete completo.
- [`dataset.jsonl`](dataset.jsonl): 645 muestras con consulta, contexto, esquema y respuesta esperada.
- [`frases.md`](frases.md): todas las transcripciones y etiquetas en una tabla legible.
- [`seeds.json`](seeds.json): 215 familias con tres variantes anotadas cada una; fuente editable y legible.
- [`train.jsonl`](train.jsonl): 471 muestras de 157 familias, reservadas para un posible uso posterior.
- [`validation.jsonl`](validation.jsonl): 87 muestras de 29 familias.
- [`test.jsonl`](test.jsonl): 87 muestras de 29 familias.
- [`tools.json`](tools.json): herramienta canónica `registrar_jugada`, derivada del esquema real.
- [`stats.json`](stats.json): cobertura, nombres, dorsales, estilos, rechazos y huella SHA-256 de la fuente.

Cada uno de los 12 eventos tiene 15 familias y 45 muestras: `gol`, `parada`, `fallo`, `perdida`, `recuperacion`, `penalti_cometido`, `exclusion`, `amarilla`, `descalificacion`, `pasivo`, `infraccion` y `sustitucion`. Otras 35 familias (105 muestras) cubren entradas ajenas al juego, preguntas, negaciones, varias acciones y acciones inciertas. Los rechazos llevan `answers: []`; una acción deportiva sin tipo identificable puede conservarse como `evento: "desconocido"`.

Las particiones se asignan por **familia completa**, con orden SHA-256 y semilla fija `bmano-voz-es-v1`, estratificadas por evento y por rechazo o acción incierta. Cada evento aporta 11 familias a train, dos a validation y dos a test; las otras 35 familias se reparten 25/5/5. Cada partición contiene rechazos y una familia de acción con tipo desconocido. Las variantes de una misma familia nunca se reparten entre particiones. Esta separación evita esa fuga concreta; el pequeño corpus sintético no sustituye una evaluación con personas y partidos independientes.

## Criterio de anotación

Solo se etiqueta lo que aparece en cada transcripción, junto con los dos nombres de equipo proporcionados en su contexto. No hay plantilla de jugadores ni correspondencias ocultas entre nombres y dorsales. Un nombre se copia literalmente, también cuando aparece sin tilde. No se completa un apellido ni se inventa un dorsal a partir de un nombre.

- **Perspectiva:** nuestro, nosotros, nosotras o mi equipo → `equipo1`; ellos, ellas, rival, contrario o suyo → `equipo2`. Se refiere a quien graba y es independiente de la sede. Local o visitante por sí solos no resuelven esa perspectiva. Si no se puede deducir el equipo se usa `desconocido`.
- **Equipo principal:** el del goleador, portero, lanzador, infractor o sancionado. Que se mencione al rival como participante relacionado no convierte al principal en rival.
- **Participante relacionado:** asistente del mismo equipo en gol; lanzador contrario en parada; rival que pierde en recuperación; beneficiario o provocador contrario en penalti cometido, exclusión y descalificación. En sustitución, el principal es quien sale y el relacionado quien entra, ambos del mismo equipo. Los otros eventos no llevan relacionado.
- **Sustituciones:** «cambio» y «sustitución» identifican el evento. «Sale 6, entra 9» y «entra 9 por 6» asignan los mismos roles. Un participante no mencionado queda desconocido. No se deduce el equipo de un nombre personal ni se reconstruyen alineaciones o minutos jugados.
- **Siete metros:** `penalti: true` solo en gol, parada o fallo de penalti explícito. El dorsal 7 no implica penalti. Un penalti cometido registra al infractor, no al beneficiario.
- **Sanciones:** dos minutos es duración de exclusión, no dorsal 2. La exclusión no exige dorsal. `azul: true` solo corresponde a descalificación con tarjeta azul explícita.
- **Infracciones:** subtipos exactos `Pasos`, `Dobles` y `Pisando`, únicamente si se deducen de la frase. Un subtipo ausente queda pendiente. Pasivo solo lleva evento y equipo.
- **Otros números:** marcador, minuto, periodo, distancia de lanzamiento y duración no se transforman en dorsales. El rango admitido por el esquema es 0–99.
- **Abstención:** una orden al jugador, una pregunta sin afirmación de jugada, una jugada anulada, una negación sin otra acción afirmada o varias jugadas distintas no generan llamada. Una expresión como «no convierte el penalti» sí afirma un lanzamiento fallado: la palabra «no» por sí sola no determina el rechazo.

## Formato

Una línea JSON por muestra, UTF-8, sin cabecera. Los campos `query`, `system`, `tools` y `answers` siguen el formato de ejemplos de extracción de Needle. `tools` es una lista con `name`, `description` y `parameters`; `answers` contiene cero o una llamada con `name` y `arguments`. Los metadatos contienen la familia, partición, estilo, contexto de equipos y criterio de anotación; no forman parte de la entrada ni de la respuesta del modelo.

Se omiten los campos no mencionados. Las respuestas usan equipos canónicos `equipo1`, `equipo2` o `desconocido`; los nombres de clubes en `system` permiten resolver referencias explícitas. Los nombres personales no incluyen una clasificación de género en el objetivo del modelo: se extraen como nombres literales.

Este corpus usa el esquema completo `registrar_jugada`. La aplicación usa actualmente reglas deterministas; este formato conserva las etiquetas para evaluación y posibles experimentos futuros. Aquí no se ejecuta ninguna de ellas ni se consulta un servicio externo.

## Reproducir y comprobar

Desde la raíz del repositorio, con las dependencias instaladas:

```sh
npm run dataset:build
npm run dataset:check
```

La compilación deriva el esquema de `src/voice/schema.ts`, valida campos, límites, combinaciones de metadatos, nombres literales y evidencia numérica, comprueba la cobertura y genera los JSONL, estadísticas y ZIP. La comprobación repite esas validaciones y exige que los archivos publicados coincidan con la fuente, sin reescribirlos. No descarga ni abre Whistle o Needle.

Las comprobaciones automáticas detectan errores de estructura y algunas incoherencias; la asignación de roles y el sentido de las frases requieren revisión semántica. Para medir precisión o decidir un entrenamiento se necesitará ampliar el conjunto con audio consentido y transcripciones reales de Whistle, ruido de pista, voces y sesiones diferentes, manteniendo separados los partidos y hablantes de evaluación.
