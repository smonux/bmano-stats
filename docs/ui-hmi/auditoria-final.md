# Auditoría final UI/HMI

Rama exclusiva: `cambios-hmi`. Referencia de `main`: `138fbf17e85668c890b36ecbe250fc91297d7650`. No merge, push ni publicación. Datos de prueba ficticios, perfiles de navegador aislados e importaciones locales de fixtures; sin modificar datos del usuario.

## Trazabilidad de requisitos y decisiones

Las decisiones aprobadas en `propuesta-implementacion.md` prevalecen sobre alternativas del informe original.

| Referencia | Resultado comprobable | Entrega / pruebas |
| --- | --- | --- |
| HMI-01 | Inicio manual explícito, sin activar voz por flags ni Enter implícito. Equipos/fecha conservan validación transaccional. | `hmi-manual`; `hmi-manual`, `app`, `new-match-preferences` |
| HMI-02/03 | Escala legible, cifras tabulares, objetivos de 44/48/56 px; ampliación sin reducir tipografía para encajar. | `hmi-01-base-visual`; `hmi-readability`, `editor-viewport` |
| HMI-04/07 | Equipos/acciones/dorsales por selección directa en editor; Otro dorsal explícito. Se conservan ruedas en catálogos/idioma/contador. | `hmi-02-editor-directo`; `hmi-editor`, `roster-digits`, `wheels` |
| HMI-05 | Fila medida, selección y scroll sincronizados, confirmación al abandonar rueda. Foco por puntero no desplaza la fila durante el clic. | entregas 1b y 7; `hmi-readability`, `courtside` |
| HMI-06/08 | Solo campos aplicables; contexto capturado al abrir y editable sin seguir el reloj. | entrega 2; `hmi-editor`, `substitution`, `notes` |
| HMI-09 | Manual neutral; motivos reutilizan `eventDraftIssues`, guardado pendiente explícito, gol sin dorsal válido. | entregas 2/4; `hmi-editor`, `hmi-feed-safety` |
| HMI-10 | Borrador cambiado protegido ante Cancelar/X/Escape, hash/Atrás y aviso nativo de recarga. Sin promesa de recuperación persistente. | `hmi-04-registro-seguro`; `hmi-feed-safety` |
| HMI-11 | Acuse tras persistencia y reversión de creación con sus efectos de jugadores/portero; conflicto rechaza todo. Ediciones y recarga no ofrecen Deshacer. | entregas 4 y `hmi-deshacer`; unitarias de undo, `hmi-undo`, `voice` |
| HMI-12/13 | Solo marcador/reloj/estado/pausa quedan sticky; secundarios y contadores fluyen. En altura corta la cabecera es estática. | `hmi-03-contadores`; medidas comparables, `hmi-counters` |
| HMI-14 | Solo contadores ocupados, hasta tres; pausa común/individual, aviso de reincorporación y sonido de cinco segundos conservados. | entregas 1b/3; `features`, `hmi-counters`, unitarias de audio |
| HMI-15 | Explicación de independencia y acción explícita de contador precargado tras exclusión. No genera otra jugada ni comparte su ciclo de vida. | `hmi-contador-desde-evento`; `hmi-counter-action`, ZIP restaurado |
| HMI-16/17 | Contenido por lado con acciones estables; Más para borrar y confirmación contextual. Notas/transcripción legibles sin editor. | entrega 4; `hmi-feed-safety`, `event-feed` |
| HMI-18/19 | Interpretación primero, inferencias legibles, transcripción plegada, Editar y Guardar en lados coherentes. Sin guardado automático. | `hmi-05-accesibilidad`; revisión de voz |
| HMI-20 | PTT conservado por decisión expresa; teclado, pérdida de contacto/foco, permiso y cierre de pistas. Manual utilizable durante procesamiento. | entregas 4/5; `voice` real/offline |
| HMI-21/22 | Equipo 1 inicial independiente del catálogo; elección directa de ambos equipos en partido; eficacia con denominador y «—» sin muestra. | entregas 1/6; `hmi-statistics`, `hmi-short-viewport` |
| HMI-23 | Tabla nativa desplegable por tiempo, totales iniciales y cada gol en su minuto/equipo; mismos datos de las líneas. | `hmi-06-estadisticas`; `hmi-statistics`, `report` |
| HMI-24 | Tab/panel asociados, único tabulador activo, flechas/Home/End, estado accesible. | entrega 5; `hmi-accessibility` |
| HMI-25 | Bordes/foco/selección reforzados, texto/forma además de amarillo, líneas sólida/discontinua. Comprobación de estados renderizados, no certificación global de contraste. | entrega 1b; `hmi-readability` |
| HMI-26 | Formularios compartidos con cuerpo desplazable, pie estable, errores asociados y foco restaurado a controles existentes. | entrega 5; `hmi-accessibility`, `editor-viewport`, seguridad del registro |
| HMI-27/28 | Activos antes de navegación; sin elección arbitraria entre varios. Menú lateral conservado por decisión expresa. | `hmi-07-inicio`; `hmi-home`, `courtside` |
| HMI-29/30 | Ajustes separa Idioma/Voz/Datos, ZIP restaurable frente a PDF; descarga iniciada no implica archivo guardado. Guía recuperable conserva seis pasos, gramática/notas; idioma al principio. | entrega 7; `hmi-home`, `welcome-grammar`, `features`, `downloads-backup` |
| HMI-31 | Ocho tamaños, siete idiomas, nombres de 100 caracteres, plantillas 0/7/30, dorsales 0/7/10/99, texto al 200 %, registro de 200 jugadas y foco tras edición. | matriz final y suites anteriores; limitaciones físicas abajo |
| HMI-32 | Falso no encontrado reproducido al retrasar entrega de snapshot de una creación real; se espera lectura autoritativa sin timeout. ID inexistente conserva error. | entrega 7; `review/loading` |

## Corrección encontrada durante esta auditoría

Con 320 × 568 y texto al 200 %, guardar exclusión añadía acuse, Deshacer y acceso al contador a la superficie sticky, recortando el botón manual (ratio visible medido 0,56). La regresión se conserva. El acuse ahora es una región con nombre accesible, foco y desplazamiento, limitada a `min(38dvh, 14rem)`; conserva el texto y acciones completos mediante scroll/teclado, reservando espacio para Manual/Voz. No se reducen fuentes ni objetivos. Se comprueba foco de cada acción, espacio para el indicador de foco y visibilidad completa de ambos controles de captura. La medida de acciones desplazadas admite un CSS px de redondeo nativo; el límite se comprueba también contra el rectángulo de la región.

También se añade un fallo real de escritura mediante hook de IndexedDB en el fixture de revisión: no queda evento ni dorsal parcial, la propuesta permanece abierta y el reintento guarda una sola vez. El hook existe únicamente en el test. Una exclusión de voz verifica rival y dorsal nuevo 99 sin efecto en marcador.

El proceso largo con cuatro workers recibió SIGTERM. También dejó una expectativa frágil del test de minuto capturado: el reloj de Playwright continuaba entre pasos y, bajo carga, el segundo esperado ya había pasado. El test fija `Date` al comenzar y cambia ese instante exactamente 70 segundos, manteniendo temporizadores para entregar lecturas de IndexedDB. Congelar todo el scheduler antes de abrir datos impedía esas lecturas y se descartó. No se añade sleep ni se cambia el reloj de la aplicación. La regresión final se ejecuta en dos tandas por proyecto.

## Matriz y evidencia

- Chromium: 320 × 568, 360 × 640, 390 × 664, 390 × 844, 430 × 932, 844 × 390, 768 × 1024 y 1440 × 1000. El modo móvil sigue siendo Chromium emulado.
- Siete idiomas de interfaz repartidos en la matriz; nombres completos de 100 caracteres y 200 eventos con notas/transcripción largas. Plantillas 0/7/30; la suite del editor prueba 0/7/10/99.
- Viewport visual 420/340/220 px, foco/acciones/selección en formularios, Cancelar/X/Escape y destino tras desaparecer el último pendiente.
- Tres contadores, pausa, vencimiento, liberación y sonido sintetizado de cinco segundos. La prueba verifica programación de audio, no audibilidad en un pabellón.
- Voz Whistle local con audio de prueba, puntero y Espacio, recarga offline, ningún guardado automático, revisión retrasada durante entrada manual, permisos denegados y pistas cerradas.
- PDF activo/finalizado, orden temporal, notas/transcripción y paginación; ZIP completo y restauración ZIP/JSON; formato y cálculos conservados. Deshacer se valida por separado, incluida copia posterior.

Capturas y medidas: [evidencias/final](evidencias/final/README.md). La comparación con el mismo fixture de contadores mantiene 374 px de registro útil en scroll a 390 × 664 con nombres cortos, y 358,4 px con nombres largos. Estas cifras no incluyen un acuse abierto ni texto ampliado, cuyas capturas se conservan aparte.

## Validación

Cierre: 146 unitarias en 29 archivos; formato, TypeScript y build correctos. Revisión/carga: 22 recorridos correctos. Escritorio: 84/84 correctos. Móvil: 82 casos correctos en la tanda completa, una omisión deliberada del PDF largo y el caso del reloj corregido y verificado aparte en ambos proyectos: 83 casos móviles validados. En total, los 167 casos funcionales y los 22 de revisión/carga quedan comprobados, sin fallos pendientes. Los resultados fallidos anteriores se conservan como evidencia, sin sobrescribirlos.

Comandos reproducibles (rutas del navegador/modelos configurables):

```sh
npm run format:check
npm run check
npm test
npm run build
VOICE_MODELS_DIR=/ruta/modelos CHROMIUM_PATH=/ruta/chrome-headless-shell \
  npx playwright test --project=mobile --workers=2 --output=test-results/hmi-final-mobile
VOICE_MODELS_DIR=/ruta/modelos CHROMIUM_PATH=/ruta/chrome-headless-shell \
  npx playwright test --project=desktop --workers=2 --output=test-results/hmi-final-desktop
CHROMIUM_PATH=/ruta/chrome-headless-shell \
  npx playwright test --config=playwright.review.config.ts --workers=2
CHROMIUM_PATH=/ruta/chrome-headless-shell \
  node scripts/capture-hmi-layout.mjs http://127.0.0.1:4173 docs/ui-hmi/evidencias/final/comparables
```

## Límites y alcance

WebKit no está instalado: el intento de lanzar el motor falla porque falta `webkit-2370/pw_run.sh`. No se presentan resultados de Chromium como Safari. Quedan pendientes dispositivos físicos Safari/iPhone y Chrome/Firefox Android, barras/teclados reales, ruido de pista, VoiceOver/TalkBack y otros lectores de pantalla. La ampliación se simula con fuente raíz al 200 %, no certifica todos los mecanismos de zoom del sistema.

La investigación de caché quedó aparcada: `src/voice`, sus modelos/configuración y las reglas de interpretación no cambian respecto a la base. Tampoco cambian esquema/versión de copias, cálculo de estadísticas o PDF. La única operación nueva del repositorio es Deshacer creación con recibo temporal; el timestamp de portero avanza para detectar escrituras consecutivas. El build conserva el aviso previo de chunks mayores de 500 kB y la preparación de recursos históricos; no constituye una descarga nueva durante un partido.

No se incorpora la rama descartada `mejoras/interfaz-supervisada`, ni se cambia la rama activa o `main`. La comprobación de entornos no disponibles queda como límite declarado; las entregas de software se cierran con evidencia automatizada, sin atribuirles validación física inexistente.
