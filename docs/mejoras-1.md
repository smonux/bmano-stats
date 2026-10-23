# Mejoras 1

Cambios solicitados en el HTML y las tres capturas de `Mejoras 1.zip`, aplicados en bloques y commits independientes sobre `main`. Se mantiene el reconocimiento Whistle, el protocolo determinista y la perspectiva del equipo que graba.

## 1. Preparación inicial de voz

Nuevo partido muestra el formulario completo solo hasta completar la preparación. Las siguientes visitas restauran la sesión desde archivos locales verificados, sin descargar ni solicitar micrófono. Ajustes conserva el formulario. Un archivo ausente o una carga fallida muestra un estado compacto con acceso a Ajustes y sigue impidiendo iniciar sin voz preparada. La marca de configuración no sustituye comprobar la caché.

Validación: ocho pruebas de preparación; recorridos de móvil/escritorio de preparación, reutilización offline, ocultación en Nuevo partido, creación de partido y copias ZIP/JSON.

## 2. Textos de reconocimiento

El botón se llama «Cargar reconocimiento de voz». Estados y errores de preparación usan el mismo concepto, con traducción en los siete idiomas. Los modelos y parámetros de Whistle no cambian.

## 3. Último equipo nuestro

Nuevo partido preselecciona el equipo 1 del último partido creado que siga disponible. No usa la fecha editable ni equipos o partidos archivados. La elección es un valor inicial: no sobrescribe cambios del usuario ni elige rival. Se obtiene de los partidos persistidos, sin una preferencia adicional que pueda quedar obsoleta.

Validación: orden de creación frente a fecha y exclusión de datos archivados; recorrido de importación, selección y recarga en móvil/escritorio.

## 4. Botón de pulsación mantenida

El texto visible y el nombre accesible dicen «Voz (mantener)», «Push to talk» y sus equivalentes en los otros cinco idiomas. No cambia la grabación directa con puntero, Espacio o Intro ni añade un menú previo.

## 5. Confirmación compacta

Tras transcribir se muestra una propuesta compacta: texto original, evento, equipo (con valor por defecto identificado), participantes y funciones, metadatos pertinentes, tiempo y minuto capturados. Por indicación posterior del usuario, se retira la cuenta atrás: Guardar evento (o Guardar pendiente si faltan datos) es el control inicial de teclado y solo guarda al pulsarlo. Editar conserva el borrador. Esperar o cambiar de pestaña no guarda; X, Escape y Descartar cancelan. Un error de persistencia mantiene la propuesta abierta con su explicación.

El resumen reutiliza `eventIssues` sin crear jugadores ni escribir datos. Una propuesta incompleta se identifica y se guarda pendiente al confirmarla, sin cómputo. Si hay una edición manual concurrente, se espera a que termine antes de mostrar la propuesta. Se conserva el push to talk directo y se devuelve el foco al botón de voz al cerrar.

Validación inicial con pruebas de temporizador y de adaptación al dominio; diez recorridos de componente con IndexedDB real y reloj controlado en móvil/escritorio, separados de la precisión de ASR. Tras retirar la cuenta atrás se elimina su prueba y los recorridos comprueban que esperar un minuto no guarda, tanto en jugadas completas como pendientes y notas. El fixture de pruebas vive fuera de la distribución de la aplicación. También se comprueba el recorrido de audio con Whistle real.

## 6. Tiempos al final

Los tiempos de procesamiento pasan al último elemento del contenido desplazable del editor, después de nota, transcripción y demás campos. Se muestran a 11 px y no ocupan la entrada del formulario. La prueba de voz comprueba su posición y tamaño.

## 7. Editor sin avisos técnicos

Se retiran la lista técnica del reconocimiento y los avisos genéricos de revisión o datos pendientes. La confirmación compacta explica el resultado y lo que falta; en el editor, «Guardar pendiente» sigue diferenciando un evento incompleto. El botón reutiliza la validación del dominio y los errores reales de persistencia conservan su explicación junto a Guardar. Nota y transcripción original permanecen disponibles.

## 8. Porteros

La plantilla permite marcar y desmarcar Portero; admite varios y cancelar no modifica el jugador. Guardar una parada con participante identificado marca al realizador como portero y recuerda su selección por equipo/partido, en la misma transacción. El lanzador relacionado no se marca. Corregir solo la nota de una parada antigua no cambia la última elección.

Si la voz no identifica al portero, se usa el último confirmado de ese equipo en ese partido y se indica en el resumen. Un participante reconocido prevalece, incluso el dorsal cero. El editor manual propone el mismo valor al elegir Parada/equipo. Los jugadores archivados, virtuales o desmarcados no se proponen. La marca en plantilla no inventa una selección inicial entre varios porteros.

Campos opcionales preservan las copias antiguas. ZIP/JSON conservan rol y selección y validan equipo/jugador de las referencias. No cambia el cómputo de las estadísticas.

El recorrido detectó que insertar un dorsal nuevo antes del seleccionado podía activar el anclaje de desplazamiento del navegador y cambiarlo. La rueda desactiva ese anclaje, cancela desplazamientos pendientes al recibir un valor y se recoloca también cuando cambia el valor sin cambiar su índice.

Validación: 125 pruebas de código aprobadas y seis recorridos de porteros/ruedas en móvil/escritorio; cancelación de alta de rol, varios porteros, dorsal cero, recarga y restauración ZIP, referencias inválidas y copias antiguas. Las pruebas del adaptador cubren prioridad del reconocimiento explícito y aislamiento por equipo/partido.

## 9. Enviar el PDF

El archivo se genera en segundo plano y se invalida al cambiar datos/idioma. Con soporte de compartir archivos, el botón dice «Enviar PDF a…» y llama al selector nativo directamente desde la pulsación, conservando la activación del usuario. Sin soporte, dice «Descargar PDF» y descarga. Cancelar el selector no descarga ni genera error. Un fallo real explica lo ocurrido y ofrece descargar el mismo archivo, sin confundirlo con un error de generación.

Los recorridos de navegador comprueban PDF válido, llamada con gesto activo, cancelación, fallo, alternativa de descarga y funcionamiento offline. La API nativa se simula en Chromium automatizado; la presentación del selector y los destinos disponibles dependen del navegador/sistema y no se certifican en un teléfono físico.

Para repetir la confirmación compacta aislada de ASR: `npx playwright test --config playwright.review.config.ts`. La batería principal usa `npm run test:e2e`; ambas admiten `CHROMIUM_PATH`. El audio real requiere `VOICE_MODELS_DIR` como se documenta en `voz.md`.

## Validación final

128 pruebas de código aprobadas; tipos, formato y compilación correctos. Se validan 43 recorridos principales de móvil/escritorio y diez de confirmación compacta. En la batería principal pasaron 41; los dos nuevos de compartir se repitieron y pasaron tras acotar su selector de aviso, que encontraba también el aviso de voz sin preparar. Se omite solo la repetición móvil del PDF largo, validado en escritorio. Capturas del resumen, nombres largos en altura corta, editor y portero cero revisadas.

`dist/` contiene la aplicación final y no incluye el fixture de pruebas. Los servidores temporales se cierran al terminar. No se cambia Whistle ni se entrena, publica o mezcla otra rama. La rama de interfaz supervisada se conserva.
