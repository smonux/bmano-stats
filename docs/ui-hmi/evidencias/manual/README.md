# Inicio manual explícito

`hmi-manual.spec.ts`: cuatro recorridos correctos en móvil y escritorio. Además, los seis de ciclo de partido, preferencias y primer caso manual pasan con modelos reales preparados para el recorrido normal.

Sin modelos/idioma se puede elegir explícitamente **Iniciar solo con entrada manual**. Enter en fecha no lo activa. Equipo ausente, mismo ID en ambos lados o fecha vacía deshabilitan el inicio; los enlaces de requisitos enfocan el control. Un nombre duplicado se rechaza en la transacción existente y se puede corregir sin perder los campos. El reloj y editor funcionan offline después de iniciar; PTT continúa deshabilitado. Recarga conserva el partido.

`inicio-manual.png` y `partido-creado.png` revisadas con nombres largos. El texto de preparación ahora se refiere a usar voz, evitando contradecir el inicio manual. Se mantienen validaciones del repositorio, fecha y preparación real para voz. No se guarda un modo nuevo ni se cambian modelos o formatos de copia.

Chromium emulado; no prueba de teclado o micrófono físicos.
