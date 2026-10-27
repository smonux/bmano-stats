# Evidencia de la práctica guiada

Capturas revisadas; todos los nombres, equipos y audios son de prueba:

- [Introducción a 390 px, tema oscuro](introduccion-390-oscuro.png). Descripciones secundarias con contraste medido ≥ 4,5:1; ejemplo completo y mínimo explícito.
- [Rojo: faltan requisitos](revision-rojo.png). No basta con pulsar grabar o comprobar para avanzar.
- [Amarillo: exclusión válida sin dorsal](exclusion-amarillo.png). Captura con ASR/captura sustituidos expresamente en el test de recorrido; intérprete y evaluación reales.
- [Verde después de completar #8](exclusion-completada.png). Audio sintético con Whistle real y corrección en el editor habitual.
- [Final 4/4 en escritorio](final-escritorio.png). Recorrido con transcripciones controladas: dos retos reconocidos y dos completados con ayuda.

Resultados antes de corregir los cuatro WAV: [Chromium móvil emulado](whistle-movil.json) y [escritorio](whistle-escritorio.json). El texto y los estados son los realmente devueltos. En estas muestras Whistle confundió «Gol» al principio de A/B y no identificó a Elena en C; D mantuvo la exclusión sin dorsal. No se ocultan esos fallos ni se convierten en éxitos automáticos. Los JSON son evidencia de estos recorridos, no un corpus de precisión ni datos de usuarios.

Validación: 161 unitarias correctas, más repetición final de las 14 específicas de práctica después de aclarar las frases inglesa/neerlandesa del beneficiario del penalti. Setenta casos distintos de navegador correctos: 42 de producción (práctica, voz real habitual, editor, ruedas, bienvenida y contadores), 26 de componentes (práctica con dobles explícitos y revisión/guardado habitual) y dos de retorno al partido activo. Cuatro repeticiones finales comprueban la presentación, audio real, offline, salida grabando y ausencia de objetos de práctica en ZIP. Formato, TypeScript y compilación correctos.

La prueba de aislamiento rechaza crear/actualizar/borrar en equipos, jugadores, partidos y eventos durante los cuatro retos; antes/después conserva las cuatro colecciones. Otra comprueba el retorno al mismo partido, el marcador 3–2, los nueve eventos y el reloj avanzando cinco segundos sin cambios persistidos en contadores. El caso con Whistle prepara una sola vez, continúa offline, cierra las pistas de audio al salir grabando y exporta cero equipos/jugadores/partidos/eventos ficticios.

No se ha probado un micrófono físico, lectores de pantalla, ruido de pista ni dispositivos Android/iOS reales. No se modifica Whistle ni el intérprete para acomodar la práctica. Los WAV de Piper solo están en tests y no se incluyen en `dist`.
