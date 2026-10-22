# Mejoras 1

Cambios solicitados en el HTML y las tres capturas de `Mejoras 1.zip`, aplicados en bloques y commits independientes sobre `main`. Se mantiene el reconocimiento Whistle, el protocolo determinista y la perspectiva del equipo que graba.

## 1. Preparación inicial de voz

Nuevo partido muestra el formulario completo solo hasta completar la preparación. Las siguientes visitas restauran la sesión desde archivos locales verificados, sin descargar ni solicitar micrófono. Ajustes conserva el formulario. Un archivo ausente o una carga fallida muestra un estado compacto con acceso a Ajustes y sigue impidiendo iniciar sin voz preparada. La marca de configuración no sustituye comprobar la caché.

Validación: ocho pruebas de preparación; recorridos de móvil/escritorio de preparación, reutilización offline, ocultación en Nuevo partido, creación de partido y copias ZIP/JSON.

## 2. Textos de reconocimiento

El botón se llama «Cargar reconocimiento de voz». Estados y errores de preparación usan el mismo concepto, con traducción en los siete idiomas. Los modelos y parámetros de Whistle no cambian.

## 3. Último equipo nuestro

Nuevo partido preselecciona el equipo 1 del último partido creado que siga disponible. No usa la fecha editable ni equipos o partidos archivados. La elección es un valor inicial: no sobrescribe cambios del usuario ni elige rival. Se obtiene de los partidos persistidos, sin una preferencia adicional que pueda quedar obsoleta.

Validación: orden de creación frente a fecha y exclusión de datos archivados; recorrido de importación, selección y recarga en móvil/escritorio.

## 4. Botón de pulsación mantenida

El texto visible y el nombre accesible dicen «Voz (mantener)», «Push to talk» y sus equivalentes en los otros cinco idiomas. No cambia la grabación directa con puntero, Espacio o Intro ni añade un menú previo.

## 5. Confirmación compacta

Tras transcribir se muestra una propuesta compacta: texto original, evento, equipo (con valor por defecto identificado), participantes y funciones, metadatos pertinentes, tiempo y minuto capturados. Continuar es el control inicial de teclado y guarda una vez a los cinco segundos si no se interactúa. Puntero, teclado, desplazamiento u ocultar la pestaña detienen la cuenta; no se reinicia sola. Editar conserva el borrador. X, Escape y Descartar no guardan. Un error de persistencia mantiene la propuesta abierta con su explicación.

El resumen reutiliza `eventIssues` sin crear jugadores ni escribir datos. Una propuesta incompleta se identifica y se guarda pendiente, sin cómputo. La cuenta no empieza hasta que termina una edición manual concurrente. Se conserva el push to talk directo y se devuelve el foco al botón de voz al cerrar.

Validación con pruebas de temporizador y de adaptación al dominio; diez recorridos de componente con IndexedDB real y reloj controlado en móvil/escritorio, separados de la precisión de ASR. El fixture de pruebas vive fuera de la distribución de la aplicación. También se comprueba el recorrido de audio con Whistle real.
