# Handball Stats

Primera versión web de registro local de estadísticas de balonmano. React, TypeScript, Vite e IndexedDB (Dexie). Interfaz en español, adaptada a móvil y escritorio.

## Arranque

Requiere Node.js 22.18 o superior y Python 3 para preparar las variantes de Needle.

```sh
npm ci
npm run dev
```

Abre la dirección que muestra Vite. Para probar el funcionamiento sin conexión, usa la compilación de producción:

```sh
npm run build
npm run preview
```

La primera visita requiere conexión para almacenar la aplicación. El service worker funciona en localhost o HTTPS. Los datos pertenecen al navegador y origen usados: desarrollo y previsualización tienen bases distintas por usar puertos distintos. No hay servidor de datos ni sincronización. En Ajustes puedes exportar una copia ZIP e importar una copia ZIP o JSON validada; la importación pide confirmación y reemplaza todos los datos de forma atómica.

## Funcionalidad disponible

- Equipos y jugadores, nombre opcional, dorsal fijo y creación automática al registrar una acción.
- Inicio de partido con equipos del catálogo o nuevos y fecha.
- Reloj con pausa, reanudación, nuevos tiempos y finalización; corrección de partidos finalizados.
- Captura manual de los 11 eventos, participantes relacionados y metadatos aplicables.
- Captura local por voz con Whistle y Needle, revisión de la propuesta y transcripción literal conservada.
- Eventos pendientes sin cómputo; atribución de acciones sin dorsal al jugador virtual Desconocido.
- Marcador y estadísticas derivados de eventos; las correcciones y eliminaciones actualizan sus consecuencias.
- Estadísticas por equipo, jugador y partido, además de acumuladas.
- Guardado local, copias ZIP (restauración ZIP o JSON) y aplicación precargada para uso sin conexión.

La integración nativa y reordenación por arrastre siguen pendientes. La voz está integrada en web; falta validarla en dispositivos físicos y con ruido de pista. Consulta la [guía de voz](docs/voz.md). Consulta el [estado de implementación](docs/implementacion.md) para conocer el alcance y las decisiones provisionales.

## Validación

```sh
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Si Chromium ya está instalado, se puede indicar su ejecutable con `CHROMIUM_PATH=/ruta/a/chrome npm run test:e2e`. Las pruebas de navegador usan dos tamaños de pantalla en Chromium; no sustituyen pruebas en Safari/iOS o Android físicos. Las capturas y trazas de fallos se guardan en `test-results/`.

## Estructura

- `src/domain`: modelo, validación de copias, reloj y reglas estadísticas.
- `src/data`: transacciones y persistencia local.
- `src/components`: editor, estadísticas y componentes de interfaz.
- `src/App.tsx`: pantallas y navegación.
- `tests`: pruebas del recorrido de usuario.
- [Especificación de diseño](docs/diseno/diseno.md).
- [Wireframes y fuentes](docs/diseno/wireframes/index.html).

## Idiomas y uso durante el partido

La interfaz y la voz pueden usar idiomas distintos: español, inglés, alemán, francés, italiano, neerlandés y polaco. El idioma de la interfaz se cambia en Ajustes o en la galería de bienvenida; el de captura, en la preparación previa al partido. Cactus se descarga y prepara antes de iniciar el partido; durante el juego el botón Voz es push to talk directo, sin panel adicional. Los siete comparten el mismo Whistle descargado.

La bienvenida aparece en el primer uso y se puede reabrir en Ajustes. Explica cómo preparar la voz, registrar una jugada, revisar el borrador y trabajar desde la perspectiva de quien graba.

Cada partido tiene tres contadores de exclusión de dos minutos con equipo y dorsal opcional. Se guardan localmente y en las copias, siguen las pausas del reloj y pueden pararse individualmente. El reloj del partido muestra minutos y segundos. A cero muestran «Puede volver». El sonido es opcional y requiere mantener abierta la vista del partido. La exclusión estadística se registra como evento aparte.

Vite acepta cualquier nombre de host (`allowedHosts: true`) en desarrollo y vista previa.


## Modelos y publicación estática

En la preparación de voz hay una única selección de versión: Needle de 4, 8, 12 o 20 capas. La primera selección es 12 y se conserva en este navegador. El idioma sigue eligiéndose por separado. Whistle mantiene su modelo, revisión y funcionamiento actuales. Cambiar Needle cierra el intérprete anterior y verifica los archivos de la versión elegida; se reutilizan Whistle y las variantes ya descargadas. Las descargas se hacen antes del partido.

`npm run build` prepara y verifica los archivos reducidos de Needle antes de compilar. Esa preparación usa Python 3 (solo biblioteca estándar), descarga el archivo base fijado si falta y selecciona capas sin entrenamiento. Los archivos generados se excluyen de Git. También puede ejecutarse `npm run models:prepare`; `VOICE_MODELS_DIR` permite reutilizar un directorio con el modelo base verificado. Las variantes experimentales conservan las limitaciones de precisión documentadas en `docs/benchmarks/needle/MODELOS-LIGEROS.md`.

Se publica únicamente `dist/`, directamente como directorio estático con Tailscale Serve. Contiene las variantes de 4, 8 y 12 capas; no se precargan las tres en el navegador. El usuario descarga la elegida. Needle completo y Whistle se obtienen de sus revisiones oficiales en Hugging Face. El navegador conserva los modelos verificados para trabajar sin conexión. No se necesita un proceso Node/Vite en producción.

## Compartir un partido

La vista de estadísticas de un partido muestra el tanteo por periodo: minutos en X, goles acumulados en Y y un escalón por cada gol en el minuto registrado. «Compartir PDF del partido» está disponible tanto en curso como finalizado. El PDF incluye ambos equipos, estadísticas individuales, gráficos y eventos por periodo en orden creciente, con tablas compactas. Los eventos pendientes se identifican y no cuentan en estadísticas o marcador.

La generación ocurre en un worker para mantener libre la interfaz. Cuando el navegador admite compartir archivos se abre la hoja nativa; en los demás se descarga el PDF. El informe funciona sin conexión después de almacenar la aplicación, sus fuentes y workers. No se envían los datos a un servidor para crear el PDF.
