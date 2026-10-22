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
