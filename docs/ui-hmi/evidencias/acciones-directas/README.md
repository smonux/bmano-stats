# Acciones directas y avance al introducir datos

- [Papelera visible](papelera.png), 390 × 664: icono sin rótulo ni menú Más, separado de Editar; el guardado no ofrece Deshacer creación.
- [Datos a 320 × 568](datos-320.png): tras elegir Gol con teclado, el foco y el desplazamiento se sitúan en los datos. Guardar/Cancelar siguen visibles.
- [Datos a 390 × 664](datos-390.png): mismo recorrido por toque, con jugador, asistente, metadatos y nota dentro del cuerpo desplazable.

Capturas revisadas de Chromium móvil emulado y datos ficticios. El icono tiene nombre accesible con jugada/minuto, tooltip y objetivo táctil de 48 px. El borrado pide confirmación, permite Cancelar/X/Escape y conserva jugadores/portero/contadores según el comportamiento existente.

147 unitarias y 114 recorridos distintos de navegador validados: 92 funcionales y 22 de revisión/carga. Incluyen teclado, nota sin apertura automática de teclado, falta de equipo y continuación hacia sus jugadores, sustitución Sale/Entra, borrado de pendiente/rival, foco tras eliminar la última tarjeta, voz real/offline, fallo real de escritura y rollback, recarga/copias y texto al 200 %. Los seis fallos iniciales del selector de prueba y su corrección se documentan en [seguimiento](../../seguimiento.md).

No se ha probado teclado nativo ni dispositivos físicos/Safari/WebKit/lectores de pantalla. El reconocimiento usa audio sintético: este recorrido no mide precisión de ASR con ruido de pabellón. No se modifican modelos, reglas de voz, esquema de persistencia, estadísticas ni PDF.
