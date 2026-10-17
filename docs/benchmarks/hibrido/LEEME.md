# Ensayo del modo híbrido — 17 de octubre de 2026

Reglas para elegir el evento y una inferencia de Needle para extraer los datos del esquema fijo de gol. Se usa la transcripción íntegra, sin normalizar los dorsales. Equipo 1: La Jota; equipo 2: Leones; equipo por defecto: equipo 1. SDK 0.3.0, pesos fijados en `src/voice/model-artifacts.json`, 192 tokens máximos, sesiones sin historia compartida entre capturas.

Motor WASM real desde Node v22.22.1 en el servidor Linux. Una ejecución por texto y profundidad; carga del modelo excluida. Las llamadas se ejecutan en secuencia, sin otra inferencia de voz concurrente. La primera llamada también configura el esquema; no debe compararse sin más con las posteriores. No son medianas ni medidas del navegador o Android. Los cuatro textos son sintéticos: ninguno es una transcripción real de Whistle.

| Capas | Gol nuestro, dorsal siete. | Nos han marcado gol, dorsal nueve. | gol nuestro del 7 pase d ana | Gol del siete. |
| --- | ---: | ---: | ---: | ---: |
| 4 | 2,16 s | 0,61 s | 0,67 s | 0,65 s |
| 8 | 6,12 s | 2,88 s | 1,97 s | 1,39 s |
| 12 | 6,97 s | 3,38 s | 2,68 s | 3,12 s |
| 20 | 12,67 s | 7,96 s | 4,36 s | 5,85 s |

**La prueba no demuestra una precisión suficiente.** Las cuatro profundidades generan errores y todas las propuestas originales quedaron retenidas por baja confianza. Aumentar capas no garantiza mejor respuesta en estos textos. Por ejemplo:

- Con 4 capas se pierden los dorsales y se asigna el equipo contrario en dos textos.
- Con 8 capas se inventa una asistencia del mismo dorsal en el gol simple; otra respuesta queda sin argumentos utilizables.
- Con 12 capas no se extrae el siete del primer gol; «nos han marcado» se atribuye a nuestro equipo y «pase d ana» atribuye Ana al goleador.
- Con 20 capas se añaden nombres, asistencias y penaltis no mencionados; también falla el equipo en «nos han marcado».

El adaptador valida tipos, rango, herramienta y metadatos aplicables, pero esas comprobaciones no certifican el significado. Los campos válidos pueden seguir siendo semánticamente incorrectos. Un equipo ausente, desconocido o inválido usa el valor por defecto con advertencia; un equipo canónico devuelto por Needle no se sobrescribe con reglas. Las propuestas siempre se revisan y guardan explícitamente.

[`needle-depths.json`](needle-depths.json) conserva texto, propuesta adaptada, advertencias, argumentos originales, confianza y tiempos. No se entrena, no se descargan otros modelos ni se presenta esta muestra como porcentaje de acierto. Hace falta evaluación con transcripciones reales independientes y el dispositivo de uso.

## Reproducir

Preparar primero los archivos estáticos con `npm run models:prepare` y tener el archivo original `needle3.cact` en `VOICE_MODELS_DIR`. No hace falta levantar un servidor:

```sh
node --input-type=module - <<'JS'
import {build} from 'rolldown';
await build({platform:'node',input:'scripts/benchmark-hybrid-node.ts',
  external:['cactus-needle'],
  output:{file:'node_modules/.cache/benchmark-hybrid-node.mjs',format:'esm'}});
JS
VOICE_MODELS_DIR=/ruta/a/modelos BENCH_DEPTHS=4,8,12,20 \
  node node_modules/.cache/benchmark-hybrid-node.mjs
```

El informe se escribe en `test-results/hybrid-needle.json`; puede elegirse otro destino con `BENCH_OUTPUT`. Por defecto solo se prueba la profundidad 12.
