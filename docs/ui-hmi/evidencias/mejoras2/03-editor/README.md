# Mejoras 2 · editor

Capturas revisadas de Chromium con emulación móvil. Datos ficticios; no son imágenes de dispositivos físicos.

- [390 × 844, apertura](390.png): Equipo 1 propuesto, ningún evento elegido, iconos encima del texto, tres columnas y pie estable.
- [320 × 568, desplazamiento por acciones](320-acciones.png): «2 min» y «Amarilla»; las etiquetas largas pueden ocupar dos líneas. La matriz se recorre dentro del editor; no se garantiza ver sus 13 opciones simultáneamente.
- [390 × 664, nota y transcripción](nota-transcripcion.png): nota abierta, transcripción abierta explícitamente con Enter, foco visible en el desplegable y equipo pendiente conservado. El texto largo continúa por desplazamiento y no desborda en horizontal.
- [Viewport visual reducido](viewport-reducido.png): Guardar/Cancelar permanecen dentro del viewport simulado. En alturas extremas el espacio de campos es pequeño; no representa un teclado nativo real.

Los 12 recorridos finales de editor/cabecera/viewport pasan en móvil y escritorio. Se comprueban los 13 rótulos, tres columnas a tamaño normal, objetivos táctiles ≥44 px, ausencia de evento implícito, corrección sin atribución inventada, transcripción inicialmente cerrada, teclado, persistencia tras recarga y marcador intacto al guardar pendiente.

La regresión completa también cubre texto al 200 %, siete idiomas, nombres largos, sustituciones, voz real/offline, PDF y ZIP. Las pruebas unitarias verifican migración real de IndexedDB y compatibilidad de las copias antiguas. Los resultados se detallan en [mejoras-2.md](../../../mejoras-2.md).

Límites: sin Safari/WebKit ni Android/iPhone físicos, teclado nativo, lector de pantalla o ruido de pabellón. El audio de prueba de Whistle es sintético; no se deduce precisión de reconocimiento de estos recorridos.
