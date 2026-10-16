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

- Validación de voz en dispositivos reales y ruido de pista. La integración web Whistle/Needle ya permite descargar modelos, capturar audio, transcribir e interpretar localmente y revisar el evento antes de guardar; consulta `voz.md`.
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
