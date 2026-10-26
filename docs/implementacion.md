# Estado de la implementación

Primera entrega funcional basada en `diseno/diseno.md`. No representa la implementación completa de todas las fases del diseño.

## Decisiones de esta entrega

| Aspecto | Implementación |
| --- | --- |
| Plataforma | Aplicación web responsive con caché PWA. Sin contenedor nativo todavía. |
| Persistencia | IndexedDB mediante Dexie; transacciones para crear partidos, resolver jugadores, guardar eventos e importar copias. |
| Identidad | UUID por entidad. Nombre de equipo normalizado único; dorsal 0–99 único por equipo. El dorsal de un jugador existente no se edita. |
| Desconocido | Jugador virtual por equipo. Una acción sin principal se atribuye a él en el cálculo. No se inventan asistentes ni provocadores de exclusión. |
| Eventos pendientes | Se conservan sin tipo, equipo o subtipo obligatorio de infracción, pero no cuentan. |
| Orden | Tiempo, minuto y orden de inserción como desempate. Editar minuto recoloca la acción. Arrastre y restricciones por vecinos pendientes. |
| Reloj | Tiempo transcurrido calculado a partir de marcas temporales; independiente de los minutos de eventos. Continúa al cerrar la vista salvo pausa o finalización. |
| Pasivo | Estadística de equipo separada; no suma pérdida. Decisión provisional del diseño. |
| Copias | Exportación ZIP con JSON versión 1; restauración ZIP o JSON, con validación de estructura, referencias, dorsales y campos compatibles. Reemplazo completo confirmado; sin fusión. |
| Eliminación | Borrado lógico de eventos y partidos; el partido elimina también sus eventos del cómputo. No hay papelera visible todavía. |

## Reglas incluidas

Gol, parada, lanzamiento fallado, pérdida, recuperación, penalti cometido, exclusión, amarilla, descalificación con azul opcional, pasivo e infracción (pasos, dobles, pisando).

Una parada deriva un lanzamiento fallado rival; una recuperación deriva una pérdida rival. No se insertan eventos adicionales para esas consecuencias. Una pérdida por sí sola no presupone recuperación rival. Las estadísticas se recalculan desde los eventos y excluyen los pendientes y eliminados. La eficacia sin lanzamientos se muestra como «—».

## Pendiente respecto al diseño completo

- Validación de voz en dispositivos reales y ruido de pista. La integración web Whistle con reglas deterministas permite descargar el modelo, capturar audio, transcribir e interpretar localmente y revisar el evento antes de guardar; consulta `voz.md`.
- Arrastre y reordenación manual, con resolución de las reglas de límites temporales del diseño.
- Edición de fecha/equipos del partido y gestión completa de bajas/restauraciones de catálogo.
- Presentación de todos los desgloses estadísticos: el motor calcula más métricas de las que muestra esta interfaz inicial.
- Validación nativa iOS/Android, empaquetado, instalación y ciclo de actualización de modelos/aplicación.
- Decisiones abiertas del diseño: semántica final de pasivo, atribución individual de penalti recibido, límites de dorsal y ajustes de la reordenación.

## Comprobaciones

Las pruebas automatizadas cubren consecuencias estadísticas, atribución a desconocido, exclusión de pendientes, correcciones y borrado, reloj, rollback, reutilización concurrente de dorsales, conflicto de edición y copias válidas/inválidas. El recorrido de navegador comprueba creación, captura, corrección, persistencia, finalización y recarga sin conexión en vistas móvil y escritorio.

No hay datos de demostración precargados ni resultados simulados. El almacenamiento depende del navegador: exportar copias permite recuperar los datos si se borra su almacenamiento.

Resultado de esta entrega: compilación de producción correcta, 8 pruebas de reglas/persistencia y 2 recorridos de navegador aprobados (Chromium con tamaños móvil y escritorio). Revisadas visualmente las capturas de detalle de partido en ambos tamaños. No se ha probado aún en dispositivos físicos.

## Entrega de voz — 16 de octubre de 2026

Integrados Whistle y Needle en workers WebAssembly con modelos versionados y verificados, descarga inicial, caché, AudioWorklet y captura de hasta 20 segundos. Se puede mantener pulsado o iniciar/detener con toques. Desde la precisión posterior del usuario, «nuestro/nosotros» siempre es el equipo 1 y «ellos/rival/suyo» el equipo 2, desde la perspectiva de quien graba e independientemente del lugar del encuentro. La propuesta se valida y revisa en el editor compartido antes de guardar, conservando la transcripción literal. Las propuestas inciertas se advierten; las respuestas múltiples o sin respaldo no rellenan datos.

Validación: 13 pruebas de reglas/persistencia/resolución, 2 recorridos manuales de navegador y 2 recorridos con modelos reales, en Chromium móvil y escritorio. Los últimos incluyen segunda inferencia tras recargar sin red y sin nuevas peticiones de modelos, liberación de pistas, permiso denegado, mantener pulsado y edición manual simultánea. Se revisaron capturas de la interfaz. Los audios son sintéticos y el evento se revisa/corrige explícitamente: estas pruebas no certifican exactitud de reconocimiento.

Siguen pendientes los demás bloques enumerados arriba, en especial arrastre, gestión completa de catálogo/partidos, desgloses estadísticos e integración y validación nativa.

### Idiomas, bienvenida y exclusiones (16 de octubre de 2026)

- Interfaz traducida a español, inglés, alemán, francés, italiano, neerlandés y polaco. Primera selección a partir del navegador (español si no está soportado), modificable en bienvenida y Ajustes. Preferencia local; las claves de datos y copias no dependen del idioma.
- Idioma de voz independiente y persistente, seleccionable antes de preparar/grabar. Los siete idiomas usan el mismo Whistle; no hay siete descargas. Needle recibe el idioma de captura y las reglas de perspectiva multilingües, conservando los valores canónicos del esquema.
- Galería de cinco pasos en el primer uso: filosofía, preparación de voz, grabar/revisar/guardar, perspectiva y exclusiones. Se puede omitir o volver a abrir desde Ajustes. No graba ni descarga sin acción del usuario.
- Tres contadores por partido de 120 segundos, identificados por equipo y dorsal. Activar, parar/reanudar y liberar. Se sincronizan con las pausas del reloj, conservan el tiempo pendiente al cambiar de periodo y se detienen al finalizar el partido. Se guardan en IndexedDB y en la copia JSON; las copias anteriores sin contadores siguen siendo válidas.
- A cero aparece «Puede volver». Sonido opcional, habilitado mediante un gesto, una vez por contador mientras la vista del partido está abierta. No se garantiza sonido con la pantalla bloqueada, la pestaña suspendida o tras abandonar esa vista. Al volver a abrir el partido, el tiempo restante se recalcula y el aviso visual continúa hasta liberar el contador.
- Activar un contador no crea estadísticas: la exclusión estadística se registra como evento manual o por voz. Liberar un contador activo pide confirmación; liberar uno vencido es inmediato.

- Compatibilidad HTTP: la generación de UUID usa `crypto.randomUUID()` cuando existe y UUID v4 con `crypto.getRandomValues()` en contextos HTTP. Verificada creación y persistencia de equipos, jugadores, partidos, eventos y contadores sobre la IP de Tailscale.
- Acceso al servidor: `server.allowedHosts` y `preview.allowedHosts` se establecen en `true`, por petición expresa del usuario. HTTPS permanece fuera de este cambio.

Validación de este bloque: 18 pruebas de dominio, persistencia, idiomas, UUID sin `randomUUID` y configuración de voz; 8 recorridos Chromium en móvil/escritorio, incluidos captura con modelos reales, segunda inferencia sin red, bienvenida y tres exclusiones. Compilación de producción correcta. Además se verificó el recorrido manual y su persistencia sobre HTTP real en Tailscale sin `crypto.randomUUID`. La prueba acústica automatizada usa una muestra sintética española; no certifica precisión con voces nativas de los otros seis idiomas ni en un pabellón.

### Preparación y controles de pista

- Modelos e idioma se preparan antes del partido. Alerta si faltan los archivos locales; el botón de inicio exige idioma y modelos cargados. Se inspecciona CacheStorage y se verifica al cargar; no se confía en una preferencia booleana. Tras recargar en un partido solo se carga desde caché.
- Comprobación explícita del micrófono antes de la descarga o del partido; solicita permiso y cierra las pistas inmediatamente. Verificada la API real en Firefox de escritorio sobre el HTTPS de Tailscale, con audio simulado, error de permiso y reintento. No se ha probado un Android físico.
- Voz es el botón de grabación mantenida de la barra de captura. No hay menú previo ni modo de grabación con un toque. Reutiliza los modelos preparados y conserva la revisión antes de guardar.
- Rueda de eventos con scroll/snap, opciones visibles, teclado y selección directa. Sin combo oculto.
- Reloj mm:ss y tres exclusiones de 66 px de alto integradas en la cabecera. Dorsal opcional, compatible con copias anteriores.
- Corregida la navegación por equipos y partidos en idiomas distintos del español: las rutas permanecen estables.

### Latencia de Needle

Medición reproducible en WebAssembly: esquema original de 1.996 caracteres y sistema de 381 frente a herramientas específicas de 342–454 caracteres y hechos de 89. Dos frases de gol/parada pasaron de 34,2–34,6 s a 6,0–7,7 s; dos llamadas completas por fases fueron más lentas que una extracción compacta. Los datos originales y los errores de extracción se conservan en `docs/benchmarks/needle/`.

Se aplica una fase local conservadora de ruta, normalización de dorsales y perspectiva literal antes de una sola inferencia reducida. Las respuestas conservan sus advertencias y la revisión humana; la transcripción literal se conserva. Se muestran los tiempos de Whistle y Needle en el editor. La mejora medida no certifica precisión ni rendimiento en un Android físico.

Validación final del flujo directo y de la optimización: 31 pruebas de código y 8 recorridos de navegador superados. Los recorridos con modelos reales comprueban preparación previa, permiso explícito, pulsación mantenida con teclado y puntero, edición manual concurrente, revisión y guardado, recarga offline sin peticiones adicionales de modelos y liberación de pistas. Se comprobaron las capturas de móvil/escritorio.

La revisión visual posterior corrigió el centrado inicial de la rueda cuando el editor abre una propuesta ya rellenada: se posiciona después de `showModal`. Los cuatro recorridos manual/voz de móvil y escritorio se repitieron y pasaron con una comprobación explícita del centrado.


## Descargas, copias e informes de partido

- Selector único de Needle (4/8/12/20 capas), 12 por defecto, persistente entre pantallas y recargas. Archivo y hash de la variante elegida alcanzan el worker. Whistle mantiene su configuración. Los modelos reducidos se generan sin entrenamiento y se incluyen como archivos estáticos en `dist/models/`; no se descargan todos al abrir la página.
- La copia completa exporta un ZIP estándar con `handball-stats.json`: equipos, jugadores, partidos, eventos, texto original y exclusiones. Restaurar admite ese ZIP o el JSON anterior, mantiene el resumen y confirmación y valida referencias antes de reemplazar los datos. Se comprueba el límite de 20 MB tanto para el archivo como para el JSON descomprimido. Se rechazan ZIPs ambiguos con varias copias JSON.
- Informe PDF en partidos en curso y finalizados: totales de ambos equipos, jugadores con estadísticas, tanteo acumulado por periodo y registro de eventos ascendente. Tablas paginadas, fuentes con los caracteres de los siete idiomas y colores amarillo/negro. La interfaz conserva el orden descendente de su registro.
- La generación del PDF se ejecuta en un worker, se invalida al cambiar los datos y prepara un archivo para compartir con un gesto del usuario. Sin soporte de Web Share para archivos, se descarga. Las fuentes se conservan en la precarga de la aplicación para generar informes sin conexión.
- Los recorridos de navegador sirven `dist/` con un servidor estático temporal, que se cierra al terminar. Los servidores Vite de desarrollo y vista previa siguen parados.

Validación de esta ampliación: 42 pruebas de código superadas; recorridos de móvil y escritorio con los cuatro modelos reales, una sola descarga de Whistle, persistencia y recarga sin conexión, restauración ZIP/JSON con confirmación, y compartir/descargar PDF de partido en curso y finalizado sin conexión. Se renderizaron e inspeccionaron el informe normal y uno con 120 eventos y nombres largos para comprobar paginación, orden y ausencia de solapamientos.


## Sustitución de Needle por reglas — 17 de octubre de 2026

Este apartado describe la versión anterior; el modo híbrido documentado al final recupera Needle para extraer datos.

La captura actual utiliza únicamente Whistle. Se retiran la selección de capas, la carga de Needle, su requisito de caché y la preparación automática de variantes al compilar. Los modelos generados dejan de publicarse en `dist/models/`. Los apartados anteriores sobre Needle documentan versiones históricas y ya no describen la captura activa.

Se añaden léxicos por idioma para los 11 eventos, coincidencia literal y aproximación acotada cuando falla la literal, perspectiva de quien graba, números 0–99, roles de participantes y reglas por metadato. Whistle recibe vocabulario de balonmano, nombres de equipo/jugadores y únicamente los dorsales conocidos del partido, en cifras y palabras. La interfaz muestra indicador durante reconocimiento y duración separada de Whistle y reglas. Todas las propuestas se revisan antes de guardar.

La evaluación del corpus español de esta etapa se retiró posteriormente junto con sus datos. Las pruebas específicas cubren los siete idiomas; la evaluación acústica y la validación en móviles físicos siguen pendientes. No se ha entrenado ningún modelo.

## Sustituciones (17 de octubre de 2026)

Se añade el duodécimo evento, Sustitución, tanto manual como por voz. «Cambio» es una palabra clave española, junto con «sustitución»; los siete idiomas tienen vocabulario de cambio y roles de entrada/salida, también incluido en las pistas de Whistle. El participante principal sale y el relacionado entra, siempre del mismo equipo. Se guardan ambos, se muestran en registro y PDF y se conservan al restaurar ZIP/JSON. Las estadísticas cuentan cambios por equipo y entradas/salidas por jugador; no calculan tiempo en pista. El mismo jugador conocido no puede salir y entrar en el mismo cambio: queda pendiente. Se añaden 45 transcripciones sintéticas (15 familias) al dataset, que pasa a 645 muestras y 12 tipos.

## Refactorización de legibilidad (17 de octubre de 2026)

Se aplica formato automático al código, se añaden comprobaciones de formato y detección de importaciones/parámetros sin uso, y se separan las pantallas de App.tsx. El intérprete queda organizado por fases en voice/analysis; vocabularios, pistas de Whistle y formas numéricas están agrupados por idioma. Los auxiliares históricos de Needle quedan en voice/legacy. La referencia de regresión y el comparador del corpus de esta etapa se retiraron posteriormente. La guía docs/lectura-del-codigo.md explica el recorrido y la edición de reglas.

## Ruedas de selección e información adicional (17 de octubre de 2026)

Equipo, tiempo, jugadores y subtipo de infracción del editor utilizan ruedas, igual que el catálogo de equipos al crear un partido. El mismo control se aplica a equipos de exclusiones, filtros estadísticos e idiomas. Las ruedas admiten desplazamiento con ajuste al centro, selección directa y teclado; los estados no aplicables se deshabilitan explícitamente. Se conserva la entrada rápida de dorsal para jugadores nuevos. Cambiar de equipo limpia los participantes para evitar atribuciones cruzadas.

Guardar y Cancelar permanecen visibles mientras se desplazan los campos del editor. «Información adicional» agrupa la nota editable y el texto identificado como «Transcripción original». Se conserva `rawText` sin modificar al corregir jugadores, equipo, tipo o nota, también al volver a abrir un evento.

El aviso de fin de exclusión está activado por defecto. El primer toque o pulsación en la pantalla del partido habilita el audio del navegador. Al llegar a cero suena una adaptación monofónica de los tres primeros compases del tema de jota de «El sitio de Zaragoza», de Cristóbal Oudrid: once notas durante cinco segundos, sintetizadas con Web Audio sin archivos ni descargas. La referencia es el tema A de la página 4 de esta [partitura](https://www.el-atril.com/partituras/varios/El%20sitio%20de%20Zaragoza.pdf). Los contadores que terminan a la vez comparten el aviso para evitar superposiciones. Silenciar corta también las notas aún no iniciadas. Se liberan las notas y el contexto al abandonar la vista. Las limitaciones de pestañas suspendidas o pantalla bloqueada siguen siendo las del navegador.

El registro distingue visualmente la perspectiva: equipo 1 a la izquierda, amarillo y número 1; equipo 2 a la derecha, negro y número 2. En el rival se reflejan el icono, el título y las acciones. El nombre del equipo aparece destacado. Los eventos sin equipo quedan centrados y no se presentan como propios.

Validación de este bloque: 721 pruebas de código y 23 recorridos únicos de navegador en Chromium móvil/escritorio superados; se omite intencionadamente la repetición móvil del PDF largo. Se comprueban selección por teclado y desplazamiento, limpieza de participantes al cambiar de equipo, guardado visible, conservación de nota y transcripción tras recargar, posición real de iconos/títulos y programación de las cuatro notas durante cinco segundos en Web Audio. Revisadas visualmente las capturas de móvil y escritorio. Compilación de producción actualizada en `dist/`.

## Modo híbrido y selección de capas — 17 de octubre de 2026

Las reglas eligen únicamente el evento. Needle recibe el texto original y un esquema fijo por evento, sin normalización previa de dorsales ni asignación posterior del equipo mediante reglas. Para gol, los seis campos son equipo, dorsal, nombre, dorsal_asistente, nombre_asistente y penalti. El resto de eventos expone solo sus campos pertinentes. Se mantiene la revisión antes de guardar y la transcripción original.

Se recupera el selector de 4/8/12/20 capas con 12 inicialmente y restauración de la preferencia existente. Se añade un equipo por defecto configurable, inicialmente nuestro equipo, aplicado cuando falta un equipo válido en la respuesta y advertido en revisión. Whistle mantiene pesos y configuración. Se exige caché real de ambos modelos; cambiar capas invalida preparación. La compilación vuelve a preparar/verificar los tres archivos pequeños y publicarlos en `dist/models/`.

Los tiempos de Whistle, selección por reglas y Needle aparecen separados. Las llamadas de Needle tienen 192 tokens y límite de 45 segundos; un fallo conserva el evento detectado y el equipo por defecto para completar manualmente. Las respuestas del modelo siguen requiriendo evaluación: el ensayo de cuatro textos sintéticos con 12 capas produjo tiempos de 2,7–7,1 segundos y errores de equipo, dorsal y asistencia, con baja confianza. No se presenta como mejora demostrada de precisión. No hay entrenamiento ni validación en dispositivos físicos.

## Notas y transcripción en el PDF — 17 de octubre de 2026

La tabla cronológica de eventos incorpora `Nota` y `Transcripción original`, con las traducciones existentes, bajo los participantes de cada evento. Los campos vacíos no añaden líneas. Se conservan los saltos de línea del texto y se ajustan las líneas a la celda, manteniendo las cuatro columnas compactas. La exportación común cubre partidos en curso y finalizados, con descarga y compartir también sin conexión.

Validación conjunta: 749 pruebas de código, 15 recorridos únicos de navegador aprobados en Chromium móvil/escritorio y una repetición móvil del PDF largo omitida intencionadamente. Los cinco PDF generados suman 14 páginas; se verifica la presencia completa de notas y transcripciones, incluidos 80 párrafos de una nota y 120 repeticiones en una transcripción que cruza páginas. Se renderizan y revisan visualmente las dos páginas del ejemplo normal y las seis del caso largo. Compilación y formato correctos; `dist/` actualizado. Las pruebas de integración no certifican precisión de reconocimiento de voz.

## Comandos ordenados deterministas — 19 de octubre de 2026

La captura activa vuelve a usar únicamente Whistle y reglas, ahora con un protocolo explícito: evento al principio, equipo, jugador principal, relacionado y metadatos. `src/voice/commands/` separa vocabulario por idioma, selección del evento, participantes y distancia Levenshtein. Los módulos de los enfoques anteriores se conservan como referencia, pero no procesan la captura. No se cambian los pesos, revisión ni parámetros de Whistle, ni se entrena ningún modelo.

La primera referencia de equipo prevalece y la ausencia aplica equipo 1 desde la perspectiva de quien graba. Los participantes se asignan por aparición, mezclando nombres conocidos y dorsales conocidos/desconocidos sin promover menciones posteriores. No se contemplan huecos y se descartan participantes adicionales según el evento. Los dorsales admiten 0–99 en cifras y palabras; minutos, metros y cifras de tiempo no se convierten en jugadores. La aproximación de nombres exige al menos cuatro letras: una edición para cuatro, dos para cinco a siete y tres para más de siete. Los nombres más cortos se reconocen literalmente; los empates entre jugadores quedan sin resolver.

La regla de tarjetas identifica amarilla, roja como descalificación y azul como descalificación con azul. La decisión inicial de dejar pendiente una tarjeta sin color se sustituyó después por amarilla por defecto, según la indicación del usuario. Las raíces y expresiones del evento tienen vocabulario para los siete idiomas. Whistle recibe palabras completas de balonmano, colores, equipos, nombres y dorsales de la plantilla. El SDK instalado no ofrece listas de palabras alternativas; no se inventan candidatos ni se cambia su configuración para obtenerlos.

La preparación deja de exigir o cargar Needle, y se retiran sus controles de capas/equipo por defecto; sus preferencias antiguas se ignoran. Se conserva la elección de idioma, la verificación real del archivo Whistle en caché, la carga previa al partido y el uso offline. Los scripts y artefactos históricos de Needle permanecen para los experimentos anteriores. El editor mantiene la revisión antes de guardar y muestra Whistle en segundos y reglas en milisegundos, con la transcripción original intacta.

Se comprobó la incompatibilidad del nuevo protocolo con el corpus histórico de narración libre. Ese corpus, sus resultados y las herramientas asociadas se retiraron después por petición del usuario; no constituyen una evaluación vigente del formato nuevo.

Validación: 762 pruebas de código y 12 recorridos de Chromium móvil/escritorio aprobados, incluidos doce eventos, colores y números 0–99 escritos y hablados en siete idiomas, orden de participantes, aproximaciones y empates. Compilación de producción regenerada. Los recorridos de navegador verifican preparación solo de Whistle, idioma, descarga única, recarga offline, push to talk, revisión/corrección, permisos, copias ZIP, partido y exclusiones; sus capturas se inspeccionan. En el audio sintético real, Whistle transcribió «Gol» como «Por»: se conservó el texto y el evento quedó pendiente, permitiendo corregirlo. Esa evidencia no demuestra precisión acústica; sigue pendiente probar grabaciones humanas con ruido y dispositivos físicos.

## Retirada del corpus anterior — 19 de octubre de 2026

Se eliminan las frases libres y sus particiones, semillas, ZIP, anotaciones, resultados congelados y métricas derivadas. Se retiran sus generadores, evaluadores, comparador y prueba de regresión dependiente del corpus. Las pruebas del protocolo actual y los casos unitarios independientes se conservan. Las cifras de validación de los apartados históricos describen lo ejecutado en su fecha, antes de esta retirada.

Validación de la retirada: 116 pruebas restantes aprobadas, formato correcto y sin referencias a rutas o comandos retirados. La reducción del recuento corresponde a las 646 comprobaciones que dependían del corpus eliminado.

## Tarjeta amarilla por defecto — 19 de octubre de 2026

«Tarjeta» propone amarilla si no se reconoce literalmente un color completo. Roja propone descalificación y azul descalificación con azul; no se aproximan colores ni se aceptan raíces incompletas. Se mantienen las formas gramaticales explícitas por idioma y prevalece el primer color literal, también para el metadato azul. Se retira el aviso de tarjeta sin color pendiente.

Validación: 116 pruebas aprobadas, con tarjeta sin color en siete idiomas, colores literales, errores de transcripción, formas gramaticales y colores en conflicto; el adaptador al editor recibe amarilla y conserva equipo/dorsal. Compilación de producción regenerada en `dist/`.
