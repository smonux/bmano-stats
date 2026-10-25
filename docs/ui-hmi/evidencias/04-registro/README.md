# Entrega 4: registro y edición protegida

Las capturas comparables usan los mismos datos y perfiles aislados que [la entrega 3](../03-contadores/README.md), contra el `dist` servido por Tailscale. No se alteró el almacenamiento del usuario.

- Registro con nombres largos: [antes](../03-contadores/390x664-long-scroll.png), [después](390x664-long-scroll.png). Los pendientes indican motivos y ofrecen Completar. Editar/Completar y Más ocupan una franja común a ambos equipos; el contenido conserva su lado.
- [Lectura de nota y transcripción](leer-detalles.png). El desplegable empieza cerrado; se conserva durante actualizaciones del reloj, sin abrir el editor ni modificar datos. También se comprueban pendientes, rival, textos vacíos, saltos de línea y palabras largas.
- Último pendiente corregido: [recorrido 1](ultimo-pendiente-1.png), [recorrido 2](ultimo-pendiente-2.png). Las pruebas cubren teclado y toque, recuento cero, estado vacío, marcador y foco en un filtro existente, fuera de la cabecera.
- [Confirmación de evento](confirmar-evento.png), [nombres completos largos](confirmar-nombres-largos.png). Se identifica el tipo, equipo, participante, periodo y minuto, sin incorporar nota/transcripción larga a la confirmación. El partido se identifica por equipos y fecha.
- Las demás capturas cubren 320 × 568, altura corta y escritorio. [Medidas](measurements.json): la cabecera y la barra sin acuse conservan el presupuesto anterior. El acuse de una operación guardada añade su propia fila, que se limpia al comenzar otra captura/edición.

Los objetivos destructivos aparecen en Más, con confirmación explícita; en las medidas se registran como `null` al estar cerrados. Las pruebas abren el control y comprueban su tamaño y separación. Antes de la franja común, las acciones diferían 42/44 px entre equipos en móvil/escritorio; ahora sus anclajes relativos difieren como máximo 3 px, por los bordes de la tarjeta. A texto ampliado pueden usar varias filas, sin reducir fuentes.

Cancelar, X y Escape preguntan Continuar editando/Descartar solo después de modificar el borrador. Atrás restaura la entrada del historial antes de preguntar, y permite cancelar reiteradamente. Una dirección hash introducida manualmente también se protege. Guardar elimina la protección; aceptar Descartar no guarda. La recarga usa el aviso nativo de cambios sin guardar, verificado con una recarga real cancelada. El borrador permanece en memoria: no se promete recuperación tras aceptar una recarga, cerrar el proceso o perder el dispositivo.

El foco de modales compartidos se captura antes de autofocus y se restaura después de desmontar los diálogos anidados. Se respeta un destino que el padre ya ha enfocado y se ignoran activadores desmontados o deshabilitados. Comprobados Cancelar/X/Escape, descarte anidado, borrados y completar el último pendiente.

Validación: 135 unitarias; formato, TypeScript y build correctos. La suite general pasó 116 casos, omitió deliberadamente el PDF largo móvil y encontró un desbordamiento al 200 % en escritorio. Se midió el control Más fuera de los 320 px y se corrigió su distribución. Después pasaron 68 recorridos pertinentes, incluida voz real y offline; tras alinear la franja común, pasaron los 44 finales de registro, texto ampliado, foco, confirmaciones y notas. Los 14 de revisión de voz también pasaron. Los recuentos se solapan.

Chromium móvil emulado y escritorio. Quedan para la entrega 5 la revisión de voz y la accesibilidad compartida de pestañas y formularios, incluida la adaptación de sus pies al teclado. No se han probado dispositivos físicos ni tecnologías de asistencia reales.
