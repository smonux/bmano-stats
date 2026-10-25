# Entrega 3: contadores activos y acceso desde reloj

Mismos datos, perfiles aislados y tamaños que [la entrega 1b](../01-tipografia/README.md). Dos contadores pausados y uno terminado; las capturas se tomaron contra el `dist` servido por Tailscale, sin tocar el almacenamiento del usuario.

- Tres contadores, vista inicial: [antes](../01-tipografia/despues/390x664-short-top.png), [después](390x664-short-top.png).
- Registro desplazado con nombres largos: [antes](../01-tipografia/despues/390x664-long-scroll.png), [después](390x664-long-scroll.png).
- [320 × 568](320x568-long-scroll.png), [altura corta en horizontal](844x390-long-scroll.png), [escritorio](1440x1000-short-top.png).
- [Mediciones](measurements.json): la cabecera sigue midiendo 154 px con nombres cortos y 169,6 px con nombres largos a 390 × 664. La barra inferior mide 136 px; el presupuesto de registro sigue en 374/358,4 px. El indicador nuevo cabe en la fila del reloj, sin añadir otra fila en estos casos.

Se muestran solo los contadores ocupados y un único botón para iniciar el siguiente libre. El indicador junto al reloj muestra cuántos están ocupados; cambia a campana al vencer alguno, con texto accesible del estado. Su activación lleva al bloque de contadores, mueve el foco allí y compensa la altura real de la cabecera cuando es sticky. En las vistas bajas la cabecera conserva desplazamiento normal.

La explicación de que un contador no registra una exclusión es visible en un desplegable nativo que permite leer el funcionamiento completo. No se unen ciclos de vida ni se crean eventos al iniciar un contador. El acceso precargado después de guardar una exclusión queda en su bloque separado.

42 recorridos correctos entre Chromium móvil emulado y escritorio: contador sin dorsal, tres ocupados, cero/99, nombres largos, cuatro tamaños, acceso por teclado, límites bajo cabecera, pausa común e individual, recarga, caducidad y aviso de cuatro notas durante cinco segundos. Se conservó la prueba existente de altura menor de 72 px para la tarjeta habitual. También se verificaron entrada manual, ruedas restantes, texto ampliado y ausencia de overflow horizontal. Formato, TypeScript y build correctos.

No son pruebas físicas de iPhone, Android ni tecnologías de asistencia; la disponibilidad de audio en segundo plano sigue sujeta al navegador, como antes.
