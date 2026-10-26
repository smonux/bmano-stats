# Mejoras 2 · implementación

Samuel aprueba el 26 de octubre de 2026 las propuestas basadas en `Mejoras 2.zip`. Precisión confirmada: Exclusión → **2 min**, Tarjeta amarilla → **Amarilla**. Solo `cambios-hmi`, sin merge ni publicación. El ZIP aportado queda sin añadir a Git.

| Bloque | Alcance | Estado |
| --- | --- | --- |
| 1 | Fecha compacta, nombres desde marcador, quitar ayudas redundantes, borrar partido directo con confirmación | Completado · `mejoras2-01-pantalla` |
| 2 | Cuatro contadores, pausa común, disposición compacta y compatibilidad de datos/copias | Pendiente |
| 3 | Equipo 1 inicial en manual, matriz completa de 3 columnas, etiquetas cortas y nota abierta | Pendiente |

## Bloque 1

La fecha es la cabecera, con Volver/estado en la misma franja. Cada nombre del marcador abre un diálogo con los nombres completos y restaura foco al cerrar. Desaparecen las dos filas de ayuda señaladas; la guía conserva la explicación de independencia. Eliminar partido se ofrece directamente, con confirmación contextual y Cancelar inicial. Una propuesta de voz espera mientras se consultan los nombres completos.

Validación: 47 recorridos correctos en Chromium móvil/escritorio y una omisión prevista (PDF largo solo en escritorio), 146 unitarias, formato/TypeScript/build correctos. Incluye foco, nombres largos, borrado/cancelación del objetivo correcto, pendientes, texto ampliado y PDF activo/finalizado/offline. [Captura móvil](evidencias/mejoras2/01-pantalla/movil.png) y [escritorio](evidencias/mejoras2/01-pantalla/escritorio.png), revisadas. Sin pruebas físicas.
