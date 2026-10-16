# Captura local por voz

## Uso

Dentro de un partido, abre **Voz** y pulsa **Preparar voz local**. Se descargan unos 53 MB la primera vez. Los modelos se verifican y se almacenan en la caché del navegador cuando está disponible. Se necesita HTTPS o localhost, WebAssembly, workers y AudioWorklet.

La perspectiva de quien graba es fija: «nuestro/nosotros» y sus variantes siempre son el equipo 1; «ellos/ellas/rival/contrario/suyo/su equipo» y sus variantes siempre son el equipo 2. No depende de quién juega en casa. Needle recibe esta regla y el resolvedor aplica la misma correspondencia. No hay selector de referencia. También se aceptan los nombres exactos de los equipos; «local» y «visitante» por sí solos no determinan la perspectiva.

Mantén pulsado para hablar y suelta para terminar, o usa **Grabar con un toque** y **Terminar grabación**. El límite es 20 segundos. Di una sola jugada: «gol nuestro, dorsal siete». El tiempo y minuto se toman al comenzar la captura, sin esperar al reconocimiento.

Whistle transcribe en español. Needle propone los campos y el editor permite revisarlos. El marcador solo cambia al guardar. Si la interpretación falla, se conserva el texto y se abre un borrador pendiente. Una única propuesta retenida por baja confianza puede mostrarse como borrador con advertencia explícita; nunca se ejecuta ni se guarda sin confirmación. Las respuestas múltiples, negadas o marcadas como no respaldadas por el texto no rellenan los campos. Los nombres se comparan dentro del equipo correcto, sin aproximación; un nombre ambiguo o inexistente queda sin dorsal. Los dorsales nuevos se crean al guardar, usando las mismas transacciones de la entrada manual.

La transcripción literal se guarda en `rawText`, separada de la nota editable. El audio no se guarda ni se envía a un servicio de transcripción. Cerrar el panel o salir del partido libera el micrófono y los workers. Los modelos deben cargarse de nuevo en memoria al reabrir el panel; la descarga se reutiliza si sigue en caché.

## Integración

- Modelos de Cactus: Whistle para transcripción y Needle 3 para extracción estructurada.
- Adaptador comunitario `cactus-needle` **0.3.0**, enlazado desde el [repositorio de Cactus](https://github.com/cactus-compute/needle). [Código y documentación del adaptador](https://github.com/afshinm/cactus-needle).
- Whistle: revisión `b358ddadd89b7a713b5aa131f23032d3cca1b251`.
- Needle: revisión `2ae11323dc000f5e70c49f7403efa6af12ba9e67`.
- El adaptador fija tamaño y SHA-256 de modelos y motor WASM. La aplicación fija la versión del adaptador.
- La captura usa AudioWorklet, PCM mono, límite de memoria/duración y cierre de pistas tras grabar. El worker de Whistle adapta la frecuencia de muestreo.
- La inferencia se ejecuta fuera del hilo de interfaz. Durante el procesamiento la captura manual sigue disponible.
- El service worker conserva JavaScript de la aplicación, el grabador y workers; el adaptador conserva modelos/WASM. En modo offline se pide carga solo desde caché.
- Licencias y avisos de distribución en `public/third-party/`.
- No se usa Web Speech API ni un servicio remoto alternativo.

## Pruebas reproducibles

```sh
npm test
npm run build
node scripts/download-voice-test-models.mjs
VOICE_MODELS_DIR="$PWD/node_modules/.cache/voice-models" npm run test:e2e -- tests/voice.spec.ts
```

El comando de descarga obtiene las revisiones fijadas y verifica sus hashes. Las pruebas de voz se omiten si no se define `VOICE_MODELS_DIR`. Requieren Chromium de Playwright, o `CHROMIUM_PATH` apuntando a un ejecutable compatible. Se inyecta un WAV sintético en el micrófono de prueba y se usan los modelos reales; no se simulan sus respuestas. Los archivos de modelo se sirven desde el directorio local de pruebas para evitar depender de la CDN durante la ejecución.

## Límites de esta entrega

No hay validación en Safari/iOS o Android físicos ni mediciones de ruido de pista, batería o latencia en teléfonos. El micrófono requiere permiso del usuario. El navegador puede borrar la caché y exigir otra descarga. Una frase con varias jugadas no se divide en varios eventos: debe revisarse y registrarse por separado. No se interpreta el minuto dictado: se usa el de inicio de captura y puede editarse. La revisión humana sigue siendo necesaria ante errores de reconocimiento o extracción.

La revisión de esta entrega detectó errores de transcripción con muestras sintéticas y propuestas retenidas por Needle. Una muestra posterior se transcribió correctamente, pero eso no acredita precisión general. La integración se presenta como «En pruebas»; falta evaluar frases variadas, nombres propios, ruido y dispositivos físicos antes de considerarla lista para uso en competición.

Verificación adicional: el arranque con `npm run dev` también carga y prepara los dos modelos reales en Chromium. No requiere ajustes especiales del servidor de desarrollo para los workers o WebAssembly.

Compatibilidad: los campos `localTeamId` y `visitorTeamId` del formato de almacenamiento v1 conservan sus nombres para leer copias existentes, pero representan respectivamente la primera y segunda posición. La interfaz ahora las identifica como equipo 1 (nuestro) y equipo 2 (rival). En partidos antiguos se conserva el orden existente; no se intercambian los equipos ni las estadísticas.
