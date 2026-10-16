# Handball Stats

Primera versión web de registro local de estadísticas de balonmano. React, TypeScript, Vite e IndexedDB (Dexie). Interfaz en español, adaptada a móvil y escritorio.

## Arranque

Requiere Node.js 22.18 o superior.

```sh
npm ci
npm run dev
```

Abre la dirección que muestra Vite. Para probar el funcionamiento sin conexión, usa la compilación de producción:

```sh
npm run build
npm run preview
```

La primera visita requiere conexión para almacenar la aplicación. El service worker funciona en localhost o HTTPS. Los datos pertenecen al navegador y origen usados: desarrollo y previsualización tienen bases distintas por usar puertos distintos. No hay servidor de datos ni sincronización. En Ajustes puedes exportar una copia JSON e importar una copia validada; la importación pide confirmación y reemplaza todos los datos de forma atómica.

## Funcionalidad disponible

- Equipos y jugadores, nombre opcional, dorsal fijo y creación automática al registrar una acción.
- Inicio de partido con equipos del catálogo o nuevos y fecha.
- Reloj con pausa, reanudación, nuevos tiempos y finalización; corrección de partidos finalizados.
- Captura manual de los 11 eventos, participantes relacionados y metadatos aplicables.
- Captura local por voz con Whistle y Needle, revisión de la propuesta y transcripción literal conservada.
- Eventos pendientes sin cómputo; atribución de acciones sin dorsal al jugador virtual Desconocido.
- Marcador y estadísticas derivados de eventos; las correcciones y eliminaciones actualizan sus consecuencias.
- Estadísticas por equipo, jugador y partido, además de acumuladas.
- Guardado local, copias JSON y aplicación precargada para uso sin conexión.

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
