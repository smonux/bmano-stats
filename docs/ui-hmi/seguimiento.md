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

Primera parte en curso: iconos de eventos/aplicación y contexto inicial de estadísticas. La escala tipográfica, contraste y tamaños táctiles se trabajarán junto a los ajustes de distribución necesarios, en el siguiente bloque de esta entrega.
