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
| Contrato público del dominio | `src/domain/model.ts` |
| Esquemas y tipos de datos | `src/domain/schema.ts` |
| Catálogo y reglas de eventos | `src/domain/event-definitions.ts`, `src/domain/events.ts` |
| Validación de referencias e identidades de una copia | `src/domain/backup.ts` |
| Reloj y transiciones de exclusiones | `src/domain/clock.ts`, `src/domain/exclusions.ts` |
| Consecuencias estadísticas de cada evento | `src/domain/statistics.ts` |
| Métricas y tanteo por periodos | `src/domain/statistics/metrics.ts`, `src/domain/score-timeline.ts` |
| Contrato público de persistencia | `src/data/database.ts` |
| Tablas e índices IndexedDB | `src/data/connection.ts` |
| Operaciones y transacciones por entidad | `src/data/repository/` |
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

`model.ts` y `database.ts` son entradas públicas pequeñas. Dentro del dominio y el repositorio se importan los módulos concretos para que las dependencias se puedan seguir sin ciclos de ejecución. Los esquemas conservan el formato de datos y copias versión 1. `backup.ts` valida primero la forma y luego identificadores, equipos, jugadores, partidos y eventos, en ese orden.

El catálogo comparte `createTeamInTransaction` y `resolvePlayerInTransaction` con partidos y eventos. Sus nombres señalan que dependen de la transacción del llamador: crear un jugador no debe confirmarse si el evento termina fallando. Cada operación pública declara las tablas que necesita. Las importaciones validan antes de abrir una transacción que reemplaza las cuatro colecciones; las ediciones de eventos mantienen el control de `expectedUpdatedAt` y el desempate por `orderKey`.

Las selecciones de opciones usan `WheelPicker`, con etiquetas traducidas, selección táctil, clic y teclado. El componente controla explícitamente sus estados deshabilitados: un `fieldset disabled` por sí solo no bloquea un `div` con rol `listbox`. `ParticipantPicker` conserva los dorsales nuevos y los reconocidos por voz aunque todavía no existan en el catálogo, y usa `ShirtNumberPicker`, con una rueda por cifra, sincronizada con los jugadores conocidos. `EventMetadata` contiene las opciones compatibles con cada evento. El editor mantiene sus acciones fuera del área desplazable y agrupa la nota y la transcripción original identificada en «Información adicional»; conserva la transcripción en `rawText`, independiente de la nota editable.

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

## Captura y revisión de voz

`components/VoiceCapture.tsx` dibuja el botón y el estado. `components/voice/useVoiceCapture.ts` controla permiso, pulsación, grabador, cancelación, trabajo pendiente y revisión; captura el tiempo del partido al comenzar. `voice/recognition.ts` transcribe una vez con las pistas del partido, interpreta ese texto y lo adapta al editor. Si falla la interpretación, conserva la transcripción para completarla manualmente. Si la pantalla se desmonta, no presenta el resultado.

`voice/capture-context.ts` fija la perspectiva y el instante; `voice/resolve-references.ts` resuelve equipos y dorsales dentro del equipo correspondiente; `voice/team-references.ts` contiene los alias. `interpretation.ts` conserva la entrada pública de este adaptador. Los números se organizan en `voice/numbers/`: normalización, escritura canónica, diccionario de variantes y lectura de intervalos. `numbers.ts` conserva la API anterior.

`VoicePreparation` presenta la descarga y selección de idioma; `useMicrophoneCheck` comprueba el permiso y cierra el micrófono. `voice/setup.ts` mantiene una preparación compartida y la sesión reutilizable. `voice/recorder.ts` gestiona las pistas y el contexto de audio; `public/voice-recorder.js` produce fragmentos PCM y confirma su vaciado. El formato automático incluye también este worklet.

## Presentación, controles e informes

`pages/AppPage.tsx` selecciona la pantalla; `App.tsx` mantiene la estructura y los estados del navegador. `components/ui.tsx` es la entrada pública de los controles de `components/ui/` y los hooks de `hooks/`. Los módulos internos importan directamente sus dependencias. `useAction` bloquea envíos simultáneos y presenta errores; `Modal` administra el diálogo nativo; `Confirm` coordina la acción confirmada.

`event-editor/draft.ts` construye el borrador inicial sin mezclarlo con los controles. `match/MatchConfirmation.tsx` relaciona cada intención con su mensaje y operación. `exclusions/ExclusionCounter.tsx` presenta un contador y recibe sus acciones; las transacciones siguen en `ExclusionTimers`. `statistics/Metrics.tsx` presenta métricas y `statistics/useMatchPdf.ts` prepara y comparte el archivo. La galería separa contenido, ilustraciones, idioma y navegación en `components/welcome/`.

`reports/match-pdf.ts` coordina las secciones de `reports/pdf/`: fuentes, cabecera, estadísticas de equipo y jugador, gráficos, eventos y pies. Comparten un cursor y la política de paginación de `layout.ts`; `context.ts` declara los datos y el tema común. `pdf-messages.ts` define el contrato del worker y su consumidor. Separar secciones no permite cambiar el estado de fuente o el cursor entre llamadas sin comprobar el resultado renderizado.

`style.css` importa `styles/`: bases compartidas, estructura, inicio, catálogo, partido, editor, estadísticas, voz y bienvenida. Cada módulo conserva junto al componente sus estados y reglas adaptables. Algunas reglas deben permanecer después de un bloque de media para conservar la cascada; se han quitado declaraciones sobrescritas y selectores de controles retirados sin mover ese orden.

## Herramientas y datos

`build-voice-dataset.mjs` coordina los módulos de `scripts/dataset/`: contrato real de la aplicación, evidencia de las anotaciones, particiones por familia, filas, resumen y publicación de JSONL/Markdown/ZIP. `dataset:check` compara también el ZIP byte a byte. El lint de anotaciones comprueba datos sintéticos; no se utiliza para interpretar la entrada de la aplicación.

`evaluate-voice-rules.mjs` coordina la medición; `scripts/evaluation/` contiene las medidas y el informe legible. `scripts/benchmarks/needle-schemas.ts` conserva la configuración de los experimentos históricos. `needle-depths.py` separa lectura, selección de bloques y filas, remapeo de cabecera y empaquetado. Declara sus dependencias y se ejecuta con uv:

```sh
uv run --no-project scripts/needle-depths.py --help
```

Las tablas de traducciones conservan la clave española y el orden declarado en `translationLanguages`. Vocabularios, esquemas, fixtures y manifiestos son datos; se mantienen como tablas cuando resultan más claros que una abstracción adicional. Dependencias, fuentes y archivos generados no se refactorizan como código propio.

## Uso compacto durante el partido

`NavigationDrawer` contiene los cinco destinos y devuelve el foco a su botón al cerrarse; reemplaza la navegación horizontal e inferior. `ShirtNumberPicker` comparte un único valor con el catálogo: cero es válido y la opción «—» vacía el dorsal. Se utiliza en participantes, exclusiones y alta de jugadores; los dorsales ya creados siguen siendo fijos.

`useDialogViewport` adapta los límites del editor al área visible del teclado. Las acciones tienen su propia fila; los mensajes de error no las desplazan. `device/orientation.ts` solicita el bloqueo vertical y solo entra en pantalla completa por la acción explícita del menú. `usePortraitOrientation` evita aplicar respuestas antiguas y mantiene separados estos cambios del estado del partido. Si el navegador rechaza el bloqueo, se explica el uso del bloqueo del dispositivo. El manifiesto prefiere orientación vertical. Una cancelación táctil termina la pulsación y procesa el audio ya capturado; no lo descarta.
