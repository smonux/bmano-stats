# Seguimiento de cambios HMI

Rama: `cambios-hmi`, creada desde `main` en `138fbf1`. Trabajo por entregas; sin merge ni publicación.

Estado vigente: objetivo ampliado completado: entregas 1–7, inicio manual, Deshacer, Contador tras exclusión y auditoría final. Cada bloque tiene commit y etiqueta. Los puntos «Siguiente» de cierres anteriores documentan el orden histórico; el estado actual lo fijan esta cabecera y la tabla. Ver [auditoría final](auditoria-final.md).

## Decisiones aprobadas

Samuel aprobó el 25 de octubre de 2026 las recomendaciones de la propuesta y de la conversación de contradicciones:

- Permitir un inicio explícito «Iniciar solo con entrada manual» cuando la voz no esté preparada. La preparación y elección del idioma siguen siendo necesarias para usar voz.
- Adoptar selección directa de equipos, acciones y jugadores en el editor; dorsal grande con nombre debajo. Evaluar otros usos de ruedas por separado.
- Conservar push to talk.
- Conservar contenido de nuestro equipo a la izquierda y rival a la derecha, con posiciones estables para acciones.
- Conservar menú lateral y reservar barra inferior de partido para captura.
- Mantener entrada manual neutral; los valores inferidos de voz deben ser visibles.

## Entrega 0: referencia inicial

Base comprobada antes de cambiar código: `138fbf1`.

- `npm test`: 135 pruebas en 28 archivos, todas correctas.
- `npm run format:check`: correcto.
- `npm run build`: correcto, incluida comprobación TypeScript. Se mantiene el aviso de tamaño de chunks de Vite.
- Navegador: 14 pruebas correctas de `courtside.spec.ts`, `editor-viewport.spec.ts` y `event-feed.spec.ts`, con Chromium móvil emulado (390 × 844) y escritorio (1440 × 1000).
- Se conserva una muestra de capturas en [evidencias/00-base](evidencias/00-base): registro móvil/escritorio y editor móvil. Las suites generan el resto de capturas al ejecutarlas.

Comando reproducible, usando el ejecutable Chromium instalado en este entorno:

```sh
CHROMIUM_PATH=/ruta/a/chrome-headless-shell npx playwright test \
  tests/courtside.spec.ts tests/editor-viewport.spec.ts tests/event-feed.spec.ts \
  --workers=1 --output=test-results/hmi-00-baseline
```

La matriz de tamaños cortos, nombres largos, texto ampliado y WebKit se ampliará con los componentes afectados en cada entrega. Esta referencia no es una prueba física de Safari/iPhone ni de audio en pista.

## Entrega 1: base visual e identidad

Entrega cerrada en dos partes: identidad y contexto de estadísticas, seguidas de tipografía, contraste y tamaños táctiles con los ajustes de distribución descritos en la entrega 1b al final de este documento.

### Iconos

- Los 13 dibujos SVG proporcionados se incorporan como `EventIcon`, independiente del dominio. Conservan sus trazos y heredan el color de cada tarjeta. Las etiquetas de texto siguen dando nombre al evento; los SVG son decorativos para lectores de pantalla.
- El icono elegido sustituye al anterior en cabecera y favicon. Se añaden PNG de 192/512 px para el manifiesto y 180 px para acceso en iOS. El recurso de 512 px también declara propósito maskable.
- Los recursos PNG se incluyen en el precache existente. Comprobada su lectura con red cortada y peticiones externas abortadas, después de instalar el service worker y recargar. No se ha probado la instalación en dispositivos físicos.
- Capturas comparables del mismo partido y viewport en [evidencias/01-identidad](evidencias/01-identidad), frente a `00-base`.
- `hmi-identity.spec.ts`: cuatro pruebas correctas entre móvil y escritorio. Todos los tipos, etiquetas y perspectiva conservados; pendientes y marcador coherentes. Comprobado también reflow a 320 × 568, 390 × 664, 430 × 932 y 844 × 390.

Regeneración de los iconos de instalación a partir del vector original:

```sh
CHROMIUM_PATH=/ruta/a/chrome-headless-shell node scripts/export-app-icons.mjs
```

### Ajuste previo de cabecera en pantallas cortas — HMI-12 parcial

El caso de nombres largos a 320 × 568 reprodujo una oclusión real: la cabecera sticky y la barra de captura interceptaban los toques sobre el selector de estadísticas. La traza mostró ambas superficies interceptando el puntero; no era un fallo de guardado ni un problema de espera.

Se permite que la cabecera se desplace normalmente cuando la altura disponible es de 640 CSS px o menos. No se eliminan controles ni se introduce un panel colapsable. Es un ajuste previo pequeño; la separación completa de marcador/reloj respecto a controles secundarios sigue prevista para la entrega 3.

- Regresión independiente en `hmi-short-viewport.spec.ts`, correcta en móvil y escritorio; selección mediante puntero normal, sin clicks forzados ni sleeps.
- [Antes y después a 320 × 568](evidencias/01-pantalla-corta). El antes procede de un fotograma de la traza fallida; el después muestra la selección rival realizada con éxito. Mismos nombres y datos, con diferente posición de scroll durante el intento.
- Se conservan distribución y tamaño actuales de exclusiones y barra inferior. Sus mejoras de legibilidad y espacio siguen pendientes de las entregas siguientes.

### Contexto inicial de estadísticas — HMI-21

- En un partido, el equipo inicial es `localTeamId` (Equipo 1 desde la perspectiva del anotador), no el primer equipo del catálogo. Una elección explícita del rival se conserva ante actualizaciones de datos/reloj.
- Otro partido empieza desde su propia perspectiva. Las estadísticas globales conservan su selección válida y filtros habituales.
- Se muestra el nombre completo del equipo junto a sus estadísticas y se permite ajuste de línea. Los cálculos y formatos de datos no cambian.
- `hmi-statistics.spec.ts`: dos pruebas correctas entre móvil y escritorio, con nuestro equipo situado después del contrario en el orden real de IndexedDB. Cubre teclado, actualización del reloj, cambio de partido, filtro global y recarga.
- Capturas de [estadísticas móvil](evidencias/01-identidad/estadisticas-390x844.png) y [escritorio](evidencias/01-identidad/estadisticas-1440x1000.png).

### Validación al cerrar esta primera parte

- Formato, TypeScript, 135 pruebas unitarias y build correctos; `dist` regenerado.
- 22 recorridos de navegador pertinentes correctos: 14 de regresión existentes, cuatro de identidad, dos de contexto de estadísticas y dos de pantalla corta. Los dos últimos casos se separaron en suites propias y se repitieron (4/4) para acompañar sus commits.
- Las primeras ejecuciones detectaron errores en los datos de prueba: el orden de importación no cambia el orden por ID de IndexedDB; los nombres largos necesitan actualizar también `nameKey`; una primera visita instala el service worker y la siguiente navegación queda bajo su control. Se corrigieron las pruebas, sin modificar validación de copias ni activación del worker para hacerlas pasar.
- La oclusión de la cabecera a 320 × 568 fue un fallo real de interfaz y se corrigió por separado. Las capturas se revisaron visualmente.
- Sin merge, push ni despliegue. `main` permanece en `138fbf1`.

Comando conjunto para reproducir los recorridos de este bloque:

```sh
CHROMIUM_PATH=/ruta/a/chrome-headless-shell npx playwright test \
  tests/courtside.spec.ts tests/editor-viewport.spec.ts tests/event-feed.spec.ts \
  tests/hmi-identity.spec.ts tests/hmi-statistics.spec.ts tests/hmi-short-viewport.spec.ts \
  --workers=1 --output=test-results/hmi-01
```

Tras esta primera parte se abordó la entrega 1b descrita más abajo. El inicio manual explícito sin voz queda aprobado y pendiente de su bloque separado. La matriz física de navegadores/tecnologías de asistencia sigue pendiente.

### Seguimiento: iconos en el selector manual

Ante el aviso de que no se veían iconos, se comprobó que Tailscale sirve este `dist` y que el bundle descargado por HTTPS coincide con el local. Samuel confirmó que los veía tras recargar. No se cambió el servicio ni se borraron datos/cachés del navegador.

En el selector del editor sí faltaba la integración: inicialmente solo se habían conectado al registro. Ahora cada opción de evento muestra su SVG decorativo junto a la etiqueta, conservando la apertura neutral, navegación por teclado y geometría de selección. El resto de ruedas mantiene sus opciones habituales.

Validación: formato y build correctos, más 14 recorridos de navegador de `hmi-identity`, `wheels` y `editor-viewport`, en móvil y escritorio. Incluye selección con iconos, guardado, persistencia tras recarga y acciones visibles con teclado simulado. `dist` regenerado.

## Entrega 1b: tipografía, contraste y controles táctiles

- Escala común de texto: contenido 16 px, ayudas/estados 14 px, títulos de evento 18 px, marcador 36 px y reloj/contadores 24 px al tamaño predeterminado. Se eliminaron reducciones móviles que llegaban a 7–10 px.
- Objetivos mínimos de 44 px; acciones habituales del partido de 48 px y captura/guardado de 56 px. Los mínimos táctiles se expresan en CSS px y el texto en rem: al ampliar texto, los controles crecen según su contenido sin duplicar innecesariamente el mínimo táctil. Los pies del editor y revisión permiten filas adicionales para etiquetas largas.
- Cabecera fija limitada a marcador/reloj. Nuevo tiempo, nombres completos, exclusiones y pestañas participan en el desplazamiento normal. Es el ajuste de estructura necesario para ampliar fuentes; las mejoras restantes del bloque 3 se mantienen separadas.
- Nombres del marcador en dos líneas, con acceso explícito a sus nombres completos mediante un `details` nativo. Abrirlo, cambiar el reloj o enfocar controles conserva su estado.
- Contadores con dorsal/estado juntos cuando caben y tiempo debajo. El caso habitual sigue por debajo de 72 px de alto, conservando texto de 14/24 px y acciones separadas de 48 px. Los idiomas o tamaños ampliados pueden usar más líneas. Se conservan pausa común/individual, sonido de cinco segundos y dorsal opcional.
- Registro con texto mayor y acciones Editar/Eliminar separadas al menos 8 px. El contenido rival mantiene su lado e icono; las acciones tienen posición consistente.
- Ruedas: una única geometría CSS de 3 rem; la lógica mide la fila renderizada y realinea al cambiar tamaño. El valor se confirma al abandonar la rueda, evitando guardar el anterior mientras queda un debounce pendiente. Cubierto por regresión de scroll inmediato y guardado.
- Bordes de campo y selección más contrastados, subrayado de pestaña activo oscuro, foco visible y estado Pausado/En juego mediante texto. Verificados contraste de texto y foco del primario y del borde del campo; esta comprobación no certifica todos los estados de la aplicación.
- Estadísticas con etiquetas y filas legibles; gráfico con ejes ampliados y espacio suficiente para sus etiquetas. El tamaño visual de los textos SVG se comprueba tras aplicar su escala al ancho de 320 px. Se conserva el cálculo y los puntos de las series.
- Aviso de voz ausente abreviado y enlace Preparar voz con objetivo de 44 px. Se conservan las reglas actuales de preparación. Se traducen los nuevos textos a los seis idiomas adicionales.

### Evidencia y validación

[Capturas, medidas y límites](evidencias/01-tipografia/README.md). A 390 × 664, el presupuesto de registro durante scroll pasa de 336 a 374 px con nombres cortos y de 261 a 358 px con nombres largos. La barra de captura aumenta en las vistas bajas para acomodar texto y objetivos táctiles; los JSON muestran esa diferencia.

- `npm test`: 135 pruebas correctas en 28 archivos.
- Formato, TypeScript y build correctos; `dist` regenerado.
- Suite completa de navegador con Whistle local: 71 correctas y una omitida deliberadamente, porque el PDF largo se comprueba solo en escritorio.
- Revisión de voz: 14 correctas. Se mantienen guardado explícito, transcripción, correcciones, nota, sustitución, errores de persistencia y viewport corto.
- Regresión final de legibilidad/teclado: 18 correctas tras revisar las capturas al 200 %. Incluye selección visible, acciones completas, foco/contraste, guardado inmediato tras scroll y geometría al ampliar texto. Son recorridos parcialmente compartidos con la suite completa.
- La primera suite detectó contadores demasiado altos: se compactó su estructura conservando la prueba de altura existente. La prueba antigua que exigía diagnóstico de voz de 11 px se actualizó a una leyenda legible y secundaria respecto al cuerpo.
- Comprobaciones automatizadas en Chromium; texto al 200 % simulado por tamaño de fuente raíz. WebKit y dispositivos físicos no estaban disponibles en esta pasada. Continúa pendiente la validación física de teclado, voz con ruido y lectores de pantalla.

Siguiente entrega: editor con selección directa de equipo, acción y jugador por dorsal/nombre, contexto compacto y campos aplicables. Los bloques de protección de borrador, deshacer, acceso/relación entre exclusión y contador, revisión de voz, tablas del gráfico e inicio manual explícito sin voz siguen en su orden previsto. Sin merge ni publicación; `main` permanece en `138fbf1`.

## Objetivo ampliado: completar todas las entregas

Samuel pide completar todos los bloques pendientes, con commit y etiqueta por bloque. Se mantiene `cambios-hmi`, sin merge ni publicación. La entrega 1 terminada está etiquetada como `hmi-01-base-visual` en `aa0f997`.

| Bloque                  | Alcance restante                                                                                     | Estado                                |
| ----------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------- |
| 2                       | Editor directo, participantes y pendientes explicados                                                | Completado · `hmi-02-editor-directo`  |
| 3                       | Prioridad de contadores activos, acceso desde reloj y ayuda sobre independencia                      | Completado · `hmi-03-contadores`      |
| 4                       | Motivos/Completar en registro, lectura de detalles, confirmaciones, acuse y protección de borrador   | Completado · `hmi-04-registro-seguro` |
| 5                       | Revisión de voz, PTT, pestañas y formularios/modales compartidos                                     | Completado · `hmi-05-accesibilidad`   |
| 6                       | Equipos comparables, denominadores y tabla del gráfico                                               | Completado · `hmi-06-estadisticas`    |
| 7                       | Inicio, ajustes, bienvenida y reproducción de transición de carga                                    | Completado · `hmi-07-inicio`          |
| Manual                  | Inicio explícito solo con entrada manual, conservando preparación para usar voz                      | Completado · `hmi-manual`             |
| Deshacer                | Reversión de una creación, incluido efecto sobre último portero; sin prometer reversión de ediciones | Completado · `hmi-deshacer`           |
| Contador tras exclusión | Acción explícita precargada; evento y contador siguen independientes                                 | Completado · `hmi-contador-desde-evento` |
| Auditoría final         | Matriz transversal, regresión de voz/PDF/ZIP/JSON, build, evidencia y límites físicos                | Completado · `hmi-auditoria-final`    |

Las decisiones aprobadas prevalecen sobre alternativas del informe: se conserva menú lateral, push to talk, lado de cada equipo y entrada manual neutral. No se cambiarán modelos ni interpretación de voz para resolver presentación.

## Entrega 2: editor directo y contexto compacto

- Dos equipos visibles y acción mediante botones nativos con estado pulsado. Gol, Parada, Pérdida y Lanzamiento fallado están a la vista; los nueve tipos restantes se eligen en Más acciones, que vuelve a plegarse sin perder el foco ni ocultar la acción elegida.
- La entrada manual sigue sin equipo ni evento implícitos. Los motivos proceden de `eventDraftIssues`, junto a los campos y en el pie. Guardar pendiente explica que no computará. Un gol sin dorsal sigue siendo válido.
- Jugadores ordenados por dorsal, con cifra de 30 px y nombre de al menos 13 px debajo. Nombre completo accesible y en la selección/resumen. Sin identificar y Otro dorsal explícitos; solo este último muestra las dos ruedas de dígitos. Cambio real de equipo limpia participantes; pulsar el equipo elegido no los borra.
- Solo aparecen participantes y metadatos aplicables. El relacionado es opcional y plegable; sustitución presenta Sale/Entra y ambos en el resumen. Nota muestra directamente su texto.
- Periodo/minuto se capturan al abrir, con edición compacta. El reloj puede avanzar durante el formulario sin cambiar ese contexto.
- Pie estable, con resumen y motivos en una zona que admite foco/desplazamiento para nombres o texto ampliado. Las acciones conservan altura y etiquetas completas; las rejillas reducen columnas antes que tamaño de letra.
- Traducciones de los nuevos textos en los seis idiomas adicionales. Sin cambios de reglas, modelos, persistencia, marcador ni formatos de copia.

Validación: 135 unitarias, TypeScript, formato y build correctos. La suite general de 84 casos pasó 81, omitió el PDF largo móvil deliberadamente y detectó dos esperas incorrectas del diagnóstico de prueba al no existir evento reconocido. Tras adaptar esa lectura sin inventar selección, los 34 recorridos finales del editor/legibilidad/teclado/notas/voz real pasaron, incluida recarga offline. Los 14 de revisión de voz también pasaron. Estos resultados se solapan; no representan 129 casos distintos.

Los fixtures de 0/7/30 jugadores y nombres de hasta 100 caracteres validan la copia antes de importarla. Se prueban cero, 7, 10 y 99, los 13 iconos/tipos, teclado, sustitución, cambio de equipo, cuatro activaciones sin scroll a 390 × 844, texto al 200 %, captura del minuto y doble envío sin duplicados. Las primeras ejecuciones permitieron corregir recortes reales, además de actualizar expectativas de las ruedas retiradas. [Capturas y límites](evidencias/02-editor/README.md).

Cierre adicional del dorsal 10: los 12 casos de `hmi-editor.spec.ts` se repitieron correctamente. Etiqueta del bloque: `hmi-02-editor-directo`.

## Entrega 3: partido y contadores activos

- Cabecera compacta de la entrega 1b conservada. El nuevo acceso junto al reloj muestra el número de contadores ocupados y cambia de icono al vencer alguno; su etiqueta accesible informa de cuántos pueden volver. Cada contador describe equipo, dorsal, estado y tiempo. Lleva al bloque sin esconderlo bajo la cabecera y enfoca una región existente. Sin observadores ni colapsos automáticos.
- Solo se renderizan contadores ocupados; una única acción Iniciar contador usa el siguiente hueco libre, hasta los tres existentes. Se conservan ordinales, equipo, dorsal opcional, pausa común/individual, liberación y sonido.
- La ayuda visible aclara que el contador no añade una exclusión estadística, y permite ampliar la explicación. No cambian persistencia ni estadísticas. El acceso después de guardar un evento de exclusión se implementará por separado.
- Se retiran las ramas y estilos de tarjetas vacías. El icono de pausa/reanudación de cada contador corresponde a su acción individual, también mientras el reloj común está detenido.
- Nuevos textos traducidos a los seis idiomas adicionales. La medición del reloj en el script de capturas sigue señalando el botón de pausa, no el nuevo acceso.

Validación: 42 recorridos de `hmi-counters`, `courtside`, `features`, `wheels`, `hmi-readability` y `hmi-short-viewport` correctos; formato, TypeScript y build correctos. Contadores de 0/1/3, teclado, nombres largos, cuatro tamaños, recarga, pausa común/individual y din-don de cinco segundos. A 390 × 664 el presupuesto del registro conserva 374/358,4 px con nombres cortos/largos. [Evidencia comparable y límites](evidencias/03-contadores/README.md). Etiqueta: `hmi-03-contadores`.

## Entrega 4: registro, confirmaciones y protección del borrador

- Pendientes con los motivos de `eventIssues`, sin duplicar reglas, y acción Completar; los registrados conservan Editar. El filtro indica el recuento también al estar activo. Tras completar/eliminar el último pendiente, el foco queda en un filtro existente, visible bajo la cabecera.
- Nota y transcripción se pueden leer en un desplegable por tarjeta, cerrado inicialmente y solo si hay contenido. Etiquetas, saltos de línea, texto largo y estado nativo accesible; se conservan al actualizar el reloj, sin escrituras ni apertura automática por voz.
- Lectura por lado conservada; acciones en una franja común a ambos equipos. La primera medición reprodujo 42/44 px de diferencia; la regresión final exige anclajes relativos con diferencia máxima de 3 px. Se permite envolver filas al ampliar texto, conservando objetivos de 48 px y separación.
- Borrar se traslada a Más en cada tarjeta y en el partido. Las confirmaciones identifican el objetivo y usan Eliminar evento/Eliminar partido. Cancelar/X/Escape conservan datos y foco; finalizar y nuevo tiempo mantienen sus operaciones actuales.
- Acuse después de persistir, para entrada manual y voz. Se usa la validación del borrador enviado para evitar anunciar pendiente cuando el snapshot anterior aún no incluye un dorsal recién creado. El acuse tiene su propia fila, sin comprimir los botones, y se limpia al comenzar otra captura/edición.
- Un borrador modificado pregunta Continuar editando/Descartar al cerrar. Se protege también la navegación por hash y Atrás, conservando las entradas indexadas para poder cancelar repetidamente. Una recarga utiliza el aviso nativo; no se implementa recuperación persistente del borrador.
- `Modal` captura el activador antes de autofocus y restaura foco tras desmontar diálogos anidados, respetando el destino elegido por el padre. No vuelve a controles desmontados o deshabilitados. Los formularios intactos cierran directamente.
- Traducciones en los seis idiomas adicionales; sin cambios del dominio, repositorio, modelos ni formato de copia.

Validación: 135 unitarias, formato, TypeScript y build correctos. Suite general: 116 correctas, una omisión prevista y un desbordamiento real al 200 % posteriormente corregido. Los 68 recorridos finales pertinentes pasaron, incluida voz real y recarga offline; tras cerrar la posición común de acciones pasaron otros 44, parcialmente solapados. Revisión de voz: 14 correctos. Los 26 casos de seguridad/lectura cubren cuatro motivos de pendiente, teclado/toque, vacíos, rival, nombres de 100 caracteres, cancelación/confirmación del objetivo, foco, Atrás repetido, descarte al navegar y recarga nativa. [Capturas y límites](evidencias/04-registro/README.md). Etiqueta: `hmi-04-registro-seguro`.

## Entrega 5: revisión de voz y accesibilidad compartida

- La interpretación recibe el foco y precede a la transcripción, plegada inicialmente. Enter sobre el resumen no guarda. Editar precede a Guardar y los valores inferidos tienen una indicación legible.
- PTT conserva pulsar/soltar con ratón, tacto y teclado; perder foco o esconder la página libera la captura. Sin cambios de modelos ni interpretación.
- Pestañas con controles/paneles enlazados, un único tabulador activo y flechas, Inicio y Fin. Los paneles inactivos no montan sus formularios.
- Formularios de equipos, jugadores, contador y confirmación comparten cuerpo desplazable y pie estable, ajustados al viewport visual. Cancelar está junto a guardar; los errores se vinculan a los campos. Enfocar una rueda revela la selección dentro del cuerpo sin alterar su valor.
- Textos nuevos traducidos a los seis idiomas adicionales.

Validación: 135 pruebas unitarias, formato, TypeScript y build correctos. 46 recorridos finales de accesibilidad, viewport, voz real, ruedas y seguridad del registro correctos; 16 de revisión de voz correctos. Incluyen Enter sin guardado, transcripción plegada, permiso denegado, parada de pistas, recarga offline, teclas de pestañas, errores de formulario y viewport visual de 420/340/220 px. [Capturas y límites](evidencias/05-accesibilidad/README.md). Etiqueta: `hmi-05-accesibilidad`.

Siguiente entrega vigente: 6, estadísticas. Siguen pendientes 7, inicio manual explícito, deshacer creación, acceso precargado al contador tras exclusión y auditoría final. El objetivo global continúa sin completar; no se ha mergeado ni publicado.

## Entrega 6: comparación y datos de gráficos

Ambos equipos se eligen directamente en el partido, en orden 1/2 y con nombre completo, conservando la perspectiva inicial y elecciones explícitas. El catálogo global sigue con sus controles actuales. La eficacia muestra goles/lanzamientos del cálculo existente; sin intentos mantiene «—» y explicación. Cada gráfico ofrece una tabla plegada con inicio del tiempo y cada gol por minuto/equipo, sin duplicar puntos auxiliares del trazado.

Validación: seis recorridos de estadísticas/viewport correctos, cinco de PDF correctos y una omisión prevista del PDF largo móvil; formato, TypeScript, build y 135 unitarias correctos. Se prueban segundo tiempo acumulado, teclado, cambio de partido, nombres largos a 320 px y jugador sin muestra. Textos traducidos a seis idiomas adicionales; sin cambios del cálculo ni persistencia. [Capturas y límites](evidencias/06-estadisticas/README.md). Etiqueta: `hmi-06-estadisticas`. Siguiente: 7, inicio/ajustes/bienvenida y transición de carga.

## Entrega 7: inicio, ajustes, bienvenida y carga

Partidos activos antes de las tarjetas de navegación; presentación más compacta cuando existen. Ajustes distingue Idioma, Voz y Datos, explica ZIP restaurable/PDF para compartir y pérdida de datos locales al borrar el navegador. La exportación anuncia descarga iniciada, sin asegurar que se haya guardado. Guía recuperable con acceso directo a la aplicación, conservando gramática, perspectiva, notas y contadores; idioma solo al principio.

HMI-32 reproducido con creación real y entrega retrasada del snapshot: el error aparecía antes de conocer los nuevos datos. Ahora una ruta ausente en el snapshot espera lectura autoritativa; un ID inexistente sí produce el error. Dos recorridos correctos. Sin temporizador ni cambio de persistencia.

La regresión de interfaz detectó movimiento de fila al enfocar rueda con puntero: se evita moverla entre pulsación y clic. Validación final: 29 recorridos de inicio/ajustes/idiomas/voz/copias/contadores/teclado correctos antes de que el proceso recibiera SIGTERM; los dos recorridos de guía pasan en una ejecución independiente. Formato, TypeScript y build correctos; las 135 unitarias del bloque anterior siguen cubriendo un dominio sin cambios. [Capturas, reproducción y límites](evidencias/07-inicio/README.md). Etiqueta: `hmi-07-inicio`. Siguiente: inicio manual explícito.

## Inicio manual explícito

Acción separada «Iniciar solo con entrada manual» cuando la voz aún no está lista. El envío habitual sigue exigiendo voz preparada/idioma; Enter en un campo no activa el modo manual. Requisitos de equipos distintos y fecha junto a las acciones, con salto al control correspondiente. Se reutiliza `createMatch`, incluida su transacción y rechazo de nombres duplicados; PTT conserva sus comprobaciones reales. Los avisos hablan de preparar para usar voz, sin contradecir la nueva alternativa.

Validación: cuatro recorridos manuales finales correctos en móvil/escritorio, más seis de ciclo normal/preferencias/manual previos (solapados). Incluye ausencia de idioma/modelo, offline, Enter, mismo equipo, fecha vacía, nombre duplicado corregible, nombres largos, editor neutral y recarga. Formato, TypeScript, build y 135 unitarias correctos. [Capturas y límites](evidencias/manual/README.md). Etiqueta: `hmi-manual`. Siguiente: Deshacer creación, con consecuencias sobre jugadores/último portero.

## Deshacer creación

Recibo transaccional temporal para la última creación manual o de voz. Deshacer retira la creación y sus jugadores nuevos, restaura los revividos/rol/último portero, conservando cambios ajenos. Comprueba versiones, referencias y portero antes de escribir; un conflicto rechaza toda la operación. El borrado habitual sigue siendo lógico. No se modifica el esquema ni la copia; tampoco se ofrece Deshacer de ediciones o tras recarga.

Validación: 146 unitarias, 34 recorridos de navegador y 16 de revisión de voz correctos. Cuatro recorridos finales repiten Deshacer después de compactar el acuse. Incluye guardar voz y deshacer offline, dos ventanas, último portero, rollback, pendiente/nota, doble intento y copia restaurable. Formato, TypeScript y build correctos. [Decisiones, captura y límites](evidencias/deshacer/README.md). Etiqueta: `hmi-deshacer`. Siguiente: contador precargado mediante acción explícita tras exclusión.

## Contador precargado tras exclusión

Acción explícita después del guardado, con equipo y dorsal enviados por el formulario/revisión (incluidos vacío/cero/nuevo). Abre la activación actual en el siguiente hueco libre; no inicia ni registra nada al abrir. Con tres ocupados lleva al bloque de contadores. Cancelar devuelve foco; Activar lo lleva al bloque existente. Oferta invalidada al cambiar la versión de la jugada. Se explica que editar/borrar/deshacer y liberar contador son independientes.

Validación: 18 recorridos correctos de contadores y acceso tras evento; dos adicionales de borrado/ZIP restaurado. Incluye ambos equipos, nombres largos, 0/99/vacío, doble toque sin duplicar, límite de tres, edición, Deshacer, recarga y copia. 146 unitarias, formato, TypeScript y build correctos. [Capturas, decisiones y límites](evidencias/contador-desde-evento/README.md). Etiqueta: `hmi-contador-desde-evento`. Solo resta auditoría final transversal.

## Auditoría final completada

Trazabilidad de los 32 HMI y decisiones aprobadas en [auditoria-final.md](auditoria-final.md). Ocho tamaños, siete idiomas, equipos de 100 caracteres, plantillas 0/7/30, registro de 200 jugadas, texto al 200 %, foco, teclado y controles compartidos. Se corrige el recorte real del acuse al ampliar texto mediante una región desplazable con espacio de foco, conservando Manual/Voz visibles. Un fallo real de escritura comprueba rollback y reintento sin perder la propuesta. La prueba de minuto capturado usa Date fijo sin congelar IndexedDB.

Validación final: 146 unitarias en 29 archivos; formato, TypeScript y build correctos. Escritorio: 84/84; móvil: 82 en tanda completa más el caso de reloj corregido y verificado aparte, una omisión prevista del PDF largo. Los 167 casos funcionales quedan validados. Revisión/carga: 22/22. La ejecución larga interrumpida por SIGTERM y los fallos previos se documentan, sin dar por verdes procesos incompletos. Whistle real/offline, PDF, ZIP y JSON incluidos. [Capturas y medidas](evidencias/final/README.md).

Sin cambios de modelos/configuración/reglas de voz, cálculo de estadísticas, PDF o formato de copia. La investigación de caché permanece aparcada. WebKit no está instalado; Safari/iPhone, Android físicos, ruido y lectores de pantalla quedan como límites de validación, sin atribuirles resultados de Chromium emulado.

Objetivo de software completado, etiqueta `hmi-auditoria-final`. Todo en `cambios-hmi`; `main` conserva `138fbf17e85668c890b36ecbe250fc91297d7650`. Sin merge, push ni publicación. `dist` regenerado y corresponde al código verificado.

## Ampliación aprobada: Mejoras 2

El trabajo posterior del ZIP y las precisiones de Samuel se siguen en [mejoras-2.md](mejoras-2.md), con commits y etiquetas por bloque. Sus decisiones sustituyen las anteriores sobre equipo inicial en entrada manual, acciones frecuentes y tres contadores: Equipo 1 propuesto solo en manual nuevo (evento sin seleccionar), matriz completa y cuatro contadores con pausa común. Se conserva el histórico de entregas de este documento. Esta ampliación permanece local en `cambios-hmi`, sin merge ni publicación.

## Finalización automática a 150 minutos

Petición posterior de Samuel: finalizar directamente al alcanzar 150:00 en el reloj visible del tiempo en curso, excluyendo pausas. Se mantiene el reinicio al iniciar otro tiempo antes del límite. La comprobación se ejecuta en cualquier pantalla y al retomar/cargar la aplicación; una transacción vuelve a leer el estado actual, ignora partidos borrados/finalizados y admite comprobaciones concurrentes sin reescribir el resultado. Cualquier acción del reloj al alcanzar el límite también finaliza, evitando que «Nuevo tiempo» lo eluda por una carrera.

Reloj y exclusiones se detienen en el instante del límite, aunque se detecte más tarde; la fecha de modificación refleja la escritura real. No se generan eventos ni se alteran marcador/estadísticas. Se conservan correcciones de eventos después del cierre. Sin cambios de esquema, copia, voz o modelos. Una escritura fallida muestra el error y permite reintentar en la siguiente comprobación.

Validación: 158 unitarias en 33 archivos; 16 recorridos de Chromium móvil/escritorio correctos. Incluyen frontera exacta, pausa de una hora, despertar tardío/foco, recarga desde catálogo, persistencia/backup, dos llamadas concurrentes, acción de reloj en el límite, edición posterior, ciclo normal offline y cuatro contadores. Formato, TypeScript y build correctos; `dist` regenerado. [Captura revisada y límites](evidencias/limite-150/README.md). Etiqueta `hmi-limite-150-min`. Solo `cambios-hmi`; sin merge/push/publicación.
