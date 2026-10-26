# Límite de 150 minutos

[Captura móvil, 390 × 664](movil.png), revisada: Finalizado, 150:00, sin reanudar/nuevo tiempo/confirmación. Marcador y nueve eventos conservados; exclusión detenida en 00:59 después de consumir el segundo restante hasta el límite.

Las pruebas usan Chromium móvil emulado y escritorio, reloj controlado y datos ficticios. Las 16 pasan: tres nuevos recorridos por proyecto más ciclo normal/offline, guía, cuatro contadores, importación antigua y pausa común. Las 158 unitarias incluyen persistencia idempotente y copia validada/restaurada, sin cambios de eventos/jugadores/equipos.

El límite corresponde al reloj del tiempo en curso, que «Nuevo tiempo» reinicia. No se suman duraciones de tiempos anteriores. Se comprueba cada segundo cuando el navegador ejecuta la aplicación y al recuperar foco/visibilidad o cargarla. Si el proceso está suspendido/cerrado no puede escribir en ese instante; se guarda al retomarlo, con reloj y exclusiones calculados para el límite exacto. Las pausas no avanzan el reloj.

No se han probado dispositivos físicos ni suspensión real del sistema operativo. Los recorridos de despertar y reapertura simulan un salto de Date sin entregar intervalos antes del foco/recarga, sin esperas arbitrarias.
