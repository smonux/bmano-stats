# Entrega UI/HMI para el harness

## Archivos
- `informe-ui-hmi-bmano-stats.md`: informe original, conservado sin cambios. Sus observaciones corresponden al código auditado y fecha indicados; comprobar vigencia antes de implementar.
- `bocetos-partido.html` y `bocetos-partido-v2.html`: ejemplos originales sin cambios; son fragmentos HTML con estilos y JavaScript.
- `bocetos-partido-v3.html`: documento HTML autónomo con iconos de jugada, dorsal grande y nombre debajo. Abrir directamente en navegador.
- `icons/event-*.svg`: 13 iconos vectoriales independientes con currentColor, viewBox 32 × 32; usar inline para heredar color CSS. Acompañar siempre con etiqueta.
- `index.html`: índice de las pantallas y catálogo visual de iconos.
- El icono de aplicación elegido está en la raíz del proyecto: `handball-stats-icon.svg`.

## Decisión más reciente del usuario: selector de jugador
Esta decisión prevalece sobre alternativas anteriores del informe: escoger por **dorsal grande**, con **nombre pequeño debajo** en el mismo botón. En el ejemplo: dorsal 30 px, nombre 13 px, botón mínimo 84 px, cuatro columnas. El nombre ocupa una línea y se trunca con elipsis según espacio disponible, sin cortar el dato almacenado ni imponer un número fijo de caracteres. El nombre completo se conserva en aria-label, title y resumen del evento. Title es ayuda de escritorio, no mecanismo obligatorio de lectura en móvil: el resumen permite leer el nombre completo tras seleccionar.

- Cambiar de equipo cambia los nombres mostrados y limpia la selección.
- Dorsal conocido sin nombre: «Sin nombre»; sin dorsal: «Sin identificar».
- Mantener «Otro dorsal» y permitir registrar sin preparar una plantilla.
- No reducir el nombre por debajo de 13 px para hacer caber más caracteres.
- Verificar a 320/390/430 px, zoom de texto, selección por teclado y nombres largos; si no caben, reducir columnas antes de reducir tipografía.

## Límites de los ejemplos
Datos ficticios; no están conectados a la base de datos. Los relojes son ilustrativos y la vista v3 hereda las simplificaciones de v2. No se ha implementado aquí la gestión completa de varias exclusiones. Los iconos y pantallas son material de diseño: su presencia no implica añadir tipos de evento al modelo de dominio. No se han cambiado el código ni los recursos activos de la aplicación.
