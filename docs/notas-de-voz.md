# Notas del partido por voz

En reconocimiento español, la primera palabra normalizada que empiece por `not` o
`coment` selecciona Nota antes de analizar jugadas, equipos, jugadores o metadatos.
Sirven «Nota», «Not», «Comentario» y «Coment». Es una regla de prefijo literal;
no se buscan aproximaciones ni se inspecciona el resto de la frase.

El cuerpo conserva el texto posterior a la palabra inicial y su separador. La
transcripción completa se guarda aparte, sin modificar. La nota pertenece al
partido y conserva tiempo/minuto de captura; no tiene equipo, participantes ni
metadatos deportivos y nunca cuenta en las estadísticas. «Nota» sin texto queda
pendiente para completarla. La entrada manual está disponible en todos los
idiomas; el atajo hablado de este bloque es exclusivamente español.

Las notas se pueden leer y corregir desde el registro. Se exportan/importan en
JSON/ZIP con el resto de eventos y figuran en el PDF cronológico con su texto y
transcripción. Las copias anteriores sin notas siguen siendo compatibles.

## Validación

- Pruebas de reglas: prefijos, primera palabra, español, conservación del cuerpo,
  exclusión de palabras deportivas dentro de notas y comandos deportivos normales.
- Adaptador: texto original, posición capturada y ausencia de atribuciones.
- Repositorio: no crea jugadores ni modifica partido/estadísticas; limpia datos
  residuales; texto vacío pendiente; restauración y reapertura de IndexedDB.
- PDF: filas reales de notas incluyen cuerpo/transcripción sin jugador ficticio.
- Navegador móvil/escritorio: revisión de voz, edición, guardado por confirmación,
  lectura de texto largo, recarga y restauración ZIP. Se detectó y corrigió una
  etiqueta implícita de textarea cuyo nombre incluía el texto al reabrir el editor.

Estas pruebas de voz parten de una transcripción conocida y ejercitan el intérprete
real; no miden la precisión acústica de Whistle. No cambia su modelo ni configuración.

## Guía de introducción

La guía explica el orden evento → equipo → jugador 1 → jugador 2 → metadatos,
incluye ejemplos de gol y sustitución, los valores por defecto de equipo, el orden
de participantes y la confirmación explícita del guardado. Una página
propia recoge los dos ejemplos de Nota/Comentario. Sus explicaciones se traducen a
los siete idiomas; los ejemplos de notas se marcan como español porque este atajo
no se ha extendido a otros idiomas. Los ejemplos deportivos traducidos se ejecutan
contra las reglas en pruebas unitarias para detectar instrucciones que no funcionen.

El contenido largo tiene desplazamiento propio y la navegación queda visible en
390×664 y 390×520. Se conservan la elección de idioma, la finalización de la guía y
su acceso posterior desde Ajustes; no se fuerza a repetirla a usuarios existentes.

Validación conjunta: 134 pruebas unitarias en 29 archivos; 25 recorridos de navegador
móvil/escritorio entre guía, revisión de voz, notas, registro y PDF. El recorrido largo
de PDF se ejecutó en escritorio y mantiene su omisión móvil existente. Formato,
comprobación de tipos y compilación de producción correctos. Las capturas de gramática,
notas y editor se revisaron visualmente. Además del problema de etiqueta corregido,
la primera prueba de ZIP comparaba un orden de plantilla diferente; se ajustó la
comparación por identificador sin cambiar los datos esperados.
