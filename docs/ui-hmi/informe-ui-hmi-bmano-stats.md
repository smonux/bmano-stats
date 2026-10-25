# Auditoría UI/HMI de Handball Stats

Fecha: 24 de octubre de 2026. Enfoque: uso móvil a pie de pista. Entregable para implementación mediante harness de código.

## 1. Dictamen

La identidad amarillo/negro, el almacenamiento local y la posibilidad de registrar jugadores sin nombre son una buena base. El principal problema es la distribución de la atención: hay mucho espacio dedicado a controles de selección y muy poco tamaño de letra para información operativa. En móvil se reducen nombres, estados y acciones cuando precisamente deberían poder reconocerse con una mirada breve.

La mejora debe comenzar por tres frentes: permitir arrancar manualmente sin preparar la voz; aumentar tipografía y áreas táctiles; reorganizar el editor y la cabecera para absorber ese aumento. Aplicar únicamente un incremento global de fuentes produciría nuevos problemas de altura y desbordamiento.

No se propone sustituir React, Dexie ni el modelo de eventos. Se propone modificar la capa de presentación conservando las reglas de marcador, pendientes, desconocidos, periodos y exclusiones.

## 2. Alcance, evidencia y límites

- Aplicación inspeccionada: https://bmano-stats.onrender.com/
- Repositorio identificado mediante GitHub: https://github.com/smonux/bmano-stats
- Código examinado fijado al árbol/commit `138fbf17e85668c890b36ecbe250fc91297d7650` de `main`.
- Recorrido interactivo: bienvenida, inicio, nuevo partido, preparación de voz, creación con dos nombres ficticios, editor manual, gol sin dorsal y estadísticas del partido. Se comprobó que el gol aumenta el marcador y aparece como registrado sin identificar.
- La preparación del modelo terminó correctamente en esta sesión. No se grabó audio ni se evaluó reconocimiento con ruido real.
- Se revisaron además componentes y estilos de equipos, ajustes, revisión de voz, exclusiones y gráficos, y la configuración/pruebas de viewport existentes.
- La inspección visual se realizó en navegador de escritorio. Los tamaños móviles indicados proceden del CSS de la rama auditada, incluyendo la cascada de reglas `max-width: 760px`; NO son mediciones en un dispositivo físico. No se dispuso de una API de cambio de viewport en este navegador.
- No se ha demostrado que el despliegue sirva exactamente ese commit. La estructura y los flujos observados coinciden, pero el harness debe verificar la versión desplegada antes de implementar.
- No se ejecutaron las suites del repositorio ni una certificación de accesibilidad. Se distingue observación de recomendación; no se afirman tasas de error ni tiempos de uso medidos.

Leyenda: **V** observado en la interfaz; **C** confirmado en código; **H** hipótesis o propuesta que requiere validación. Prioridad: **P0** bloquea el flujo principal en una condición relevante; **P1** afecta al uso habitual o puede provocar errores; **P2** mejora secundaria. Esfuerzo: S localizado, M varios componentes, L cambio de interacción con pruebas extensas; no son estimaciones horarias.

## 3. Criterio HMI

El usuario alterna continuamente la mirada entre pista y teléfono. Debe poder identificar equipo, acción y estado sin leer un formulario entero. Los controles frecuentes necesitan posición estable, selección explícita y corrección fácil. La voz es una vía de entrada complementaria: un error de permisos, modelo o descarga no debería impedir anotar manualmente.

Objetivos de producto propuestos, pendientes de validar con usuarios:

- Gol sin dorsal: como máximo cuatro activaciones deliberadas desde la vista de partido, sin desplazamiento vertical del formulario en 390 × 844 al tamaño de texto predeterminado.
- Acciones frecuentes accesibles desde la zona inferior, con equipo seleccionado siempre visible junto a la acción.
- Guardar y Cancelar visibles con teclado; ningún campo enfocado completamente tapado. En el producto se buscará visibilidad completa, por encima del mínimo normativo.
- Recuperar una anotación equivocada sin reconstruirla y sin tocar accidentalmente Eliminar.
- No sacrificar texto ampliado o accesibilidad por cumplir el objetivo de «todo en una pantalla».

## 4. Tipografía: valores actuales y especificación de cambio

Todos los tamaños son CSS px, no píxeles físicos. Los actuales son declaraciones CSS efectivas para móvil en los casos indicados; los propuestos son decisiones de diseño. WCAG no impone un mínimo universal de 16 px para todo texto.

### 4.1 Tabla de cambios obligatoria para el harness

| Elemento / selector | Actual móvil | Propuesto móvil | Archivo | Prioridad |
|---|---:|---:|---|---|
| Equipo 1 / Equipo 2, `.scoreboard .eyebrow` | 7 px | 14 px, etiqueta corta sin espaciado artificial | `src/styles/match.css:511` | P1 |
| Nombre de equipo, `.scoreboard h2` | 13 px | 16–18 px, peso 600–700 | `match.css:505` | P1 |
| Marcador, `.score` | 30 px | 36–40 px, cifras tabulares | `match.css:508` | P1 |
| Reloj, `.clock-row .minute` | 18 px | 24–28 px, cifras tabulares | `match.css:519` | P1 |
| Periodo / contexto del reloj | 10 px | 14–16 px | `match.css:515` | P1 |
| Acciones del reloj | 10 px | 16 px | `match.css:522` | P1 |
| Título de jugada, `.event-copy strong` | 12 px | 16–18 px, peso 650–700 | `match.css:238` | P1 |
| Equipo y jugador, `.event-copy p` | 10 px | 16 px | `match.css:241` | P1 |
| Minuto de jugada, `.event-copy time` | 10 px | 14 px | `match.css:244` | P1 |
| Estado «Pendiente · no computa» | 9 px | 14 px, peso 600 cuando exige atención | `match.css:251` | P1 |
| Filtro de pendientes | 10 px | 14–16 px | `match.css:68` | P1 |
| Botones de captura | 12 px | 16 px, peso 600 | `match.css:264` | P1 |
| Finalizar / Eliminar partido | 10 px | 14–16 px; mover Eliminar a menú secundario | `match.css:271` | P1 |
| Jugador / estado de exclusión | 9 px | 14 px | `match.css:448,467` | P1 |
| Cifras de exclusión | 15 px | 20–24 px | `match.css:527` | P1 |
| Cabecera exclusiones / sonido | 10 / 9 px | 14 / 14 px | `match.css:530,533` | P1 |
| Pestañas del partido | 12 px | 16 px | `match.css:536` | P1 |
| Etiquetas de formulario | 12 px | 14 px, peso 600 | `src/styles/base.css:173` | P1 |
| Campos de texto generales | 14 px | 16 px | `base.css:189` | P1 |
| Campos del editor en móvil | 16 px | Mantener 16 px | `src/styles/editor.css:337` | Conservar |
| Opciones de rueda genéricas | 12 px | 16 px si se conserva la rueda | `editor.css:325` | P1 |
| Dígitos del dorsal | 17 px | 20–24 px | `editor.css:401` | P1 |
| Leyenda del participante / equipo | 11 px | 14 px | `editor.css:127,141` | P1 |
| Ayuda del participante | 10 px | 14 px | `editor.css:153` | P1 |
| Guardar / Cancelar en viewport compacto | 12 px | 16 px; reducir decoración antes que texto | `editor.css:378` | P1 |
| Resumen de voz / transcripción | 13 px | 16 px / 14–16 px | `src/styles/voice.css` | P1 |
| Mensajes de captura | 11 px | 14 px | `voice.css` | P1 |
| Etiquetas de métricas | 11 px | 14 px | `src/styles/statistics.css:16` | P1 |
| Valores de métricas | 29 px | 28–32 px; no requieren aumento sistemático | `statistics.css:21` | Conservar |
| Cabecera / filas de jugadores | 10 / 11 px | 14 / 16 px | `statistics.css:51,80` | P1 |
| Leyenda del gráfico | 11 px | 14 px | `statistics.css:99` | P1 |
| Texto SVG del gráfico | 9 unidades del SVG | Equivalente visual ≥12–14 CSS px en ancho final | `statistics.css:144` | P1 |
| Título general `h1` | 28 px | 28 px, adaptable a dos líneas | `base.css` | Conservar |
| Título de inicio | 35 px | 28–32 px para liberar altura | `src/styles/dashboard.css` | P2 |
| Subtítulos de tarjetas de inicio | 11 px | 14 px | `dashboard.css` | P2 |
| Aviso de almacenamiento local en inicio | 10 px | 14 px | `dashboard.css` | P1 |

Los números de línea se refieren a la versión auditada y son orientativos tras cualquier edición. En gráficos con `viewBox`, 9 unidades no equivalen necesariamente a 9 CSS px: el harness debe medir el tamaño final renderizado.

### 4.2 Sistema tipográfico propuesto

```css
:root {
  font-size: 100%;
  --text-caption: .875rem; /* 14 px con raíz de 16 */
  --text-body: 1rem;       /* 16 */
  --text-emphasis: 1.125rem; /* 18 */
  --text-section: 1.25rem; /* 20 */
  --text-title: 1.75rem;   /* 28 */
  --text-clock: 1.5rem;   /* 24 */
  --text-score: 2.25rem;  /* 36 */
  --target-min: 2.75rem;  /* 44 */
  --target-live: 3rem;    /* 48 */
  --target-primary: 3.5rem; /* 56 */
}
```

Usar cuerpo 16/24, etiquetas 14/20, botones 16/20 y títulos con interlineado 1.2–1.3. Peso normal 400–500; destacar selección y datos clave con 600–700. Reservar mayúsculas para siglas breves; eliminar el tracking amplio en textos pequeños. Mantener cifras tabulares para evitar vibración del reloj. No fijar alturas que recorten etiquetas con zoom o traducciones. No bloquear zoom del navegador. El umbral 16 px en campos es una decisión preventiva de legibilidad y comportamiento móvil; verificar el enfoque de inputs en Safari real.

## 5. Hallazgos y tareas ejecutables

### HMI-01 · P0 · Inicio manual bloqueado por la preparación de voz · V+C · M

**Evidencia:** `src/pages/NewMatch.tsx:127` rechaza la creación si la voz no está lista y el botón repite la condición en `:161`. Antes de descargar el modelo, completar equipos no habilitaba iniciar. La descarga funcionó en esta sesión, pero la dependencia es real.

**Cambio:** habilitar «Iniciar partido» con equipos y fecha válidos; voz en sección opcional «Preparar voz». No cargar modelos como efecto necesario del inicio manual. Mantener preparación y estados de error independientes.

**Aceptación:** con modelos ausentes, sin idioma de voz y con fallo simulado de descarga, se crea un partido y se registra un gol manual. La voz muestra un estado comprensible y enlace a preparación, sin alertas que tapen captura. Probar offline con la aplicación ya almacenada; no prometer primera visita offline.

### HMI-02 · P1 · Letra operativa demasiado pequeña · C · M

**Evidencia:** tabla de §4. En especial 7 px para perspectiva y 9–10 px para pendientes y jugadores.

**Cambio:** aplicar tokens y eliminar reducciones móviles de contenido operativo. No resolver con `zoom`, `transform: scale()` ni un override universal que ignore componentes.

**Aceptación:** texto operativo ≥14 px y contenido principal ≥16 px al tamaño predeterminado; a 200% sigue siendo utilizable. Revisar computed styles, no solo constantes CSS. No queda información obligatoria truncada.

### HMI-03 · P1 · Objetivos táctiles inconsistentes · C · M

**Evidencia:** botones generales 44 px, pero Volver 24 px, texto 34 px, reloj móvil 32 px, pestañas 36 px, papelera 30 × 32 px, sonido 22 px de altura y liberar contador 24 × 44 px. Archivos `base.css`, `match.css`, `editor.css`.

**Cambio:** ≥44 × 44 px en controles habituales; ≥48 × 48 en acciones de partido; captura 56 px de alto. Separación propuesta 8 px entre objetivos vecinos. Icono visible 20–24 px dentro de un objetivo mayor. Evitar áreas invisibles superpuestas.

**Aceptación:** medir cajas clicables de cada control; un toque en el borde no activa el vecino. Esos objetivos de producto superan el mínimo AA de 24 × 24 con excepciones; no declarar automáticamente incumplimiento WCAG por un control de 32 px.

### HMI-04 · P1 · Exceso de ruedas para decisiones discretas · V+C · L

**Evidencia:** `WheelPicker.tsx` usa filas de 40 px y ventana de 120 px. Equipo, tipo, tiempo, idiomas y jugadores comparten la rueda; en el editor incluso un único periodo ocupa esa altura.

**Cambio:** dos botones segmentados para equipos, etiqueta compacta editable para periodo/minuto, rejilla de acciones frecuentes y «Más acciones». Selector con búsqueda para catálogos largos. Mantener una única fuente de verdad del borrador.

**Aceptación:** ambos equipos visibles a la vez; elegir Gol/Pérdida/Parada no requiere desplazar una lista. Todos los tipos actuales, incluida Nota, siguen disponibles. La selección no cambia al intentar desplazar el formulario. Validar con usuarios antes de retirar definitivamente la alternativa de ruedas.

### HMI-05 · P1 · Ruedas acopladas a alturas fijas · C · M

**Evidencia:** `ROW_HEIGHT = 40` está duplicado conceptualmente en opciones, padding y banda de selección de `editor.css`. El código decide el valor por `scrollTop / ROW_HEIGHT` tras 100 ms. Aumentar solo CSS desincronizaría la selección.

**Cambio:** si se conservan ruedas, centralizar o medir la altura, actualizar ventana y selección conjuntamente y definir qué ocurre al guardar antes de finalizar el scroll. Usar filas ≥48 px y texto 16 px.

**Aceptación:** el valor resaltado coincide con el guardado tras scroll rápido + Guardar, cambio de idioma, ampliación de texto y cambio de roster. Nunca cambiar la constante de forma aislada.

### HMI-06 · P1 · Campos irrelevantes ocupan el editor · V+C · M

**Evidencia:** se renderizan participantes deshabilitados «No aplicable», la casilla Tarjeta azul para eventos que no la admiten y la información adicional abierta. `EventEditor.tsx`, `ParticipantPicker.tsx`, `EventMetadata.tsx`.

**Cambio:** revelar únicamente campos aplicables. Antes de seleccionar evento mostrar el paso de selección y su ayuda. Tras selección, mostrar campos obligatorios; relacionados opcionales y notas bajo «Añadir detalle». Mantener visibles errores que obliguen a completar un campo.

**Aceptación:** Nota no muestra equipos/dorsales; un evento sin relacionado no muestra su panel; Tarjeta azul solo aparece en Descalificación. Cambiar de tipo limpia metadatos incompatibles según las reglas actuales.

### HMI-07 · P1 · Introducción de dorsal con atención excesiva · C+H · M

**Evidencia:** dos ruedas de dígitos más una rueda de jugador para cada participante.

**Cambio:** botones de dorsales conocidos, orden estable, y «Otro dorsal» con teclado numérico; conservar «Desconocido» explícito. Si se mantienen ruedas como preferencia, no duplicar los tres mecanismos permanentemente. No confundir vacío con dorsal cero.

**Aceptación:** seleccionar un jugador conocido exige una activación tras elegir equipo; crear uno nuevo acepta los valores válidos del dominio; misma numeración en equipos distintos no mezcla jugadores; cambiar equipo elimina selección incompatible. Validar dorsales 0, 7, 10, 99 y vacío conforme al esquema existente.

### HMI-08 · P1 · Tiempo compite con el dato principal · V+C · M

**Evidencia:** el minuto se inicializa al abrir el editor (`event-editor/draft.ts`), pero ocupa una posición principal y el periodo tiene rueda propia.

**Cambio:** resumen «1.er tiempo · 12:34» o minuto según precisión real disponible, con acción Editar. Preservar el instante original de captura mientras se completa la jugada; no actualizarlo al pulsar Guardar.

**Aceptación:** abrir en minuto 12 y guardar en 13 conserva minuto 12 salvo corrección explícita. La UI no promete segundos de evento si el modelo solo almacena minutos.

### HMI-09 · P1 · Pendiente poco explicado en entrada manual · V+C · M

**Evidencia:** el editor cambia a «Guardar pendiente», pero calcula solo un booleano `missing`; la revisión de voz sí lista `eventDraftIssues`. Un editor vacío ofrece guardar pendiente.

**Cambio:** mostrar motivos concretos junto al resumen y junto al campo, más «No modifica el marcador». Distinguir «Sin identificar» válido de «Pendiente» no computable. Si se pretende capturar un borrador vacío, darle intención explícita, no apariencia de registro correcto.

**Aceptación:** usuario puede saber antes de guardar qué falta y si contará. Gol con equipo y sin dorsal conserva comportamiento válido actual. Completar un pendiente recalcula resultados una sola vez.

### HMI-10 · P1 · Cierre descarta el borrador sin recuperación visible · C · M

**Evidencia:** Cancelar/Cerrar terminan el editor y `Modal` dirige Escape a `close`; el estado del borrador es local al componente.

**Cambio:** conservar borrador por partido durante navegación o pedir descartar solo cuando haya cambios. No introducir confirmaciones en formularios intactos. Priorizar «Continuar editando» y una acción inequívoca para descartar.

**Aceptación:** cerrar o navegar accidentalmente no pierde una nota modificada; guardar elimina el borrador; el borrador de un partido no aparece en otro. Revisar cambio de orientación y recarga por separado.

### HMI-11 · P1 · Falta de confirmación breve y deshacer · V+C · M

**Evidencia:** tras guardar se actualizan marcador y registro, sin un acuse específico en `MatchView`/`EventEditor`; el foco observado volvió al documento.

**Cambio:** mensaje discreto «Gol · Equipo 1 · registrado» con Deshacer; devolver foco al iniciador de captura. No mover el scroll si se está revisando historial. Mantener edición accesible después de desaparecer el mensaje.

**Aceptación:** anuncio `role=status` una vez; Deshacer revierte exactamente el evento guardado y sus consecuencias mediante las operaciones del repositorio. No restaurar el marcador con un decremento aislado. Verificar doble toque y errores de persistencia.

### HMI-12 · P1 · Estructura sticky demasiado extensa · C+H · M

**Evidencia:** `.match-header` fija conjuntamente marcador, reloj, tres exclusiones y pestañas. El problema de oclusión en pantallas cortas no se midió en esta sesión.

**Cambio:** fijar solo marcador/estado de reloj en versión compacta. Mantener exclusiones activas accesibles y plegar espacios vacíos en pantallas cortas. No hacer todo más pequeño para encajarlo.

**Aceptación:** en 360 × 640 y 844 × 390 quedan contenido y controles utilizables; ningún control enfocado queda tapado; se puede leer el último evento. Medir con nombres largos, tres exclusiones y texto al 200%.

### HMI-13 · P1 · Posición y tamaño del control de pausa · C+H · M

**Evidencia:** `.clock-action-label` desaparece en móvil; botón de 32 px. Está junto a Nuevo tiempo, de efecto diferente.

**Cambio:** mantener «Pausar»/«Reanudar» visible y objetivo 48 px. Separar Nuevo periodo en acción secundaria con confirmación existente. Probar un control de pausa accesible con el pulgar sin duplicar órdenes ambiguas.

**Aceptación:** estado pausado inequívoco mediante texto, no solo punto; al pausar no se cambia de periodo; la disposición conserva identidad y estado al girar.

### HMI-14 · P1 · Contadores de exclusión demasiado comprimidos · C · M

**Evidencia:** tres columnas, altura 46 px, jugador/estado 9 px, liberación de 24 px de ancho.

**Cambio:** priorizar contadores activos en tarjetas de al menos 64–72 px de alto, equipo/dorsal a 14 px y tiempo 20–24 px. Si no caben tres columnas legibles, usar dos o una; no esconder un contador activo sin indicador. Liberar desde detalle o menú de tamaño adecuado.

**Aceptación:** reconocer qué jugador puede volver sin abrir tarjeta; pausa/reanuda y liberar tienen objetivos separados; tres activos siguen accesibles en 320 px de ancho.

### HMI-15 · P1 · Exclusión estadística y contador parecen una sola función · C · M/L

**Evidencia:** el contador no registra la exclusión y la explicación en `ExclusionTimers.tsx:80` es `sr-only`, invisible para el usuario que mira la pantalla.

**Cambio inmediato:** ayuda visible y breve «El contador no añade una exclusión al registro». **Evolución:** tras guardar una exclusión ofrecer «Iniciar contador» con equipo/dorsal ya elegidos. No fusionar silenciosamente entidades ni duplicar eventos.

**Aceptación:** iniciar contador solo no altera estadísticas; la acción combinada crea exactamente una exclusión y un contador; editar/eliminar una parte muestra qué sucede con la otra. Mantener pausa del reloj común y aviso «Puede volver».

### HMI-16 · P1 · Feed con lectura y controles invertidos · C+H · M

**Evidencia:** `.event-card.away` y sus subfilas usan `row-reverse` y alineación derecha.

**Cambio:** mantener hora, contenido y menú en posiciones estables para ambos equipos. Diferenciar por nombre, número y banda lateral; color como refuerzo. Conservar orden cronológico actual, explicitando «Más recientes primero» si procede.

**Aceptación:** alternar equipos no mueve Editar/menú a lados opuestos. Lectura con teclado y lector de pantalla sigue el orden visual.

### HMI-17 · P1 · Acciones destructivas demasiado presentes · V+C · S/M

**Evidencia:** papelera junto a Editar en cada evento y «Eliminar partido» junto a Finalizar en pie. Ya hay confirmaciones: no se trata de su ausencia.

**Cambio:** menú «Más» por evento y acciones del partido; mantener Finalizar accesible como cierre natural. Diálogo con nombre del partido/evento y consecuencia explícita. Ofrecer recuperación cuando el dominio lo permita.

**Aceptación:** el toque para editar no puede activar eliminación; finalizar no borra datos; pruebas de confirmación y cancelación preservadas.

### HMI-18 · P1 · Orden de acciones distinto entre editor y voz · C · S

**Evidencia:** manual muestra Cancelar a la izquierda y Guardar a la derecha; voz muestra Guardar a la izquierda y Editar a la derecha, más Descartar debajo.

**Cambio:** mantener primario Guardar en el mismo lado y posición relativa, con 56 px de alto. Editar queda como secundario en revisión. Etiquetas completas y coherentes.

**Aceptación:** tras alternar manual/voz no cambia el lugar esperado de Guardar; las traducciones no se recortan; el footer sigue visible con teclado.

### HMI-19 · P1 · Revisión de voz: priorizar la interpretación · C+H · M

**Evidencia:** transcripción primero; resumen a 13 px; equipo por defecto y portero propuesto se indican en `small`; foco inicial en Guardar.

**Cambio:** primero resumen «Gol · Equipo 1 · #7», después minuto y campos; transcripción desplegable. Resaltar explícitamente valores inferidos. Revisar foco inicial para que un Enter residual no confirme sin leer; no afirmar que hoy ocurra sin reproducirlo.

**Aceptación:** equipo por defecto distinguible de equipo pronunciado; errores de interpretación corregibles sin volver a dictar; nunca guardar automáticamente. Prueba de pulsar/soltar Enter y de transición tardía del resultado.

### HMI-20 · P1 · Pulsación mantenida como única vía de voz · C+H · M

**Evidencia:** `VoiceCapture.tsx` implementa mantener/soltar por puntero y teclado y cancela/libera al perder captura.

**Cambio:** conservar modo actual y ofrecer alternativa accesible «Iniciar grabación / Detener», con indicación persistente de estado. No iniciar micrófono sin acción del usuario. Ayuda breve antes del primer uso.

**Aceptación:** funciona con teclado y tecnologías de asistencia; la pérdida de foco/contacto no deja micrófono activo; solo una interpretación por toma; manual disponible durante procesamiento. Validar ruido, funda, manos húmedas y Safari/Android reales.

### HMI-21 · P1 · Estadísticas abren en equipo inesperado · V+C · S

**Evidencia:** tras el gol local, Estadísticas abrió con Rival y cero goles. `Statistics.tsx` inicializa con `teams[0]`, no con `match.localTeamId`.

**Cambio:** en un partido inicializar con Equipo 1 o selección explícita persistida para ese partido. Mostrar nombre del equipo junto al título de métricas. En estadísticas globales conservar selección válida, sin saltos al actualizar datos.

**Aceptación:** el resultado no depende del orden de equipos en la base; el contexto seleccionado permanece visible durante scroll; cambiar partido no muestra cifras de otro inadvertidamente.

### HMI-22 · P1 · Estadísticas difíciles de comparar en móvil · C+H · M

**Evidencia:** filtro por rueda, etiquetas pequeñas, tabla simulada de jugadores en grid y jerarquía centrada en un equipo.

**Cambio:** en partido usar selector de dos equipos o resumen comparativo con los mismos indicadores. Mostrar definiciones de eficacia y denominadores; conservar «—» para ausencia de intentos. Filas de jugadores 16 px y objetivos completos ≥48 px. No aumentar columnas en 320 px.

**Aceptación:** cifras idénticas al cálculo actual; nombres largos no desplazan cifras fuera de pantalla; valores sin muestra no se confunden con cero. Si se convierte a tabla, usar semántica de cabeceras real.

### HMI-23 · P1 · Gráfico sin alternativa detallada accesible · C · M

**Evidencia:** `ScoreCharts.tsx` ofrece SVG con nombre genérico, leyenda y marcador inicial/final; no presenta una tabla de puntos. Etiquetas de 9 unidades y escalado por `viewBox`.

**Cambio:** añadir «Ver datos del gráfico» con tabla por minuto y equipo, y breve resumen textual. Mantener línea continua/discontinua existente. Ajustar ticks a enteros legibles y medir texto al ancho final.

**Aceptación:** misma información disponible sin interpretar el SVG; sin superposición de etiquetas con muchos goles/periodos; zoom no recorta ejes. No añadir interacción hover como única vía.

### HMI-24 · P1 · Semántica de pestañas incompleta · C · M

**Evidencia:** `MatchView.tsx` y `Statistics.tsx` declaran `tablist`, `tab` y `aria-selected`, sin mostrar en esos componentes navegación de flechas, roving tabindex ni enlace `aria-controls` a `tabpanel`.

**Cambio:** completar patrón de pestañas o usar botones con estado si no se necesita ese patrón. Asociar paneles y etiquetas, y definir activación por teclado.

**Aceptación:** Tab entra una vez al grupo; flechas/Home/End navegan de forma coherente; el panel queda identificado; VoiceOver/TalkBack anuncian selección. Validar todas las pestañas, no solo las del partido.

### HMI-25 · P1 · Contraste de algunos indicadores requiere refuerzo · C+H · M

**Evidencia:** amarillo `#ffd600` se usa en subrayado de pestaña activa y punto de reloj; líneas `#deded7` delimitan campos. El texto principal negro sobre amarillo sí es una combinación robusta. No se completó una medición de todos los estados.

**Cambio:** medir contraste renderizado; añadir borde oscuro, forma o peso para selección y foco. Revisar icono de papelera gris y estados de error. No oscurecer toda la marca sin necesidad.

**Aceptación:** texto normal ≥4.5:1, texto grande ≥3:1 y señales no textuales necesarias ≥3:1 frente al color adyacente cuando aplica WCAG; seleccionado identificable en escala de grises. Evaluar excepciones de controles deshabilitados por separado.

### HMI-26 · P1 · Formularios y modales fuera del editor · C+H · M

**Evidencia:** el editor adapta viewport y sube inputs a 16 px, pero campos generales siguen a 14 px; modales de equipo, jugador y exclusión no comparten necesariamente su footer fijo.

**Cambio:** extender estrategia de teclado/viewport a todos los formularios. Etiquetas persistentes, errores asociados mediante `aria-describedby`/`aria-invalid`, foco inicial útil y retorno al activador. Reutilizar `useDialogViewport`.

**Aceptación:** crear/renombrar equipo, jugador y exclusión en pantalla pequeña con teclado abierto; Guardar y Cancelar accesibles; el error no tapa el campo que hay que corregir. No introducir dos scrolls verticales innecesarios.

### HMI-27 · P2 · Inicio sobredimensionado para uso repetido · V+C+H · M

**Evidencia:** tarjeta Nuevo partido mínima 195 px en móvil y tarjetas secundarias 180 px; titular de 35 px. `Dashboard.tsx` ya ofrece «Volver a la pista», pero sitúa los partidos activos después de toda la rejilla de navegación. El patrón sirve a presentación inicial pero consume altura antes de retomar el trabajo.

**Cambio:** mover la sección existente de partidos activos antes de la rejilla; si hay uno, ofrecer «Continuar partido», y si hay varios, permitir elegir sin asumir cuál retomar. Nuevo partido queda como segunda opción. Compactar introducción tras primer uso y mantener la identidad visual; reutilizar `MatchCard` en lugar de duplicar el flujo.

**Aceptación:** un partido activo se retoma con una activación; en 360 × 640 se entiende la siguiente acción sin leer contenido promocional; estado vacío sigue explicando cómo empezar.

### HMI-28 · P2 · Navegación y alcance del pulgar · V+C+H · M

**Evidencia:** menú superior izquierdo; durante partido hay acciones de captura inferiores, una buena base.

**Cambio:** fuera del partido evaluar navegación inferior Inicio/Partidos/Equipos/Más. Dentro del partido reservar zona inferior a captura y no superponer dos barras. No imponer este cambio si pruebas muestran que las tarjetas actuales bastan.

**Aceptación:** destinos principales con etiquetas visibles; navegación no pierde borradores; área segura inferior respetada; estado actual inequívoco.

### HMI-29 · P1 · Almacenamiento local: visibilidad y terminología · V+C · M

**Evidencia:** texto «En este dispositivo» oculto normalmente en móvil (`shell.css`); aviso de inicio de 10 px. Ajustes mezcla idioma, voz, bienvenida y copia bajo «Tus datos».

**Cambio:** separar secciones Apariencia/Idioma, Voz y Datos. Mostrar guardado local y última exportación conocida sin sugerir sincronización. Tras finalizar ofrecer copia como acción secundaria. No confundir PDF de un partido con copia restaurable ZIP.

**Aceptación:** un usuario puede identificar dónde están los datos y cómo trasladarlos; indicar que borrar datos del navegador puede perderlos. Texto de exportación debe distinguir «descarga iniciada» de guardado confirmado, según lo que la API pueda verificar.

### HMI-30 · P2 · Preparación y bienvenida demasiado verbosas antes de actuar · V+C+H · M

**Evidencia:** bienvenida de seis pasos; bloque de preparación antes de equipos; lenguaje técnico como Whistle/modelos en algunas pantallas.

**Cambio:** inicio rápido opcional y ayuda contextual; una muestra concreta de frase, no solo «evento/equipo/jugador/metadatos». Estado de descarga con progreso comprensible, reintento y continuación manual. Diagnósticos técnicos en sección avanzada.

**Aceptación:** saltar guía no bloquea funciones; ayuda recuperable; errores explican qué hacer; no exponer milisegundos de motores como información principal para el anotador.

### HMI-31 · P1 · Cobertura móvil insuficiente para asegurar el resultado · C · M/L

**Evidencia:** `playwright.config.ts` usa iPhone 13 emulado sobre Chromium y escritorio; no equivale a Safari/iOS. Existen buenas pruebas de viewport/teclado simulado en `tests/editor-viewport.spec.ts`.

**Cambio:** ampliar matriz de tamaños, WebKit y pruebas manuales físicas. Conservar pruebas existentes. Cubrir reflow, objetivos táctiles, foco y longitud de traducciones.

**Aceptación:** matriz del §8 completada con resultados reales y lista de limitaciones; nunca etiquetar Chromium emulado como «probado en iPhone».

### HMI-32 · P2 · Transiciones y estados de carga · V parcial+C+H · S/M

**Evidencia:** una captura inmediatamente posterior a crear el partido mostró «Partido no encontrado», mientras el árbol accesible ya contenía el partido; puede ser un estado transitorio o desfase de captura. `AppPage.tsx` muestra no encontrado si la ruta existe pero el snapshot aún no incluye el partido.

**Cambio:** reproducir antes de corregir. Si se confirma, diferenciar registro pendiente de lectura, carga real y ausencia definitiva; no introducir un retraso arbitrario para ocultarlo.

**Aceptación:** crear y navegar repetidamente con almacenamiento lento no muestra falsos errores. Si no se reproduce, registrar la hipótesis como descartada, no como bug resuelto.

## 6. Distribución de pantalla propuesta

Especificación orientativa para retrato de 390 × 844 CSS px, sin teclado y texto por defecto. Las alturas son presupuestos de diseño, no máximos rígidos.

| Zona | Contenido | Presupuesto / conducta |
|---|---|---|
| Cabecera contextual | Volver, título corto, Más | 48–56 px; desplaza al hacer scroll |
| Marcador compacto | Equipos 16 px, marcador 36 px, reloj 24 px, pausa 48 px | 96–128 px; único bloque sticky principal |
| Exclusiones | Solo activas prominentes, acceso a crear | Altura según contenido; no comprimir tipografía |
| Registro | Últimas jugadas, pendientes, edición | Ocupa espacio flexible; scroll principal |
| Barra inferior | Evento manual y Voz | Botones 56 px + padding + safe area |
| Editor | Equipo → acción → dorsal/detalle → resumen | Hoja con cuerpo desplazable y footer independiente |

El editor no debe pedir confirmar cada microselección. Un flujo rápido conserva el contexto de equipo de forma explícita, permite registrar sin dorsal y presenta un resumen antes de guardar. Las acciones secundarias no deben cambiar de sitio al aparecer un error o comenzar la transcripción. No ocultar información crítica para cumplir un presupuesto de altura.

## 7. Plan de implementación por lotes

| Lote | Tareas | Dependencia | Resultado |
|---|---|---|---|
| 0 | Verificar commit/despliegue, capturas y baseline | Ninguna | Evidencia reproducible y fixtures |
| 1 | HMI-01, 02, 03, 21, 25 | 0 | Inicio manual, tokens y correcciones de contexto |
| 2 | HMI-04–09, 18, 26 | 1 | Editor compacto y consistente |
| 3 | HMI-10–17 | 2 | Recuperación, cabecera, exclusiones y feed |
| 4 | HMI-19, 20, 22–24, 29 | 1–3 según componente | Voz, estadísticas, accesibilidad y datos |
| 5 | HMI-27, 28, 30, 32 | Baseline y validación de hipótesis | Ajustes de navegación y estados |
| Transversal | HMI-31 | Cada lote | Verificación móvil y regresión |

No hacer una sustitución masiva de CSS sin evaluar el flujo. No reescribir persistencia para arreglar presentación. HMI-15 combinado requiere revisar transacciones y evitar duplicación; tratarlo como cambio de comportamiento explícito.

## 8. Validación y definición de terminado

### 8.1 Matriz

| Entorno | Tamaños / condiciones | Qué demuestra |
|---|---|---|
| Chromium automatizado | 320×568, 360×640, 390×844, 430×932 | Reflow, scroll, objetivos, flujo y regresión |
| Landscape automatizado | 844×390 | Oclusión por cabeceras y barras |
| Tablet/escritorio | 768×1024 y 1440×1000 | Adaptación sin estirar formularios indiscriminadamente |
| WebKit automatizado | Al menos 390×844 | Diferencias de motor; no sustituye iOS real |
| Safari iPhone físico | Teclado, zoom, barras del navegador, PWA si aplica | Viewport real, audio, foco, permisos |
| Chrome Android físico | Tamaño de fuente del sistema, navegación gestual, ruido | Interacción táctil y comportamiento de voz |
| Asistencia | VoiceOver/TalkBack y teclado | Orden, etiquetas, estado y acceso completo |

### 8.2 Escenarios de aceptación

1. Crear partido sin voz preparada y registrar Gol; el marcador y estadísticas coinciden.
2. Gol sin dorsal es válido sin identificar; evento sin equipo/tipo es pendiente y no computa según dominio.
3. Cambiar equipo, tipo y periodo no deja referencias o metadatos incompatibles.
4. Plantillas con 0, 7 y 30 jugadores; nombres de equipo de 100 caracteres; texto traducido largo.
5. Guardar tras scroll rápido de rueda; doble toque en Guardar; error de base de datos y edición concurrente.
6. Abrir teclado y desplazar formulario: probar viewport efectivo de 420, 340 y 220 px, reutilizando pruebas existentes; comprobar también dispositivo real.
7. Cerrar un borrador editado, volver atrás y reabrir; recuperación conforme a HMI-10.
8. Guardar y deshacer: marcador, cronología y estadísticas coherentes; sin eventos duplicados.
9. Pausar, reanudar, nuevo periodo, finalizar y editar partido finalizado conservan semántica actual.
10. Tres exclusiones, una caducada y otra pausada; aviso visual sin sonido; liberar una no elimina otra.
11. Voz: permiso denegado, toma vacía, procesamiento lento, resultado mientras editor manual está abierto y pérdida de contacto. Manual sigue utilizable.
12. Feed con 200 eventos, notas largas y pendientes; barra de captura no tapa último elemento.
13. Estadísticas iniciales del equipo correcto, nombres largos, sin intentos de tiro y múltiples periodos.
14. Navegación completa por teclado, foco visible, modales y pestañas; lectura de avisos sin anunciar reloj cada segundo.
15. Zoom/texto 200%, reflow equivalente a 320 CSS px, contraste y escala de grises. No exigir ausencia de todo scroll horizontal en visualizaciones bidimensionales que legítimamente lo necesiten; el formulario y navegación sí deben reflow.
16. Copia ZIP e importación mantienen formato y datos; PDF sigue accesible. No probar restauración sobre datos reales del usuario.

### 8.3 Automatización sugerida

- Extender `tests/editor-viewport.spec.ts`, `tests/courtside.spec.ts`, `tests/event-feed.spec.ts`, `tests/new-match-preferences.spec.ts`, `tests/wheels.spec.ts`, `tests/roster-digits.spec.ts` y pruebas de revisión de voz existentes. Leer cada suite antes de tocarla.
- Comprobar `getBoundingClientRect()` de objetivos, computed font sizes, ausencia de overflow del documento y visibilidad de footer/foco. Excluir deliberadamente controles ocultos/no aplicables; no hacer tests que solo repitan tokens.
- Añadir auditoría automática de accesibilidad con herramienta adecuada si el proyecto la incorpora, más pruebas manuales; un resultado automático limpio no certifica conformidad.
- Ejecutar los scripts del repositorio: `npm run format:check`, `npm run check`, `npm test`, `npm run build`, `npm run test:e2e`. La compilación prepara modelos históricos; informar requisitos/fallos reales, no ocultarlos.
- Tomar capturas antes/después con fixtures equivalentes y no con datos personales. Revisar visualmente cada breakpoint clave.

Definición de terminado: criterios por tarea cumplidos, regresiones resueltas, ninguna regla de cómputo cambiada sin especificación, pruebas ejecutadas documentadas y limitaciones físicas pendientes declaradas.

## 9. Lo que conviene conservar

- Paleta negro/amarillo y texto oscuro sobre amarillo para el primario.
- Captura inferior y botones de guardado persistentes del editor.
- `useDialogViewport`, safe areas, cifras tabulares y pruebas de teclado existentes.
- Confirmación explícita de voz antes de guardar, transcripción conservada y manual disponible durante procesamiento.
- Distinción entre pendiente y desconocido; marcador derivado de eventos.
- Diálogos nativos, nombres accesibles existentes y foco visible en controles básicos.
- Líneas de gráfico diferenciadas por patrón además de color.
- Almacenamiento local, copias y flujo sin cuenta; no añadir nube como solución de UI.

## 10. Instrucción lista para un harness de código

> Implementa las mejoras UI/HMI de este informe en `smonux/bmano-stats`. Empieza leyendo las instrucciones del repositorio y verificando el estado de la rama; la referencia auditada es `138fbf17e85668c890b36ecbe250fc91297d7650`. Reproduce los hallazgos antes de modificarlos y conserva un baseline visual. Trabaja por los lotes de §7, con cambios pequeños y trazables mediante los IDs HMI. Mantén React/TypeScript, Dexie, las traducciones y las reglas de eventos existentes. La primera entrega debe permitir inicio manual sin voz, aplicar la escala tipográfica y objetivos táctiles de §4/HMI-03 y corregir el equipo inicial en estadísticas. Reorganiza componentes para acomodar letras mayores: no reduzcas de nuevo la tipografía para encajar contenido. No cambies alturas de WheelPicker sin sincronizar su lógica. Preserva formatos de copias, cálculo de marcador y estados pendiente/desconocido. No conviertas hipótesis H en bugs comprobados. Para cada lote entrega archivos modificados, capturas antes/después, criterios verificados, comandos ejecutados y limitaciones. Completa la matriz automatizada y señala qué validación física queda pendiente. No despliegues ni alteres datos reales como parte de esta implementación.

## 11. Referencias y trazabilidad

Código fijado: [árbol auditado](https://github.com/smonux/bmano-stats/tree/138fbf17e85668c890b36ecbe250fc91297d7650). Todas las rutas del informe son relativas a ese repositorio.

Referencias normativas consultadas el 24/10/2026. Las propuestas de 14/16 px, 48/56 px, espaciado y distribución son criterio de diseño para esta aplicación; no requisitos universales de estas normas.

- [WCAG 2.2](https://www.w3.org/TR/WCAG22/): marco de accesibilidad y criterios aplicables.
- [Target Size Minimum 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html): 24 × 24 CSS px o excepciones; no confundir con objetivos recomendados mayores.
- [Target Size Enhanced 2.5.5](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html): 44 × 44 CSS px con excepciones, nivel AAA.
- [Contrast Minimum](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum): umbrales de contraste de texto.
- [Non-text Contrast](https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html): señales visuales necesarias de controles/estados.
- [Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html): adaptación de contenido al viewport y relación con ampliación.
- [Focus Not Obscured Minimum](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html): evitar foco completamente oculto por contenido del autor.

Este informe es una auditoría heurística con revisión de código y recorrido funcional parcial, no una certificación WCAG ni un estudio de campo. Sus prioridades son propuestas de implementación; las hipótesis deben validarse antes de cambios de interacción costosos.
