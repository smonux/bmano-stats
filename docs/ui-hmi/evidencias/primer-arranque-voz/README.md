# Entrenamiento en el primer arranque

Estas capturas documentan la sustitución de la bienvenida. El ejemplo con #15 que aparece en ellas se sustituyó después por Elena #9; consulta las [capturas actuales](../entrenamiento-nombres/README.md). El comportamiento de primer arranque se conserva.

La introducción de voz sustituye a la galería general. El selector de idioma aparece en el primer arranque; Salir permite entrar directamente en la aplicación. No se solicita micrófono al leer o salir. Se puede recuperar la práctica desde Ajustes y el menú.

- [Primer arranque en español a 320 × 664](primer-arranque-320.png): captura de página completa; cuatro piezas, ejemplo, frase mínima, idioma y acciones sin recorte horizontal.
- [Cambio a inglés en escritorio](primer-arranque-en.png): instrucciones y selector actualizados. El recorrido posterior comprueba también nombres ficticios traducidos en el editor.

32 casos de Chromium móvil emulado/escritorio correctos en `voice-onboarding`, `features`, `hmi-home` y `voice-practice`; 159 unitarias correctas, formato y compilación correctos. Los seis casos de primer arranque se repiten para comprobar las aserciones de ausencia de micrófono antes de cada recarga, sin perder el contador al recargar. Incluye salida por teclado, persistencia de visto/completado, recarga antes de actuar, respeto de la bienvenida antigua cerrada, vuelta a Nuevo partido y cuatro retos completados manualmente sin preparación de voz.

La regresión existente usa cuatro WAV sintéticos con Whistle real y conserva sus errores; no mide precisión humana ni ruido de pista. Navegadores y dispositivos físicos no comprobados en este bloque. La captura móvil muestra toda la página, no solo la región visible de 664 px.
