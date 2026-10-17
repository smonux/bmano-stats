# Indicaciones posteriores a la refactorización

El usuario ha pedido terminar primero la refactorización integral del código. Después se aplicarán estas indicaciones, en este orden de llegada:

1. **Hecho:** Guardar evento y Cancelar visibles sin desplazarse, también con teclado móvil, paneo y conflicto de guardado. Cuatro recorridos de navegador aprobados en móvil/escritorio, hasta 220 px de área visible. El diálogo sigue `visualViewport` y el error no desplaza las acciones.
2. Reducir la altura de la franja de exclusiones.
3. Mantener orientación vertical y evitar que girar o mover el terminal pierda la edición o una grabación. El bloqueo web puede requerir aplicación instalada o pantalla completa; debe comprobarse el comportamiento compatible y la conservación del estado cuando el navegador no permita bloquear.
4. Introducir dorsales nuevos con dos ruedas, una por cifra, sincronizadas con la rueda de jugadores conocidos cuando el dorsal exista.
5. Mover Inicio, Equipos, Partidos, Estadísticas y Ajustes a un menú lateral izquierdo con botón de tres rayas, y retirar la navegación inferior y la navegación horizontal que ocupan espacio.

Las ruedas existentes, la transcripción identificada, el aviso sonoro de cinco segundos y las tarjetas reflejadas por equipo ya están en el commit `12d66db` y se conservan durante la refactorización.
