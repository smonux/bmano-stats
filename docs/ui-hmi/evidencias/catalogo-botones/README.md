# Equipo y Jugador sin partir palabras

El encogimiento del botón en la fila del título, junto con `overflow-wrap: anywhere`, permitía dividir sus palabras. El encabezado del catálogo ahora admite reflujo; el botón conserva el ancho necesario para su icono y texto en una línea. Si falta espacio, pasa completo a otra fila. Los títulos largos siguen completos y pueden ajustar sus líneas. El estilo se aplica solo al catálogo de equipos y la plantilla.

Comparación con la misma pantalla de 390 × 664 y el mismo nombre de equipo de prueba:

| Acción | Antes | Después |
| --- | --- | --- |
| Equipo | [Dos líneas](equipo-antes.png) | [Una línea](equipo-despues.png) |
| Jugador | [Siete líneas, una letra por línea](jugador-antes.png) | [Una línea](jugador-despues.png) |

Medidas obtenidas con `Range.getClientRects()` sobre el texto real del botón: Equipo 2 → 1 líneas; Jugador 7 → 1 líneas. Sin abreviar etiquetas, recortar nombres ni reducir la letra. Revisadas visualmente las cuatro capturas.

Pruebas de Equipo y Jugador a 320/390/430 px y escritorio, texto al 100/200 %, español/polaco/alemán y nombres largos. Se comprueban una línea de texto dentro del botón, objetivo táctil mínimo de 44 px, ausencia de overflow horizontal, apertura con Enter y cancelación/foco del formulario. También se conserva el recorrido de alta/edición de dorsal cero y selección en un evento, así como las preferencias de Nuevo partido. Sin cambios de repositorio, datos ni formularios.
