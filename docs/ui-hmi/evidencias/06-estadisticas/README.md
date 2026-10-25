# Entrega 6 · Estadísticas

`hmi-statistics.spec.ts` y `hmi-short-viewport.spec.ts`: seis recorridos correctos en Chromium móvil/escritorio. `report.spec.ts`: cinco correctos; el PDF largo solo se ejecuta en escritorio.

Se conserva el equipo 1 inicial aunque el catálogo esté en otro orden, así como la elección explícita durante cambios del reloj. En el partido ambos equipos se eligen directamente; el catálogo global conserva sus ruedas.

La eficacia usa los mismos `goals/shots` del cálculo existente, ahora visibles junto al porcentaje. Sin muestra se conserva «—» y se explica el motivo. Cada gráfico tiene tabla nativa plegada: totales al inicio del tiempo y cada gol en su minuto, con equipo y total acumulado. Se comprueban cinco goles repartidos en dos tiempos y arranque del segundo con 2–1.

`equipos-320.png` y `tabla-movil.png`: nombres largos y ancho de 320 px, sin overflow. La tabla conserva nombres completos; puede ocupar varias líneas. Es desplazable dentro del documento, sin otra superficie fija. Capturas revisadas. No son pruebas de lector de pantalla ni teléfono físico.
