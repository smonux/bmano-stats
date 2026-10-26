# Historial: equipo explícito e icono destacado

Referencia local de Samuel: `docs/ui-hmi/eventos-icono-destacado.html`. Se reproduce la jerarquía aprobada con los iconos reales de `EventIcon`, sin importar su simulación ni los datos ficticios a producción. No se recuperan Más/Deshacer, y Editar conserva el editor y selector actuales.

- [Equipo 1 claro, 390 px](equipo-1-claro-390.png) y [Equipo 2 claro, 390 px](equipo-2-claro-390.png): cabecera en cada tarjeta, nombre completo/Equipo 1–2, colores de equipo, fondo sutil y alineado uniforme. Acción/jugador 16 px, periodo/minuto 14 px a la derecha; dibujo 34 px en bloque 52 × 52. Los participantes relacionados conocidos y metadatos conservan su información.
- [Equipo 1 oscuro](equipo-1-oscuro-390.png) y [Equipo 2 oscuro](equipo-2-oscuro-390.png): las tarjetas se adaptan al esquema de color del sistema; se mantienen sus identidades y contraste. No se añade selector global de tema ni se modifican otras pantallas.
- [430 px](equipo-2-claro-430.png) y [320 px con texto al 200 % y nombre largo](texto-200-320.png): reflujo vertical, nombres sin elipsis y sin desbordamiento horizontal. En el caso extremo la tarjeta requiere desplazamiento vertical para recorrerla.
- [Equipo pendiente](equipo-pendiente.png), [evento pendiente con equipo conocido](evento-pendiente.png) y [nota del partido](nota.png): se evita inventar una atribución. Los motivos proceden de `eventIssues`. No hay Registrado repetido; la falta de jugador aparece en su línea como Sin identificar.
- [Alto contraste](alto-contraste.png): identidad por nombre y etiqueta, independiente del color; papelera directa y foco visible.

Capturas revisadas de tarjetas aisladas. Para exportarlas sin superposición, la prueba aumenta solo la altura del viewport y oculta temporalmente la cabecera fija del partido/barra de captura durante la imagen; las comprobaciones de geometría, navegación, contraste y desbordamiento se realizan en los tamaños móviles normales. Los controles reales no se ocultan ni cambian en producción.

147 unitarias y 114 recorridos distintos de navegador correctos. Texto de cabecera/cuerpo/reloj con contraste medido ≥4.5:1 e iconos ≥3:1 en claro/oscuro; siete idiomas, todos los tipos, datos sin identificar, cinco clases de pendiente, nota/transcripción, Sale/Entra, metadatos, 0/nombre opcional, controles de 48 px, cancelación/foco y persistencia sin cambios. La regresión incluye voz real/offline, estadísticas, PDF y ZIP. El boceto y el ZIP originales permanecen sin modificar y sin añadir a Git.

Límites: Chromium móvil emulado y escritorio; no dispositivos físicos, Safari/WebKit ni lector de pantalla real. El audio de voz es sintético y no mide precisión con ruido de pista. Dominio, persistencia, modelos/reglas de voz y generación de estadísticas/PDF no se modifican. La verificación de diferencias confirma que el editor y los controles de dorsal siguen intactos.
