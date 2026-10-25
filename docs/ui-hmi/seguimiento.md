# Seguimiento de cambios HMI

Rama: `cambios-hmi`, creada desde `main` en `138fbf1`. Trabajo por entregas; sin merge ni publicación.

## Decisiones aprobadas

Samuel aprobó el 25 de octubre de 2026 las recomendaciones de la propuesta y de la conversación de contradicciones:

- Permitir un inicio explícito «Iniciar solo con entrada manual» cuando la voz no esté preparada. La preparación y elección del idioma siguen siendo necesarias para usar voz.
- Adoptar selección directa de equipos, acciones y jugadores en el editor; dorsal grande con nombre debajo. Evaluar otros usos de ruedas por separado.
- Conservar push to talk.
- Conservar contenido de nuestro equipo a la izquierda y rival a la derecha, con posiciones estables para acciones.
- Conservar menú lateral y reservar barra inferior de partido para captura.
- Mantener entrada manual neutral; los valores inferidos de voz deben ser visibles.

## Entrega 0: referencia inicial

Base comprobada antes de cambiar código: `138fbf1`.

- `npm test`: 135 pruebas en 28 archivos, todas correctas.
- `npm run format:check`: correcto.
- `npm run build`: correcto, incluida comprobación TypeScript. Se mantiene el aviso de tamaño de chunks de Vite.
- Navegador: 14 pruebas correctas de `courtside.spec.ts`, `editor-viewport.spec.ts` y `event-feed.spec.ts`, con Chromium móvil emulado (390 × 844) y escritorio (1440 × 1000).
- Se conserva una muestra de capturas en [evidencias/00-base](evidencias/00-base): registro móvil/escritorio y editor móvil. Las suites generan el resto de capturas al ejecutarlas.

Comando reproducible, usando el ejecutable Chromium instalado en este entorno:

```sh
CHROMIUM_PATH=/ruta/a/chrome-headless-shell npx playwright test \
  tests/courtside.spec.ts tests/editor-viewport.spec.ts tests/event-feed.spec.ts \
  --workers=1 --output=test-results/hmi-00-baseline
```

La matriz de tamaños cortos, nombres largos, texto ampliado y WebKit se ampliará con los componentes afectados en cada entrega. Esta referencia no es una prueba física de Safari/iPhone ni de audio en pista.

## Entrega 1: base visual e identidad

Primera parte: iconos de eventos/aplicación y contexto inicial de estadísticas. La escala tipográfica, contraste y tamaños táctiles se trabajarán junto a los ajustes de distribución necesarios, en el siguiente bloque de esta entrega. La entrega 1 completa sigue pendiente hasta cerrar esos ajustes.

### Iconos

- Los 13 dibujos SVG proporcionados se incorporan como `EventIcon`, independiente del dominio. Conservan sus trazos y heredan el color de cada tarjeta. Las etiquetas de texto siguen dando nombre al evento; los SVG son decorativos para lectores de pantalla.
- El icono elegido sustituye al anterior en cabecera y favicon. Se añaden PNG de 192/512 px para el manifiesto y 180 px para acceso en iOS. El recurso de 512 px también declara propósito maskable.
- Los recursos PNG se incluyen en el precache existente. Comprobada su lectura con red cortada y peticiones externas abortadas, después de instalar el service worker y recargar. No se ha probado la instalación en dispositivos físicos.
- Capturas comparables del mismo partido y viewport en [evidencias/01-identidad](evidencias/01-identidad), frente a `00-base`.
- `hmi-identity.spec.ts`: cuatro pruebas correctas entre móvil y escritorio. Todos los tipos, etiquetas y perspectiva conservados; pendientes y marcador coherentes. Comprobado también reflow a 320 × 568, 390 × 664, 430 × 932 y 844 × 390.

Regeneración de los iconos de instalación a partir del vector original:

```sh
CHROMIUM_PATH=/ruta/a/chrome-headless-shell node scripts/export-app-icons.mjs
```

### Ajuste previo de cabecera en pantallas cortas — HMI-12 parcial

El caso de nombres largos a 320 × 568 reprodujo una oclusión real: la cabecera sticky y la barra de captura interceptaban los toques sobre el selector de estadísticas. La traza mostró ambas superficies interceptando el puntero; no era un fallo de guardado ni un problema de espera.

Se permite que la cabecera se desplace normalmente cuando la altura disponible es de 640 CSS px o menos. No se eliminan controles ni se introduce un panel colapsable. Es un ajuste previo pequeño; la separación completa de marcador/reloj respecto a controles secundarios sigue prevista para la entrega 3.

- Regresión independiente en `hmi-short-viewport.spec.ts`, correcta en móvil y escritorio; selección mediante puntero normal, sin clicks forzados ni sleeps.
- [Antes y después a 320 × 568](evidencias/01-pantalla-corta). El antes procede de un fotograma de la traza fallida; el después muestra la selección rival realizada con éxito. Mismos nombres y datos, con diferente posición de scroll durante el intento.
- Se conservan distribución y tamaño actuales de exclusiones y barra inferior. Sus mejoras de legibilidad y espacio siguen pendientes de las entregas siguientes.
