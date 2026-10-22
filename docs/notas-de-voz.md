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
- Navegador móvil/escritorio: revisión de voz, edición, guardado automático y manual,
  lectura de texto largo, recarga y restauración ZIP. Se detectó y corrigió una
  etiqueta implícita de textarea cuyo nombre incluía el texto al reabrir el editor.

Estas pruebas de voz parten de una transcripción conocida y ejercitan el intérprete
real; no miden la precisión acústica de Whistle. No cambia su modelo ni configuración.
