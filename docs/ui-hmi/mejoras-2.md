# Mejoras 2 · implementación

Samuel aprueba el 26 de octubre de 2026 las propuestas basadas en `Mejoras 2.zip`. Precisión confirmada: Exclusión → **2 min**, Tarjeta amarilla → **Amarilla**. Solo `cambios-hmi`, sin merge ni publicación. El ZIP aportado queda sin añadir a Git.

| Bloque | Alcance | Estado |
| --- | --- | --- |
| 1 | Fecha compacta, nombres desde marcador, quitar ayudas redundantes, borrar partido directo con confirmación | Completado · `mejoras2-01-pantalla` |
| 2 | Cuatro contadores, pausa común, disposición compacta y compatibilidad de datos/copias | Completado · `mejoras2-02-contadores` |
| 3 | Equipo 1 inicial en manual, matriz completa de 3 columnas, etiquetas cortas y nota abierta | Completado · `mejoras2-03-editor` |

## Bloque 1

La fecha es la cabecera, con Volver/estado en la misma franja. Cada nombre del marcador abre un diálogo con los nombres completos y restaura foco al cerrar. Desaparecen las dos filas de ayuda señaladas; la guía conserva la explicación de independencia. Eliminar partido se ofrece directamente, con confirmación contextual y Cancelar inicial. Una propuesta de voz espera mientras se consultan los nombres completos.

Validación: 47 recorridos correctos en Chromium móvil/escritorio y una omisión prevista (PDF largo solo en escritorio), 146 unitarias, formato/TypeScript/build correctos. Incluye foco, nombres largos, borrado/cancelación del objetivo correcto, pendientes, texto ampliado y PDF activo/finalizado/offline. [Captura móvil](evidencias/mejoras2/01-pantalla/movil.png) y [escritorio](evidencias/mejoras2/01-pantalla/escritorio.png), revisadas. Sin pruebas físicas.

## Bloque 2

Cuatro huecos, controlados por la pausa/reanudación del reloj general. Cada tarjeta conserva equipo/dorsal opcional, tiempo de una línea, X con confirmación y aviso al vencer; desaparecen botones de pausa individuales y etiquetas de marcha redundantes. Nuevo tiempo, +2 min y sonido comparten una barra. Se conserva la independencia entre evento y contador y el din-don de cinco segundos. La rejilla se adapta a texto ampliado sin partir los dígitos.

IndexedDB pasa a esquema 2 y convierte una vez los tres huecos antiguos, respetando colecciones, reloj y tiempo restante de los contadores (incluidos los que se habían pausado individualmente). Las copias nuevas son formato 2. El importador acepta ZIP/JSON de formato 1 y adapta sus tres huecos después de validar sus referencias; las aplicaciones antiguas no pueden restaurar las nuevas copias de formato 2. No cambia el esquema de los eventos ni su cómputo.

Validación: 150 unitarias en 30 archivos; formato, TypeScript y build correctos. La primera pasada de navegador tuvo 27 casos correctos y detectó expectativas antiguas y una espera de commit ausente en la nueva prueba del reloj. Corregidas las esperas observables y expectativas para cuatro huecos, los ocho recorridos finales pasan: 320/390 móvil/escritorio, importación antigua, exportación ZIP nueva, pausa común, recarga, X independiente y programación del sonido. Las pruebas de contadores existentes, oferta tras exclusión y copias pasaron en la primera tanda. [320 px](evidencias/mejoras2/02-contadores/320.png) y [390 px](evidencias/mejoras2/02-contadores/390.png), revisadas; todos los tiempos completos y fuera de la barra de captura al usar su acceso desde el reloj.

## Bloque 3

Los eventos manuales nuevos proponen Equipo 1, pero ninguna jugada: Guardar sin elegir conserva un pendiente y no suma goles. Las ediciones mantienen su atribución original, incluido un equipo aún sin identificar; las propuestas de voz mantienen su propio borrador. Las 13 acciones están en una única matriz de tres columnas, con iconos encima y texto menor. «2 min» y «Amarilla» respetan la precisión de Samuel. El resto de abreviaturas queda limitado al selector; el registro, el PDF y la interpretación conservan los tipos y nombres completos. Cada botón también describe el nombre completo para tecnologías de asistencia.

La nota está siempre desplegada, sin enfocar el campo al abrir. La transcripción original tiene su propio desplegable, cerrado inicialmente y ausente si no hay texto. Guardar/Cancelar siguen en el pie; el contenido se desplaza. A 320 × 568 no cabe la matriz completa a la vez: se recorre dentro del editor. Con texto al 200 % se reducen columnas para mantener legibilidad y acceso a las acciones.

Validación final: 151 unitarias en 31 archivos, formato, TypeScript y build correctos. Escritorio completo: 90/90. Móvil: 87 correctos y una omisión prevista en la tanda completa; una comprobación del bloque 1 buscaba un contenedor que el bloque 2 había eliminado. Se corrige para exigir su ausencia. Los 12 recorridos finales sobre el `dist` regenerado pasan en móvil/escritorio e incluyen esa corrección, un caso nuevo de pendiente sin equipo, etiquetas, tres columnas, objetivos táctiles de al menos 44 px, recarga y pie con viewport reducido. Quedan cubiertos los 179 casos funcionales distintos (89 móvil, 90 escritorio); el PDF largo se ejecuta solo en escritorio. Otros 22 recorridos de carga y revisión de voz pasan. Incluye Whistle real/offline, exportación PDF y copias ZIP/JSON; no equivale a una evaluación de precisión ASR en pista.

[Capturas revisadas y límites](evidencias/mejoras2/03-editor/README.md). Tres bloques con commits y etiquetas independientes, sin merge/push/despliegue de esta ampliación. `main` conserva `138fbf17e85668c890b36ecbe250fc91297d7650`; el ZIP original queda sin añadir. `dist` contiene la aplicación verificada.
