# Auditoría de la refactorización integral

El objetivo es que todo el código propio se pueda leer y modificar por responsabilidad. La revisión abarca aplicación, dominio, persistencia, voz, informes, estilos, traducciones, scripts, configuración, worklet y pruebas. Los cambios funcionales posteriores están separados en [tareas-pendientes.md](tareas-pendientes.md), de acuerdo con la prioridad indicada por el usuario.

## Revisión por área

| Área | Resultado de la revisión |
| --- | --- |
| Intérprete y siete vocabularios | Coordinador y fases de contexto, enunciado, evento, metadatos, participantes, roles y resultado. Vocabulario por idioma; constantes y nombres explícitos. |
| Números y adaptación al editor | Escritura canónica, diccionario, normalización e intervalos separados. Contexto, referencias de equipo/jugador y adaptación independientes; entradas públicas compatibles. |
| Dominio | Esquemas, catálogo, identidad, reloj, exclusiones, limpieza de eventos y validación de copias por referencia. Se conservan versión y contratos. |
| Estadísticas e informe de datos | Métricas, consecuencias de los doce eventos y tanteo por periodos separados. La representación no guarda eventos derivados. |
| Persistencia y copias | Conexión, catálogo, partidos, eventos y copias separados. Transacciones explícitas, control de edición obsoleta y restauración atómica conservados. ZIP, límites y decodificación legibles. |
| Captura y preparación | Vista, ciclo de captura, reconocimiento, adaptación y comprobación del micrófono separados. Preparación compartida y grabador con nombres de recursos explícitos. Worklet incluido en el formato automático. |
| Interfaz y páginas | Selección de pantalla separada de la estructura. Controles comunes y hooks separados; borrador, participantes, metadatos, confirmaciones, contador, métricas, compartición y galería con responsabilidades explícitas. |
| PDF | Coordinador pequeño y secciones independientes. Fuentes, cursor, tablas, gráficos, páginas y mensajes de worker tienen contratos identificados. |
| Estilos | Módulos por área, con reglas adaptables junto al componente. Retiradas 21 reglas sin uso y 63 declaraciones sobrescritas; se conserva la posición necesaria en la cascada. |
| Traducciones y datos declarativos | Orden de idiomas explícito; tablas de traducciones y vocabulario conservadas. Esquemas, fixtures y manifiestos se mantienen como datos legibles. |
| Scripts | Configuración de experimentos histórica identificada. Python con uv y dependencias declaradas, dividido en lectura, selección, remapeo y empaquetado. Las herramientas del corpus se retiraron posteriormente junto con sus datos. |
| Pruebas y configuración | Fixtures por responsabilidad, referencias congeladas y nombres descriptivos en persistencia. Vite, PWA, Playwright, TS estricto y scripts de formato revisados; sus contratos se conservan. |

No se dividen archivos solo para reducir líneas. `WheelPicker` conserva juntas selección táctil, teclado y desplazamiento; `EventFeed` y sus tarjetas forman una presentación coherente. Las páginas pequeñas y las tablas de datos permanecen juntas. Los helpers históricos de Needle siguen aislados y no entran en el recorrido actual de voz.

## Equivalencia y validación

- **Núcleo frente a `12d66db`:** 3.744 combinaciones de evento con cuatro operaciones cada una, 29 copias válidas o alteradas, 96 cambios de reloj, informe, estadísticas y ciclo de repositorio con catálogo, doce eventos en ambos equipos, correcciones, conflictos, rollback, tres contadores, restauración y borrado. Resultados y mensajes iguales. Comparador temporal: `/tmp/bmano-compare-core.mjs`; copia anterior: `/tmp/bmano-core-before/`.
- **Intérprete frente a `6805b02`:** se comprobó equivalencia de respuestas, advertencias, vocabularios, pistas de Whistle, números y adaptación al editor. El corpus y el comparador empleados en esta comprobación histórica se retiraron posteriormente.
- **Reconocimiento:** pruebas nuevas de pistas del partido y perspectiva, audio corto, transcripción vacía, fallo de interpretación con conservación del texto y cierre de la pantalla. Whistle y sus opciones se conservan.
- **PDF:** 14 informes normales/largos en los siete idiomas, 42 páginas. Texto extraído y píxeles renderizados iguales antes/después; revisión visual de cabeceras, tablas, gráficos, caracteres y paginación. Herramientas y capturas temporales: `/tmp/bmano-compare-pdf.mjs`, `/tmp/bmano-verify-pdf.py`, `/tmp/bmano-pdf-refactor/`.
- **Estilos:** comparación del estilo calculado de elementos y pseudoelementos, sobre el mismo DOM, en inicio, equipos, plantilla, partidos, estadísticas, ajustes, alta de partido, partido, editor, jugadores y galería, en móvil y escritorio. Sin diferencias visuales; se normaliza únicamente la representación equivalente de posición de fondo cero de la compilación. Capturas inspeccionadas; comparador temporal: `/tmp/bmano-refactor-styles.spec.ts`.
- **Herramientas históricas:** cuatro entradas TS empaquetadas sin ejecutar inferencia. Python: equivalencia de 19 profundidades de archivo sintético, 276 selecciones de bloques y filas CQ de 2/4 bits; no se cargan ni entrenan modelos.

Tipos, formato, 725 pruebas de código, integridad del dataset y compilación de producción aprobados. La compilación conserva el aviso conocido de tamaño de algunos chunks. La batería completa de navegador aprueba 23 recorridos en móvil/escritorio, incluida inferencia real de Whistle local, revisión de voz, funcionamiento sin conexión, PDF, ZIP/JSON, sustituciones, ruedas y avisos de exclusión. Se omite intencionadamente la repetición móvil del PDF largo, que se valida en escritorio. El servidor temporal de comprobación queda cerrado.

Objetivo de refactorización integral completado el 17 de octubre de 2026. Las indicaciones funcionales posteriores se ejecutan en commits separados.
