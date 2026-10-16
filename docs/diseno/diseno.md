# Diseño de Handball Stats

Documento de diseño funcional y técnico · Versión 1.0 · 15 de octubre de 2026

Handball Stats permite registrar estadísticas de balonmano durante un partido, con entrada por voz y controles móviles rápidos. La prioridad es conservar lo sucedido y permitir corregirlo sin interrumpir la captura. La explotación estadística queda subordinada a esa tarea.

La primera versión se organiza en Inicio, Nuevo partido, Equipos, Partidos, Estadísticas y la pantalla de registro. El diseño mantiene pocos campos obligatorios, plantillas abiertas y un único registro por acción. Las consecuencias estadísticas se calculan a partir de ese registro.

## 1 Acceso a los wireframes y fuentes

El anexo visual incluye ocho vistas de referencia y el archivo `wireframes/index.html` permite recorrerlas sin conexión. En esa misma galería se puede desplegar el código original de los prototipos recuperados de las conversaciones. Las vistas consolidadas son reconstrucciones de diseño con las últimas reglas; no son capturas de la interfaz original de ChatGPT. El código DIL original requiere su entorno de ejecución para reproducir sus interacciones.

Las referencias C1, C2 y C3 identifican las conversaciones. Los localizadores como C1.47 identifican mensajes en las transcripciones locales y en los archivos originales. El número se conserva para poder contrastar cada decisión.

- C1 · Diseñar pantalla principal · https://chatgpt.com/share/6ad1044d-1eec-83eb-ba8a-3ef2d458b76f
- C2 · Propuesta de eventos · https://chatgpt.com/share/6ad10460-13bc-83ed-a9be-92278a709735
- C3 · Opciones tecnológicas app · https://chatgpt.com/share/6ad1047f-dc74-83eb-80f8-6cb78ea67b66

La especificación funcional recoge las correcciones explícitas más recientes de cada tema. Las propuestas técnicas y las cuestiones aún abiertas se identifican como tales. El anexo conserva los prototipos anteriores, incluidos sus estados provisionales, para mantener la trazabilidad.

## 2 Alcance y principios

El usuario principal es quien registra el encuentro desde un móvil, habitualmente un delegado. Debe poder operar con ruido, poco tiempo y datos incompletos. La aplicación debe funcionar localmente, también sin conexión una vez descargados sus recursos, y cubrir iOS y Android. [C3.1]

- Registrar primero y completar después. Un dorsal válido identifica al jugador aunque no tenga nombre ni ficha previa.
- Aplicar la misma lógica a ambos equipos. Pueden ser conocidos, nuevos o del mismo club.
- Conservar una única acción como fuente de verdad. No generar eventos auxiliares para representar sus efectos estadísticos.
- Dar señales redundantes: texto, icono, estado y posición. El color acompaña a la información.
- Mantener posiciones estables en el editor. Los campos no aplicables quedan visibles y desactivados.
- Priorizar simplicidad. No exigir plantillas, duración de tiempos ni configuración avanzada para empezar.

Fuera del alcance inicial quedan cambios de dorsal, bloqueos como evento, faltas ordinarias, exclusiones de cuatro minutos, clasificación de pérdidas o recuperaciones, fuera/poste, zonas de tiro y el metadato «forzado pasivo». Tampoco se incluyen gráficos, comparativas ni filtros avanzados de estadísticas. Competiciones, temporadas y categorías no tienen sección propia. [C1.53, C1.62; C2.14–23]

## 3 Decisiones consolidadas

| Tema | Decisión vigente | Referencia |
| --- | --- | --- |
| Alta de partido | Dos controles simétricos; desplegable de catálogo o botón Nuevo; fecha | C1.39–47 |
| Jugadores | Alta automática por dorsal nuevo en cualquier equipo; nombre opcional | C1.20–38 |
| Identidad | Dorsal fijo dentro del equipo; sin cambios entre partidos | C1.53 |
| Desconocido | Un jugador virtual por equipo; recibe atribuciones individuales sin identidad | C2.24–28 |
| Catálogo | Once tipos; Infracción agrupa Pasos, Dobles y Pisando | C2.41–45 |
| Efectos | Parada implica fallo rival; recuperación implica pérdida rival; sin duplicar eventos | C2.24, C2.34–40 |
| Exclusión | Sinónimo de 2 minutos; forzada solo como estadística individual | C2.34–40 |
| Reloj | Gestión en cabecera; Nuevo tiempo con confirmación; más de dos tiempos | C3.139–148 |
| Editor | Evento y minuto con rueda; intervinientes compactos; campos fijos | C3.149–164 |
| Estadísticas | Equipo y partido o todos; pestañas Equipo y Jugadores; sin gráficos | C1.58–66 |

Las propuestas iniciales de un rival especial, una plantilla cerrada, cambios de dorsal o tres eventos separados para infracciones quedan sustituidas por estas decisiones. La tarjeta azul se conserva como metadato de Descalificación, no como tipo independiente. El pasivo no tiene jugador, aunque aparezca uno en un prototipo anterior. [C1.39–53; C2.23, C2.45]

## 4 Navegación y pantallas

Inicio da acceso a Nuevo partido, Equipos, Partidos y Estadísticas. Iniciar o continuar un partido abre Registro, con pestañas Eventos y Estadísticas. Desde Partidos se abre el detalle; desde allí se continúa un encuentro o se corrigen sus eventos. El editor se presenta como panel inferior dentro del registro, preservando el contexto.

### 4.1 Inicio y nuevo partido

Inicio muestra Nuevo partido como primera caja, Equipos y Partidos en dos columnas y Estadísticas debajo. «Continuar partido» cuando haya uno activo y un icono de Ajustes son propuestas de C1.13; su comportamiento detallado no quedó cerrado. No se añade otra sección obligatoria. Wireframe W01.

Nuevo partido tiene Equipo local, Equipo visitante y Fecha. Ambos equipos usan exactamente el mismo componente: desplegable del catálogo y botón «Nuevo» que cambia a un campo de nombre; «Catálogo» revierte el modo. Se permiten dos equipos nuevos, dos existentes o uno de cada. La fecha comienza con el día actual y es editable. Los equipos nuevos quedan disponibles para completar sus datos posteriormente. Wireframe W02. [C1.47]

«Iniciar partido» requiere dos equipos distintos y nombres no vacíos cuando se crean. La comprobación por identidad es necesaria para equipos existentes; el tratamiento de nombres coincidentes en nuevas altas debe concretarse. No hay selección de jugadores, número de tiempos, duración ni pregunta adicional sobre jugar como local o visitante. La preselección de un equipo habitual no se incorpora al flujo base simétrico.

### 4.2 Equipos y jugadores

La lista permite buscar, crear y abrir equipos. El detalle permite editar el nombre, consultar dorsales, completar nombres y añadir un jugador manualmente. Un equipo sin jugadores es válido y debe mostrar que estos se incorporarán durante el registro. Wireframe W03. [C1.52–53]

El par equipo y dorsal identifica al jugador. Cuando llega un dorsal conocido se reutiliza; si es nuevo se crea automáticamente, incluso en un equipo ya configurado. Introducir un dorsal sin nombre no deja el evento inválido. El nombre es opcional. «Desconocido» es un registro virtual, sin dorsal, que no cuenta como jugador real de la plantilla.

El requisito inicial contempla borrar equipos y jugadores, con baja lógica cuando exista historial. El wireframe final no desarrolla ese flujo. Se propone preservar todas las referencias históricas y reservar la eliminación definitiva a registros sin uso; los controles y confirmaciones quedan pendientes. [C3.1]

### 4.3 Partidos e histórico

La lista incorpora búsqueda por equipo, encuentros en curso primero e histórico cronológico. Cada entrada muestra fecha, equipos, marcador y estado. En el detalle se puede editar la fecha o los equipos, continuar un partido, abrir sus eventos y consultar sus estadísticas. Wireframe W04. [C1.57–58]

Un partido finalizado sigue siendo editable y admite eventos olvidados. El reloj no avanza en esa edición. El marcador se obtiene de los goles válidos; no se modifica directamente. Eliminar exige confirmación. El criterio de baja lógica del requisito inicial debe prevalecer sobre el texto «definitivamente» de la demostración hasta resolver la política de borrado. Cambiar equipos en un partido con eventos requiere una regla explícita de reasignación; no debe romper jugadores ni estadísticas.

### 4.4 Registro durante el partido

La cabecera mantiene visibles equipos, marcador, tiempo de juego y minuto. Incluye Parar/Reanudar y Nuevo tiempo. El cambio de tiempo pide confirmación; cancelar no altera nada. La captura no impone dos tiempos como límite. El cierre del partido necesita un control propio, cuya ubicación final está pendiente. [C3.118–148]

Las tarjetas son compactas, con icono por tipo, identificación del equipo, dorsal o estado, minuto y acción «Editar». Se alinean a izquierda y derecha según el equipo. Los prototipos usan «Nuestro» y «Rival»: para encuentros arbitrarios se propone local a la izquierda y visitante a la derecha, mostrando siempre sus nombres. Esa orientación no cambia la identidad de los equipos. Wireframe W05.

La pestaña Eventos presenta la secuencia con acceso a pendientes. Un evento con datos mínimos válidos actualiza inmediatamente marcador y estadísticas; uno inválido permanece localizable sin computar. La captura manual y el botón de pulsar para hablar deben seguir accesibles. La voz de los prototipos es simulada y no acredita una integración real de Cactus.

### 4.5 Editor uniforme de eventos

Un panel inferior permite cambiar el tipo de evento, equipo, minuto, jugadores, metadatos y nota. El tipo utiliza una rueda; el minuto ocupa la posición derecha a su lado. Cada interviniente usa una fila compacta de equipo, dorsal y selector de jugadores, con nombre como confirmación visual. Las grandes ruedas de dos dígitos de las primeras propuestas quedan sustituidas por el diseño compacto. Wireframe W06. [C3.154–164]

Principal y relacionado mantienen su posición. Las etiquetas cambian según el evento. Los campos no aplicables aparecen sombreados y desactivados, incluidos los jugadores en Pasivo. Penalti, tarjeta azul y tipo de infracción se activan según el catálogo vigente. Cambiar de tipo elimina del dato activo las propiedades incompatibles; no basta con ocultarlas.

Guardar valida, persiste y recalcula. Cancelar descarta la edición. Cambiar equipo obliga a revisar los participantes para no conservar un jugador del equipo anterior. Un dorsal nuevo crea el jugador al guardar, en la misma operación que el evento. La selección de un jugador conocido y el dorsal escrito deben permanecer sincronizados.

### 4.6 Estadísticas

Una sola pantalla ofrece selector de equipo y selector de partido con «Todos los partidos». Cambiar equipo restablece el partido seleccionado; cambiar cualquiera de los filtros limpia el detalle del jugador. Hay pestañas Equipo y Jugadores. Wireframes W07 y W08. [C1.62–66]

Equipo muestra goles, lanzamientos fallados, eficacia y paradas, seguidos de pérdidas, recuperaciones, exclusiones, infracciones y pasivos. Jugadores muestra dorsal, goles y fallados; al pulsar se abre el detalle con eficacia y demás métricas, incluida exclusión forzada. Desconocido aparece como un jugador más. Las exclusiones forzadas nunca se suman en la vista de equipo.

La pantalla mínima no enseña todos los contadores del catálogo: amarillas, descalificaciones, penaltis y asistencias pueden calcularse aunque su presentación no esté cerrada. La eficacia se calcula únicamente sobre acciones registradas. Con cero lanzamientos se muestra «—»; no un porcentaje inventado.

## 5 Catálogo de eventos y validación

Todo evento necesita tipo y equipo para computar. Partido e identificador los aporta el contexto. El jugador es opcional; su ausencia no invalida una acción. Para Infracción, la última respuesta de C2 añade el subtipo obligatorio. Se adopta esa regla en la especificación, dejando señalada su tensión con el principio anterior de «solo equipo obligatorio» para confirmación antes de implementar. [C2.20–45]

| Evento | Principal opcional | Relacionado opcional | Metadatos |
| --- | --- | --- | --- |
| Gol | Goleador | Asistente del mismo equipo | Penalti |
| Parada | Portero | Lanzador rival | Penalti |
| Lanzamiento fallado | Lanzador | No aplica | Penalti |
| Pérdida | Responsable | No aplica | Ninguno |
| Recuperación | Recuperador | Rival que pierde | Ninguno |
| Penalti cometido | Infractor | Beneficiario rival | Ninguno |
| Exclusión | Excluido | Provocador rival | Ninguno; siempre 2 minutos |
| Tarjeta amarilla | Amonestado | No aplica | Ninguno |
| Descalificación | Descalificado | Provocador rival | Tarjeta azul |
| Pasivo | No aplica | No aplica | Ninguno |
| Infracción | Infractor | No aplica | Pasos, Dobles o Pisando |

Penalti y tarjeta azul son opcionales. Su ausencia no debe interpretarse como una observación explícita de «no» si el sistema necesita medir calidad del dato. Se propone admitir valor no indicado además de sí/no en el almacenamiento, aunque la interfaz use una casilla simple. La participación del provocador de Descalificación se conserva como dato; no se define una nueva métrica por ello.

### 5.1 Estados del evento

| Estado funcional | Condición | Cómputo | Presentación |
| --- | --- | --- | --- |
| Pendiente obligatorio | Falta tipo, equipo o subtipo exigido de infracción | No | Aviso explícito y acceso a editar |
| Válido sin identificar | Mínimos completos; protagonista sin dorsal | Sí | Desconocido y señal de datos completables |
| Válido identificado | Protagonista identificado o evento sin protagonista | Sí | Estado normal |
| Eliminado | Marcador de baja lógica | No | Fuera de la lista habitual |

No se exige rellenar todos los datos opcionales para considerar un evento identificado. La falta de asistencia, penalti o provocador no convierte por sí sola la tarjeta en pendiente. Un pasivo correctamente asignado al equipo es completo sin jugador. Los estados son derivados de los datos, no otra fuente independiente de verdad.

### 5.2 Voz y corrección

El flujo previsto es pulsar para hablar, capturar audio, transcribir con Whistle, interpretar con Needle, resolver tipo/equipo/participantes, validar y guardar. La entrada manual usa las mismas reglas. Debe conservarse la transcripción literal separada de una nota editable. [C3.1, C3.30–49]

Ejemplo: «gol nuestro, Ana» con equipo resuelto y nombre sin coincidencia genera un gol válido para Desconocido de ese equipo. El marcador sube. Al asignar dorsal 9, el gol pasa de Desconocido a la jugadora 9; el marcador permanece igual. Si «nuestro» no tiene un equipo de referencia definido, la acción queda pendiente, sin adivinar la atribución.

La referencia verbal «nuestro» requiere decidir un contexto de captura sin complicar el alta simétrica. Se propone poder fijarlo dentro del partido o usar nombres explícitos. Los errores de micrófono, modelos ausentes o interpretación no resuelta deben dejar disponible la entrada manual y una indicación comprensible. La viabilidad de voz offline continúa pendiente de prueba técnica.

## 6 Consecuencias estadísticas

La tabla expresa aportaciones por un único evento válido y no eliminado. Las métricas se recalculan al modificar, reasignar o borrar. «Fallo» agregado incluye tanto un lanzamiento fallado directo como el lanzamiento no convertido derivado de una parada rival. [C2.28–45]

| Evento | Equipo principal | Equipo contrario | Particularidad individual |
| --- | --- | --- | --- |
| Gol | 1 gol y 1 lanzamiento | 1 gol recibido y 1 lanzamiento recibido | Gol al goleador; asistencia solo si indicada |
| Parada | 1 parada y 1 lanzamiento recibido | 1 lanzamiento y 1 fallo | Parada al portero; fallo al lanzador rival |
| Lanzamiento fallado | 1 lanzamiento y 1 fallo | 1 lanzamiento recibido | Fallo al lanzador |
| Pérdida | 1 pérdida | Sin efecto | Pérdida al responsable |
| Recuperación | 1 recuperación | 1 pérdida | Recuperación al principal; pérdida al rival |
| Penalti cometido | 1 penalti cometido | 1 penalti recibido | Infractor; atribución al beneficiario por concretar |
| Exclusión | 1 exclusión | Sin contador de exclusión forzada | Excluido; forzada solo al provocador identificado |
| Tarjeta amarilla | 1 amarilla | Sin efecto | Amarilla al amonestado |
| Descalificación | 1 descalificación | Sin efecto | Descalificado; desglose azul si procede |
| Pasivo | 1 pasivo | Sin efecto | Ninguna atribución individual |
| Infracción | 1 infracción y 1 pérdida | Sin efecto | Mismas métricas al infractor y desglose por tipo |

Una parada no exige añadir otro lanzamiento fallado. Una recuperación no exige añadir otra pérdida. Una pérdida aislada no implica una recuperación rival. Infracción y pérdida derivada tampoco son dos eventos. Penalti cometido y lanzamiento posterior sí son hechos distintos.

El jugador virtual recibe las estadísticas de participantes necesarios sin identidad: goleador, portero, lanzador rival de una parada o rival que pierde en una recuperación. No se inventan asistencias ni exclusiones forzadas cuando no se identifica esa participación opcional. Pasivo nunca se atribuye a Desconocido.

### 6.1 Fórmulas y límites

- Lanzamientos = goles + fallos agregados.
- Fallos agregados = lanzamientos fallados directos + paradas del contrario.
- Eficacia de tiro = 100 × goles / lanzamientos, solo si el denominador es mayor que cero.
- Pérdidas base = pérdidas directas + recuperaciones contrarias + infracciones propias.
- Totales de equipo atribuibles a personas = jugadores identificados + Desconocido. Las métricas exclusivamente colectivas se añaden por separado.

Incluir pasivos dentro de pérdidas totales fue una propuesta de C2.33, no una decisión explícita posterior. Para esta versión se propone mostrarlos separados y confirmar si deben añadirse al total de pérdidas. Debe evitarse que «pasivo» se cuente dos veces si se adopta ese agregado.

C2.33 propone eficacia de portería como paradas/lanzamientos recibidos, pero el denominador incluye tiros fuera o al poste. Además, no se identifica al portero que encaja un gol. Por ello la pantalla mínima no ofrece un porcentaje individual de portería. Su definición y atribución quedan pendientes. Tampoco se debe inferir que una muestra incompleta representa toda la actividad del partido.

## 7 Tiempo orden y edición retrospectiva

Reloj, inicio o fin de tiempo e inicio o fin de partido pertenecen al control del encuentro, no al catálogo estadístico. El reloj puede pausarse y reanudarse. Nuevo tiempo necesita confirmación y permite tiempo 3, 4 y sucesivos sin preconfigurar su número. Los segundos no se muestran en la captura ordinaria. [C3.126–148]

Se propone almacenar el número de tiempo y el minuto relativo dentro de él, como en el último prototipo. El reloj conserva internamente la precisión necesaria para reanudarse. El borrador del editor tiene su propio minuto: editar un evento no debe modificar el cronómetro real, aunque alguna demostración reutilice el mismo estado.

Los eventos necesitan un orden estable distinto de su fecha de creación. Así se puede insertar o mover una infracción antes de un gol aunque se capture después. Los límites del selector de minuto deben respetar los vecinos dentro del mismo tiempo. La resolución de conflictos al arrastrar entre tiempos o entre vecinos con minutos incompatibles no quedó definida; se propone pedir un ajuste explícito en lugar de cambiar silenciosamente la hora.

Un partido histórico mantiene sus tiempos y minutos, pero no inicia el reloj. Finalizar detiene la captura temporal automática, sin bloquear la corrección posterior. Tras cerrar y abrir la aplicación, el estado del partido y del reloj debe recuperarse; las pausas y el tiempo activo requieren persistencia separada.

## 8 Modelo de datos propuesto

Este esquema lógico traduce las reglas funcionales; los nombres de campos y el motor concreto no son decisiones cerradas. La identidad se mantiene separada del texto visible. Los datos del prototipo son ejemplos, no registros de producción.

| Entidad | Campos principales | Invariantes |
| --- | --- | --- |
| Equipo | id, name, createdAt, updatedAt, deletedAt | Identidad persistente y nombre editable |
| Jugador | id, teamId, dorsal, name, isUnknown, deletedAt | Dorsal único por equipo; un virtual sin dorsal por equipo |
| Partido | id, localTeamId, visitorTeamId, date, status, clock | Equipos distintos; marcador derivado |
| Evento | id, matchId, type, teamId, primaryPlayerId, relatedPlayerId | Equipo participante; roles compatibles con el tipo |
| Tiempo de evento | period, minute, orderKey | Orden independiente de createdAt |
| Datos ampliados | metadata, rawText, note, createdAt, updatedAt, deletedAt, schemaVersion | Metadatos versionados y compatibles con el tipo |

Los participantes no identificados pueden almacenarse como referencia vacía y resolverse a Desconocido al calcular estadísticas, conservando qué indicó realmente el usuario. El evento pendiente puede persistirse sin campos obligatorios; su exclusión del cálculo depende de la validación.

Se propone guardar atómicamente equipo o jugador nuevo y evento, evitar dos altas del mismo dorsal por capturas concurrentes y persistir antes de confirmar visualmente el guardado. El marcador y los agregados no se editan como datos independientes. Una caché estadística, si existe, debe poder reconstruirse desde los eventos.

Los atributos opcionales de metadata reducen cambios de esquema, pero no eliminan la necesidad de versiones, validación y migración. La baja lógica excluye registros del cómputo manteniendo las referencias necesarias para el historial. El criterio de purga definitiva debe definirse antes de ofrecer esa acción.

## 9 Arquitectura y persistencia

La dirección discutida es validar primero una aplicación web instalable y conservar la posibilidad de empaquetarla con Capacitor. React o Svelte con TypeScript permanecen como candidatos. La conversación no cierra un framework ni demuestra el rendimiento de voz en dispositivos reales. [C3.48–57]

La arquitectura propuesta separa interfaz, lógica de dominio, captura e interpretación y repositorio local. Voz y entrada manual convergen en la misma validación. El cálculo estadístico depende de eventos, no del reconocimiento de voz. Los adaptadores permiten sustituir la persistencia o la inferencia sin cambiar las reglas de negocio.

El requisito inicial pedía un archivo SQLite único. Después se explora IndexedDB con Dexie para simplificar y evitar depender de OPFS; el usuario aclara que su motivo era la robustez. La última recomendación favorece IndexedDB y exportación JSON, pero no existe una ratificación inequívoca del cambio de formato. Se documenta como opción preferente pendiente, no como requisito ya cerrado. [C3.1, C3.80–103]

| Decisión técnica | Orientación | Condición de cierre |
| --- | --- | --- |
| Distribución | Web primero; posible empaquetado posterior | Fluidez y fiabilidad reales en iOS y Android |
| Interfaz | React o Svelte con TypeScript | Elegir después de la prueba de voz |
| Inferencia | Whistle y Needle locales | Validar integración, memoria, latencia y ruido |
| Persistencia | IndexedDB y Dexie como candidata | Confirmar abandono del archivo SQLite único |
| Exportación | JSON versionado si se usa IndexedDB | Probar exportación e importación completas |
| Compatibilidad | Sin versión mínima cerrada | Matriz de dispositivos y recursos de voz |

Las capacidades concretas de los SDK mencionadas en las conversaciones deben verificarse durante la prueba técnica; este diseño no las da por certificadas. Tampoco se asume que PWA y aplicación empaquetada compartan almacenamiento automáticamente.

La propuesta de robustez incluye escritura transaccional, recuperación tras recarga, comprobación de recursos antes del uso offline, exportación local y restauración verificable. El reconocimiento debe ejecutarse sin bloquear los controles. Las copias deben incluir entidades, eventos pendientes, bajas lógicas y versión del esquema. Importar requiere validar referencias y resolver identificadores repetidos; la política de mezclar o reemplazar datos permanece abierta.

## 10 Criterios de aceptación

| Caso | Resultado verificable |
| --- | --- |
| Dos equipos nuevos sin jugadores | Se inicia el partido con nombres y fecha únicamente |
| Equipo existente con dorsal nuevo | Se crea un jugador reutilizable sin exigir nombre |
| Dorsal repetido en el mismo equipo | Se reutiliza; no duplica identidad |
| Gol sin jugador | Sube el marcador y se atribuye a Desconocido |
| Asignar dorsal a ese gol | Cambia la atribución; no cambia el marcador |
| Falta equipo o tipo | Se conserva pendiente y no computa |
| Parada sin lanzador | Añade parada y fallo de Desconocido rival una sola vez |
| Recuperación sin rival identificado | Añade recuperación y pérdida rival; no otro evento |
| Pérdida directa | No incrementa recuperaciones del contrario |
| Exclusión con provocador | Suma una exclusión y una forzada individual; sin contador colectivo de forzadas |
| Pasivo sin jugador | Es válido y no añade estadísticas a Desconocido |
| Infracción Pasos | Añade una infracción y una pérdida; sin evento extra |
| Cambiar Gol a Pérdida | Retira gol y penalti activo; recalcula marcador |
| Dorsal sin nombre | Evento identificado; el nombre puede completarse después |
| Nuevo tiempo cancelado | No cambia tiempo ni minuto; confirmar permite un tercer tiempo |
| Corregir partido finalizado | Edita eventos sin poner en marcha el reloj |
| Eliminar evento | Retira todas sus consecuencias estadísticas |
| Cero lanzamientos | Eficacia «—» |
| Cerrar y reabrir | Recupera datos guardados y estado temporal coherente |
| Exportar e importar | Conserva identidades, pendientes y resultados calculados |

Además se necesita probar captura manual mientras se procesa voz, funcionamiento sin red tras descargar recursos y lectura táctil de controles en móviles reales. Los objetivos cuantitativos de latencia y batería se fijarán tras medir; no se inventan umbrales ya aceptados.

## 11 Decisiones pendientes y siguiente paso

Antes de implementar conviene cerrar la persistencia, las versiones mínimas y la viabilidad local de Whistle y Needle. La prueba técnica debe ejecutar una captura completa en iOS y Android, medir la interacción bajo ruido, guardar un evento, cerrar y recuperar la aplicación y exportar/importar sus datos.

En el dominio quedan por resolver si pasivo suma pérdidas, si el subtipo de Infracción puede quedar pendiente sin bloquear el total genérico, la atribución de penaltis recibidos y la definición de eficacia de portería. En la interacción faltan el alias «nuestro», el cierre del encuentro, el detalle de reordenar entre tiempos, el cambio de equipos con historial y la política de baja o purga. Estas decisiones no bloquean la revisión de las pantallas principales.

La implementación puede avanzar por entregas: primero equipos, partidos y captura manual con persistencia; después editor, estados y estadísticas derivadas; a continuación voz local validada; por último copias, recuperación y empaquetado. Las reglas de un único evento y atribución a Desconocido deben comprobarse antes de ampliar estadísticas.

## 12 Anexo visual

Las ocho vistas siguientes consolidan la distribución y las reglas vigentes. Los valores, nombres y marcadores son ilustrativos. Para consultar las versiones originales y sus interacciones declaradas, abrir `wireframes/index.html`; los archivos fuente están en `wireframes/originales/`.

| Vista | Contenido | Base original |
| --- | --- | --- |
| W01 | Inicio | C1.13 |
| W02 | Nuevo partido simétrico | C1.47 |
| W03 | Equipo y jugadores | C1.52 con corrección C1.53 |
| W04 | Histórico y acceso a detalle | C1.57 |
| W05 | Registro y tarjetas compactas | C3.121 y C3.148 |
| W06 | Editor uniforme consolidado | C3.154–164 y catálogo C2.45 |
| W07 | Estadísticas de equipo | C1.62 |
| W08 | Jugadores y detalle individual | C1.62 |
