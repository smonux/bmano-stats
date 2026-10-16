# Needle con menos capas: pruebas sin entrenamiento

16 de octubre de 2026. Tras estas pruebas, por petición del usuario, la aplicación permite elegir 4, 8, 12 o 20 capas y usa 12 por defecto. Whistle mantiene su modelo original. No se ha entrenado, generado un dataset, llamado a la plataforma de entrenamiento ni subido datos. Tampoco se incorpora reconocimiento por frases literales ni se sustituye la interpretación por reglas.

## Qué hay disponible

La arquitectura oficial admite profundidades de 2 a 20 capas. El comando oficial `needle build --layers N` exporta una profundidad del modelo existente; no es entrenamiento. La distribución pública consultada contiene el archivo completo de 20 capas, no una colección de archivos `.cact` pequeños preparados para el navegador.

Fuentes primarias: [modelo y arquitectura](https://huggingface.co/Cactus-Compute/needle3), [personalización oficial](https://github.com/cactus-compute/needle#customisation), [formato y selección de capas](https://www.cactuscompute.com/blog/cact-format), [CLI de exportación](https://www.cactuscompute.com/blog/needle-python-docs).

El exportador Python requiere JAX. En este servidor, un Celeron N5105 sin AVX, `needle build --layers 8` falla al importar JAX, antes de abrir los pesos o iniciar cálculo. Se preparó por tanto un exportador **experimental** que selecciona bloques del archivo CQ ya descargado. Sigue el orden de la escalera oficial, recorta las filas correspondientes de mHC y del cabezal de confianza y actualiza los sitios engram y la atención global. No modifica ni vuelve a cuantizar los pesos conservados. La reconstrucción a 20 capas se verifica byte por byte contra el original. Esto no certifica equivalencia con una exportación oficial ni recalibra la confianza del modelo reducido.

## Medición en Chromium

Motor WASM y pesos reales, SDK 0.3.0, sin inferencias concurrentes. Una ejecución por frase y profundidad; no son medianas, medidas de Android ni un estudio de precisión. La carga se excluye de los tiempos. El esquema de cada frase se mantiene idéntico entre profundidades: se mide la reducción del modelo, sin una nueva estrategia de interpretación.

| Capas | Archivo | «Gol nuestro, dorsal siete.» | Parada con participante rival |
| --- | ---: | ---: | ---: |
| 20 | 35,34 MB | 6,05 s | 8,60 s |
| 12 | 22,55 MB | 3,46 s | 6,30 s |
| 8 | 16,16 MB | 2,15 s | 4,06 s |
| 4 | 9,76 MB | 1,22 s | 1,84 s |

La segunda frase exacta es «Parada rival, portero uno, lanzamiento nuestro del nueve.». Los resultados completos, incluidos los errores originales del modelo, están en [needle-depths.json](needle-depths.json).

En el gol, 20 y 12 capas devolvieron `nuestro` y dorsal 7; 4 y 8 devolvieron `gol` como equipo. En la parada, ninguna profundidad devolvió correctamente todos los participantes; 8 capas agotó el presupuesto de tokens. Estas cifras **no justifican sustituir automáticamente el modelo de producción**. El ahorro de 12 capas fue del 43 % en el gol y del 27 % en la parada, con la precisión insuficientemente validada.

## Esquema fijo y reutilización del contexto

Para separar la velocidad del reconocimiento por prefijos, se probaron también cuatro frases con un esquema fijo que expone todos los eventos y campos. La inferencia interpreta siempre el texto completo; no hay enrutamiento por frases ni correcciones locales de los argumentos. Se utilizó el mismo WASM desde Node, sin levantar otro servidor HTTP después de parar Vite a petición del usuario.

El esquema experimental con claves inglesas falló la comprobación completa de las cuatro muestras en 20, 12 y 8 capas. El informe conserva argumentos, truncamientos y avisos de datos no respaldados; comprobar solo los campos esperados habría ocultado campos adicionales inventados. Véase [needle-depths-semantic.json](needle-depths-semantic.json). Es un resultado de ese esquema y esas cuatro muestras, no una tasa general de acierto del modelo.

La reutilización del esquema redujo el trabajo de contexto entre llamadas, pero no resolvió por sí sola el problema. Otra prueba con el esquema canónico y preparación previa tuvo unos 14,68 s de carga/configuración y 9,66 s de primera llamada vacía. Las cuatro interpretaciones posteriores tardaron 7,61; 2,74; 7,39 y 5,72 s, con errores de tipo, equipo y campos inventados. Se descarta esa configuración para producción: [needle-prefix.json](needle-prefix.json). No se han extrapolado estos tiempos de Node a Firefox Android.

## Reproducir

Los modelos base se obtienen con el script de descarga ya existente, que verifica la revisión y sus hashes:

```sh
node scripts/download-voice-test-models.mjs
python3 scripts/needle-depths.py node_modules/.cache/voice-models/needle3.cact \
  --out /tmp/needle-depths --depths 4 8 12
```

Para repetir la medición de Chromium, hay que iniciar expresamente un servidor de desarrollo. **Se ha dejado parado**, junto con la vista previa, por petición del usuario.

```sh
VOICE_MODELS_DIR="$PWD/node_modules/.cache/voice-models" \
BENCH_DEPTH_DIR=/tmp/needle-depths BENCH_DEPTHS=20,4,8,12 \
BENCH_VARIANTS=optimized BENCH_OUTPUT=test-results/needle-depths.json \
CHROMIUM_PATH=/ruta/a/chrome node scripts/benchmark-needle.mjs
```

La prueba del esquema fijo se puede ejecutar sin servidor:

```sh
VOICE_MODELS_DIR="$PWD/node_modules/.cache/voice-models" \
BENCH_DEPTH_DIR=/tmp/needle-depths \
node scripts/benchmark-depths-node.ts
```

La prueba del esquema canónico importa TypeScript de la aplicación y se empaqueta con Rolldown, ya instalado por Vite:

```sh
node --input-type=module - <<'JS'
import {build} from 'rolldown';
await build({platform:'node',input:'scripts/benchmark-prefix-node.ts',
  external:['cactus-needle'],
  output:{file:'node_modules/.cache/benchmark-prefix-node.mjs',format:'esm'}});
JS
VOICE_MODELS_DIR="$PWD/node_modules/.cache/voice-models" \
node node_modules/.cache/benchmark-prefix-node.mjs
```

Los `.cact` experimentales se generaron inicialmente en `/tmp/bmano-voice/depths`. Ahora `npm run models:prepare` los genera de forma reproducible y verifica sus tamaños y hashes; la compilación los incorpora a `dist/models/` para la descarga explícita de la variante seleccionada. No hay nuevos procesos de entrenamiento ni servidores en ejecución. El próximo cambio del modelo necesita comparar precisión con una batería representativa, además de medir en el Android del usuario; cualquier entrenamiento queda pendiente de autorización explícita.
