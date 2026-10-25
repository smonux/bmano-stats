# Entrega 5 · Voz, pestañas y formularios

Chromium móvil emulado (390 × 664) y escritorio. `tests/hmi-accessibility.spec.ts`, `tests/editor-viewport.spec.ts`, `tests/voice.spec.ts`, `tests/wheels.spec.ts` y `tests/hmi-feed-safety.spec.ts`: 46 correctos. `tests/review/voice-review.spec.ts`: 16 correctos.

- `team-keyboard.png`, `player-keyboard.png`, `counter-keyboard.png`: viewport visual reducido a 220 px para simular el espacio disponible con teclado. Se comprueban acciones completas y campo/selección enfocados visibles. No representan un teclado físico dibujado en pantalla.
- `tabs-keyboard.png`: selección por teclado y panel asociado.
- `revision-voz.png`: interpretación primero; transcripción abierta explícitamente por teclado para comprobar su lectura. La prueba verifica que empieza cerrada y que Enter sobre el resumen no guarda.

Capturas revisadas: controles y selección del contador visibles en el viewport corto, revisión con etiquetas y acciones completas. La captura real de Whistle usa audio de prueba, pulsación de ratón y Espacio, caché local/offline, pistas detenidas y permiso denegado. No sustituye ruido de pista, lectores de pantalla ni teclados de Android/iOS físicos.
