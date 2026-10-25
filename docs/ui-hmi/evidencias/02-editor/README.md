# Entrega 2: registro directo

Las comparaciones usan el mismo fixture y tamaño de viewport, con perfil aislado y datos ficticios. La referencia anterior procede de `hmi-1b-zoom-final` (build de la entrega 1b, `aa0f997`). Las posteriores proceden de `hmi-02-close`, después del ajuste final del pie.

- Editor manual neutral a 390 × 664: [antes](antes-390x664.png), [después](despues-390x664.png).
- Editor manual neutral en escritorio: [antes](antes-1440x1000.png), [después](despues-1440x1000.png).
- [Gol en cuatro pulsaciones](gol-cuatro-pulsaciones-390x844.png), sin mover el formulario: abrir, equipo, Gol, Guardar. Plantilla de siete jugadores; no se exige dorsal.
- [Texto al 200 %, 320 × 568](texto-200-320x568.png). La rejilla reduce columnas; acciones y cuerpo mantienen desplazamiento independiente. El resumen admite foco y scroll para leerlo completo. La ampliación se simula con la fuente raíz, sin reducir tipografía.
- [Nombres largos a 320 × 568](nombres-largos-320x568.png), después de cambiar equipo/tipo y escribir una nota. El recorrido usa 30 jugadores por equipo y nombres de hasta 100 caracteres; también cubre plantilla vacía y siete jugadores.

Las pruebas comprueban selección neutral, los 13 tipos/iconos, teclado, separación de equipo/participantes, dorsal cero y 99, campos aplicables, Sale/Entra, persistencia, captura de minuto al abrir y doble envío sin duplicar. Se mantienen las pruebas del contexto por rueda porque ese control sigue disponible mediante Editar tiempo y minuto.

Las primeras ejecuciones detectaron recorte del pie con un viewport efectivo de 220 px y un cuerpo inutilizable al ampliar texto. Se corrigió la distribución y se mantuvo la exigencia de ver los controles completos. Se corrigieron también fixtures que superaban el límite del dominio y expectativas antiguas de ruedas, sin relajar las reglas de guardado.

Chromium móvil emulado y escritorio. No equivale a pruebas físicas de iPhone, Android o lectores de pantalla. Las pruebas de revisión usan texto para aislar la interfaz; la regresión de voz real usa Whistle local y permite corregir una interpretación pendiente, sin exigir una transcripción perfecta ni cambiar el modelo.
