# Mejoras 1

Cambios solicitados en el HTML y las tres capturas de `Mejoras 1.zip`, aplicados en bloques y commits independientes sobre `main`. Se mantiene el reconocimiento Whistle, el protocolo determinista y la perspectiva del equipo que graba.

## 1. Preparación inicial de voz

Nuevo partido muestra el formulario completo solo hasta completar la preparación. Las siguientes visitas restauran la sesión desde archivos locales verificados, sin descargar ni solicitar micrófono. Ajustes conserva el formulario. Un archivo ausente o una carga fallida muestra un estado compacto con acceso a Ajustes y sigue impidiendo iniciar sin voz preparada. La marca de configuración no sustituye comprobar la caché.

Validación: ocho pruebas de preparación; recorridos de móvil/escritorio de preparación, reutilización offline, ocultación en Nuevo partido, creación de partido y copias ZIP/JSON.
