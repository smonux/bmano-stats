# Handball Stats

Primera versión web de registro local de estadísticas de balonmano. React, TypeScript, Vite e IndexedDB (Dexie). Interfaz en español, adaptada a móvil y escritorio.

## Arranque

Requiere Node.js 22.18 o superior. Las pruebas de navegador usan Python 3 como servidor estático temporal.

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
- Captura manual de los 12 eventos, participantes relacionados y metadatos aplicables.
- Sustituciones con jugador que sale y jugador que entra del mismo equipo; recuentos de cambios, entradas y salidas.
- Captura local por voz: Whistle transcribe, las reglas eligen el evento y Needle extrae sus datos; revisión y transcripción literal conservada.
- Eventos pendientes sin cómputo; atribución de acciones sin dorsal al jugador virtual Desconocido.
- Marcador y estadísticas derivados de eventos; las correcciones y eliminaciones actualizan sus consecuencias.
- Estadísticas por equipo, jugador y partido, además de acumuladas.
- Guardado local, copias ZIP (restauración ZIP o JSON) y aplicación precargada para uso sin conexión.

La integración nativa y reordenación por arrastre siguen pendientes. La voz está integrada en web; falta validarla en dispositivos físicos y con ruido de pista. Consulta la [guía de voz](docs/voz.md). Consulta el [estado de implementación](docs/implementacion.md) para conocer el alcance y las decisiones provisionales.

## Validación

```sh
npm run format:check
npm run check
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
- `src/App.tsx`: navegación, carga de datos y estructura de la aplicación.
- `src/pages`: pantallas de la aplicación.
- `src/voice/analysis` y `src/voice/languages`: fases del intérprete y vocabulario por idioma.
- [Guía para leer y modificar el código](docs/lectura-del-codigo.md).
- `tests`: pruebas del recorrido de usuario.
- [Especificación de diseño](docs/diseno/diseno.md).
- [Wireframes y fuentes](docs/diseno/wireframes/index.html).

## Idiomas y uso durante el partido

La interfaz y la voz pueden usar idiomas distintos: español, inglés, alemán, francés, italiano, neerlandés y polaco. El idioma de la interfaz se cambia en Ajustes o en la galería de bienvenida; el de captura, en la preparación previa al partido. Cactus se descarga y prepara antes de iniciar el partido; durante el juego el botón Voz es push to talk directo, sin panel adicional. Los siete comparten el mismo Whistle descargado.

La bienvenida aparece en el primer uso y se puede reabrir en Ajustes. Explica cómo preparar la voz, registrar una jugada, revisar el borrador y trabajar desde la perspectiva de quien graba.

Cada partido tiene tres contadores de exclusión de dos minutos con equipo y dorsal opcional. Se guardan localmente y en las copias, siguen las pausas del reloj y pueden pararse individualmente. El reloj del partido muestra minutos y segundos. A cero muestran «Puede volver». El sonido es opcional y requiere mantener abierta la vista del partido. La exclusión estadística se registra como evento aparte.

Vite acepta cualquier nombre de host (`allowedHosts: true`) en desarrollo y vista previa.


## Modelos y publicación estática

Antes del partido se eligen idioma, versión de Needle (4, 8, 12 o 20 capas; 12 inicialmente) y equipo por defecto (nuestro equipo inicialmente). Se cargan Whistle y únicamente la variante elegida de Needle. Whistle mantiene su modelo y configuración; recibe nombres y dorsales conocidos de ambas plantillas como pistas junto al vocabulario de balonmano.

Las reglas identifican solo el evento; si no hay coincidencia literal, intentan una aproximación acotada. Needle recibe la transcripción original y un esquema fijo específico del evento para extraer equipo, participantes y metadatos. Nuestro/nosotros es equipo 1 y rival/ellos equipo 2, según quién realiza la acción. Si Needle no resuelve el equipo se aplica el elegido por defecto, con advertencia. Consulta la [guía de voz](docs/voz.md).

`npm run build` prepara y verifica las variantes de Needle de 4/8/12 capas y genera `dist/`, incluidos los archivos estáticos en `models/`. Se publica ese directorio con Tailscale Serve; no necesita Node/Vite en producción. Whistle y Needle de 20 capas se descargan desde revisiones fijadas en Hugging Face. El navegador conserva los modelos para trabajar sin conexión. No se entrena ningún modelo.

`npm run voice:evaluate` conserva la evaluación del intérprete determinista anterior sobre el dataset español: sus [métricas y límites](docs/benchmarks/reglas/LEEME.md) no miden la precisión del modo híbrido actual ni del audio.

## Compartir un partido

La vista de estadísticas de un partido muestra el tanteo por periodo: minutos en X, goles acumulados en Y y un escalón por cada gol en el minuto registrado. «Compartir PDF del partido» está disponible tanto en curso como finalizado. El PDF incluye ambos equipos, estadísticas individuales, gráficos y eventos por periodo en orden creciente, con tablas compactas. Los eventos pendientes se identifican y no cuentan en estadísticas o marcador.

La generación ocurre en un worker para mantener libre la interfaz. Cuando el navegador admite compartir archivos se abre la hoja nativa; en los demás se descarga el PDF. El informe funciona sin conexión después de almacenar la aplicación, sus fuentes y workers. No se envían los datos a un servidor para crear el PDF.

## Dataset de voz en español

El [dataset de frases](datasets/voz-es/README.md) contiene 645 ejemplos sintéticos anotados para los 12 eventos, con dorsales en cifras y palabras y nombres ficticios de hombre y de mujer. Incluye casos de rechazo y particiones separadas por familia. Está disponible como [ZIP](datasets/voz-es.zip). `npm run dataset:build` regenera los archivos y `npm run dataset:check` valida su cobertura y correspondencia con el esquema actual. Su preparación no entrena modelos ni modifica Whistle.

## Trabajar con el código

`npm run format` aplica el formato automático; `npm run format:check` lo comprueba. TypeScript también detecta importaciones y parámetros sin uso. La [guía de lectura](docs/lectura-del-codigo.md) explica las pantallas, las fases de voz y cómo añadir una palabra clave. `npm run voice:compare` compara el intérprete actual con la referencia anterior a la refactorización, incluidos resultados, advertencias, vocabularios y rendimiento de texto.

La [auditoría integral](docs/refactorizacion-integral.md) registra el alcance y las comprobaciones de equivalencia. Las [indicaciones de interfaz posteriores](docs/tareas-pendientes.md) se completaron después de cerrar esa refactorización.

La navegación se abre con el botón de tres rayas de la izquierda. Los dorsales se introducen con dos ruedas. El editor mantiene Guardar y Cancelar sobre el teclado; los tres contadores ocupan una franja compacta. El menú ofrece «Fijar vertical» cuando se necesita pantalla completa; el navegador puede rechazar el bloqueo ([condiciones de la API](https://www.w3.org/TR/screen-orientation/#dom-screenorientation-lock)). Al girar se conserva la edición y se procesa el audio capturado si se cancela el contacto táctil.
