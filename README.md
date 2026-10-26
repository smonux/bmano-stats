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
- Captura manual de los 13 tipos de evento, incluida Nota, con participantes relacionados y metadatos aplicables.
- Sustituciones con jugador que sale y jugador que entra del mismo equipo; recuentos de cambios, entradas y salidas.
- Captura local por voz: Whistle transcribe y las reglas interpretan comandos en orden evento/equipo/jugador 1/jugador 2/metadatos; resumen con guardado explícito, edición y transcripción original conservada.
- Porteros editables en la plantilla y último portero confirmado por equipo/partido como propuesta cuando falta en una parada.
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

La interfaz y la voz pueden usar idiomas distintos: español, inglés, alemán, francés, italiano, neerlandés y polaco. El idioma de la interfaz se cambia en Ajustes o en la galería de bienvenida; el de captura, en la preparación previa al partido. El reconocimiento se prepara la primera vez y se restaura desde archivos locales en las siguientes visitas; durante el juego el botón Voz es push to talk directo, sin panel adicional. Los siete comparten el mismo Whistle descargado.

La bienvenida aparece en el primer uso y se puede reabrir en Ajustes. Explica cómo preparar la voz, registrar una jugada, revisar el borrador y trabajar desde la perspectiva de quien graba.

Cada partido tiene cuatro contadores de exclusión de dos minutos con equipo y dorsal opcional. Se guardan localmente y en las copias, se pausan y reanudan con el reloj general; la X libera cada contador. El reloj del partido muestra minutos y segundos. A cero muestran «Puede volver». El sonido es opcional y requiere mantener abierta la vista del partido. La exclusión estadística se registra como evento aparte.

Si el reloj del tiempo en curso alcanza 150:00, el partido finaliza automáticamente sin confirmación y se detienen las exclusiones. Las pausas no cuentan; «Nuevo tiempo» sigue reiniciando el reloj. La comprobación funciona desde cualquier pantalla y al volver a abrir o reactivar la aplicación. Si el navegador estaba cerrado o suspendido, la finalización se guarda al volver, con el reloj detenido en 150:00. Se pueden seguir corrigiendo los eventos.

Vite acepta cualquier nombre de host (`allowedHosts: true`) en desarrollo y vista previa.


## Modelos y publicación estática

Antes del partido se elige idioma y se carga Whistle. Mantiene su modelo y configuración; recibe nombres y dorsales conocidos de ambas plantillas como pistas junto al vocabulario de balonmano. Needle no se carga ni interpreta en el flujo activo.

Las reglas interpretan comandos en orden evento, equipo, jugador principal, relacionado y metadatos. Nuestro/nosotros es equipo 1 y rival/ellos equipo 2, desde la perspectiva de quien graba. Sin referencia de equipo se usa el equipo 1. Consulta la [guía de voz](docs/voz.md).

`npm run build` genera `dist/` y todavía prepara y verifica los artefactos históricos de Needle de 4/8/12 capas en `models/`; el cliente activo no los descarga ni carga. Se publica ese directorio con Tailscale Serve; no necesita Node/Vite en producción. Whistle se descarga desde una revisión fijada en Hugging Face y el navegador lo conserva para trabajar sin conexión. No se entrena ningún modelo.

## Compartir un partido

La vista de estadísticas de un partido muestra el tanteo por periodo: minutos en X, goles acumulados en Y y un escalón por cada gol en el minuto registrado. «Enviar PDF a…» abre el selector nativo de archivos cuando está disponible; en los demás casos se ofrece «Descargar PDF». Ambas opciones están disponibles tanto en curso como finalizado. El PDF incluye ambos equipos, estadísticas individuales, gráficos y eventos por periodo en orden creciente, con tablas compactas. Cada evento incluye su nota y transcripción original cuando existen, debajo de los jugadores en la misma celda, con ajuste de líneas y paginación sin truncar el texto. Los eventos pendientes se identifican y no cuentan en estadísticas o marcador.

La generación ocurre en un worker para mantener libre la interfaz. Cuando el navegador admite compartir archivos se abre la hoja nativa; en los demás se descarga el PDF. El informe funciona sin conexión después de almacenar la aplicación, sus fuentes y workers. No se envían los datos a un servidor para crear el PDF.

## Trabajar con el código

`npm run format` aplica el formato automático; `npm run format:check` lo comprueba. TypeScript también detecta importaciones y parámetros sin uso. La [guía de lectura](docs/lectura-del-codigo.md) explica las pantallas, las fases de voz y cómo añadir una palabra clave. Las pruebas del protocolo de voz están en `src/voice/commands/commands.test.ts`; el corpus anterior y sus herramientas de evaluación se han retirado.

La [auditoría integral](docs/refactorizacion-integral.md) registra el alcance y las comprobaciones de equivalencia. Las [indicaciones de interfaz posteriores](docs/tareas-pendientes.md) se completaron después de cerrar esa refactorización.

La navegación se abre con el botón de tres rayas de la izquierda. El editor muestra todos los eventos en una matriz de tres columnas, con iconos y etiquetas cortas. En un evento manual nuevo propone Equipo 1, sin elegir evento; las correcciones conservan el equipo original. La nota está abierta y la transcripción original se consulta en su propio desplegable. Los jugadores conocidos se eligen directamente y «Otro dorsal» ofrece dos ruedas. Guardar y Cancelar permanecen sobre el teclado; los cuatro contadores ocupan una franja compacta. El menú ofrece «Fijar vertical» cuando se necesita pantalla completa; el navegador puede rechazar el bloqueo ([condiciones de la API](https://www.w3.org/TR/screen-orientation/#dom-screenorientation-lock)). Al girar se conserva la edición y se procesa el audio capturado si se cancela el contacto táctil.

Al elegir un evento, el editor desplaza su contenido hasta los datos de jugador/metadatos/nota; si falta equipo, lleva primero a seleccionarlo. El foco acompaña el recorrido sin abrir el teclado automáticamente. Cada tarjeta del registro tiene una papelera visible, sin menú «Más» ni texto largo; pide confirmación antes de eliminar. No se ofrece «Deshacer creación».

## Licencia

El código del proyecto se distribuye bajo la [licencia MIT](LICENSE). Copyright (c) 2026 smonux.

Las dependencias, fuentes y modelos conservan sus respectivas licencias. Los avisos de los componentes incluidos se encuentran en [public/third-party](public/third-party).

Las copias nuevas usan el formato 2 para los cuatro contadores con pausa común. Se pueden importar ZIP/JSON del formato 1 (tres contadores); se conservan los tiempos restantes y se adaptan al reloj general. Las versiones anteriores de la aplicación no leen las copias de formato 2.
