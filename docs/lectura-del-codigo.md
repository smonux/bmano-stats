# Cómo leer y modificar el código

La aplicación usa React y TypeScript. Los datos y las consecuencias estadísticas se guardan y calculan en el navegador. La voz tiene dos pasos: Whistle transcribe el audio y un intérprete determinista propone los campos del evento.

## Por dónde empezar

| Responsabilidad | Archivo o carpeta |
| --- | --- |
| Navegación, carga de datos y estructura de la aplicación | `src/App.tsx` |
| Pantallas de inicio, equipos, partidos, partido en curso y ajustes | `src/pages/` |
| Registro de eventos y presentación de sus jugadores | `src/components/EventFeed.tsx` |
| Edición manual y revisión de propuestas de voz | `src/components/EventEditor.tsx` |
| Rueda de selección compartida, teclado y desplazamiento | `src/components/WheelPicker.tsx` |
| Selección de participantes y metadatos del editor | `src/components/event-editor/` |
| Aviso sonoro de exclusiones y desbloqueo por gesto | `src/audio/exclusion-alert.ts`, `src/components/exclusions/useExclusionSound.ts` |
| Definiciones de eventos y validación de copias | `src/domain/model.ts` |
| Consecuencias estadísticas de cada evento | `src/domain/statistics.ts` |
| Persistencia y transacciones | `src/data/database.ts` |
| Transcripción con Whistle | `src/voice/engine.ts` |
| Recorrido completo del intérprete | `src/voice/deterministic.ts` |

## Recorrido del intérprete

`interpretDeterministically(text, language, teams, players)` coordina las siguientes fases:

1. **Contexto** (`analysis/context.ts`): conserva el texto original, crea tokens y localiza referencias a equipos y nombres conocidos. Estas referencias también evitan confundir un nombre con una palabra de evento.
2. **Tipo de enunciado** (`analysis/utterance.ts`): distingue preguntas, dudas, sanciones de tipo incierto y cancelaciones. El orden de estas decisiones forma parte del comportamiento existente.
3. **Evento** (`analysis/events.ts`): busca palabras literales, aplica filtros de contexto y resuelve solapamientos. Si falta coincidencia literal, consulta `approximate.ts`. Funciones como `isPenaltyShotQualifier()` y `isRecoveryWithOpposingLoss()` explican por qué ciertas palabras pertenecen a la misma jugada.
4. **Metadatos** (`analysis/metadata.ts`): reconoce siete metros, azul y subtipo de infracción. Los subtipos incompatibles se rechazan antes de buscar participantes, conservando el orden de validación y advertencias.
5. **Participantes** (`analysis/participants.ts`): extrae dorsales y nombres, descarta números de tiempo o marcador y une nombre y dorsal cuando sus posiciones lo permiten.
6. **Roles y equipo** (`analysis/roles.ts`): asigna principal y relacionado, y aplica la perspectiva de quien graba. `substitution.ts` resuelve expresamente quién sale y quién entra.
7. **Resultado** (`analysis/results.ts`): conserva la propuesta, las advertencias, la palabra reconocida y el método literal o aproximado.

`analysis/types.ts` documenta los tipos compartidos. Los intervalos de tokens son semiabiertos: `from` está incluido y `to` está excluido. Las posiciones de caracteres se refieren al texto original, para conservar nombres, tildes y puntuación.

Los nombres internos son descriptivos y están en inglés. Los campos públicos `evento`, `equipo`, `dorsal`, etc. conservan su contrato en español. `schema.ts` define ese contrato; `interpretation.ts` lo convierte al borrador del editor y resuelve nombres dentro del equipo correcto.

## Cambiar una palabra clave

Cada idioma tiene un archivo en `src/voice/languages/`: `es.ts`, `en.ts`, `de.ts`, `fr.ts`, `it.ts`, `nl.ts` y `pl.ts`.

- `events`: patrones de reconocimiento literal, agrupados por evento.
- `approximateAliases`: vocabulario seleccionado para la aproximación.
- `whistleKeywords`: pistas de transcripción.
- `relation` y `substitution`: marcas que asignan roles a los participantes.
- `own` y `opponent`: perspectiva del equipo que graba y del rival.
- `numbers`: formas numéricas y variantes del idioma.

Por ejemplo, «cambio» aparece en los patrones de sustitución españoles, sus alias aproximados y las pistas de Whistle. Son tres usos distintos y explícitos. `patterns()` une alternativas respetando su orden y agrupación. Una expresión compleja debe acompañarse de un ejemplo que explique su intención.

Después de cambiar una regla, añade un caso con frase y resultado esperado en las pruebas correspondientes. Las pruebas se agrupan en eventos, participantes, números, sustituciones, adaptación al editor y regresión del corpus.

## Convenciones de legibilidad

- Formato automático con Prettier, sangría uniforme y líneas de 100 caracteres como referencia.
- Declaraciones separadas y bloques explícitos en condiciones y bucles.
- Nombres que indiquen el rol del dato; constantes con nombre para umbrales de distancia o aproximación.
- Funciones organizadas por responsabilidad y comentarios sobre decisiones lingüísticas.
- TypeScript comprueba tipos, parámetros e importaciones sin uso.
- Las correcciones de comportamiento deben poder distinguirse de los cambios de organización.

Las selecciones de opciones usan `WheelPicker`, con etiquetas traducidas, selección táctil, clic y teclado. El componente controla explícitamente sus estados deshabilitados: un `fieldset disabled` por sí solo no bloquea un `div` con rol `listbox`. `ParticipantPicker` conserva los dorsales nuevos y los reconocidos por voz aunque todavía no existan en el catálogo, y mantiene una entrada numérica directa. `EventMetadata` contiene las opciones compatibles con cada evento. El editor mantiene sus acciones fuera del área desplazable y agrupa la nota y la transcripción original identificada en «Información adicional»; conserva la transcripción en `rawText`, independiente de la nota editable.

```sh
npm run format
npm run format:check
npm run check
npm test
npm run dataset:check
npm run build
```

## Comprobar equivalencia y rendimiento

`src/voice/fixtures/regression-baseline.json` conserva los resultados de las 645 frases anteriores a la refactorización, incluidas advertencias y coincidencias. Sus pruebas verifican también la huella del corpus. Esa referencia registra el comportamiento existente, incluidos los tres casos cuya respuesta aún difiere de la etiqueta esperada; no constituye una medida independiente de precisión.

```sh
npm run voice:compare
npm run voice:evaluate
```

`voice:compare` exporta temporalmente el código de la referencia Git `6805b02`, compara resultados, vocabulario, números y pistas de Whistle, y mide ambos intérpretes en el mismo proceso. Se puede indicar otra referencia: `npm run voice:compare -- <referencia-git>`. Alterna doce rondas del corpus con ambos intérpretes ya calentados, publica `docs/benchmarks/reglas/refactor.json` y elimina su directorio temporal. La referencia debe tener la API y los eventos compatibles con el corpus actual.

`voice:evaluate` compara el intérprete actual con las etiquetas del dataset y publica sus errores. Ambas mediciones son de texto en Node; el tiempo de Whistle y el audio de un partido requieren su propia evaluación.

Las pruebas de navegador comprueban los recorridos completos, incluida la voz, los PDF y las copias ZIP. Se ejecutan con `npm run test:e2e`; los requisitos de Chromium y los archivos de Whistle están descritos en [voz.md](voz.md).

## Experimentos históricos

`src/voice/legacy/` contiene los auxiliares y pruebas de los antiguos experimentos con Needle. Los scripts históricos los importan desde esa carpeta. El recorrido actual de captura usa `engine.ts`, `deterministic.ts`, `analysis/` y `languages/`.
