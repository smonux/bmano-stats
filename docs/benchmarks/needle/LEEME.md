# Investigación de latencia de Needle (16 de octubre de 2026)

Ampliación posterior: [modelos de 4, 8 y 12 capas y esquema fijo, sin entrenamiento](MODELOS-LIGEROS.md). La mejora mediante búsqueda de frases literales propuesta después de esta investigación fue retirada a petición del usuario; no se incorporó al código.

Se midió inferencia real del motor WebAssembly en Chromium, sobre este servidor Linux x86-64. No son tiempos de Android. Pesos fijados por `cactus-needle` 0.3.0, Needle revisión `2ae11323dc000f5e70c49f7403efa6af12ba9e67`. Sin inferencias concurrentes de voz. La carga del modelo se midió por separado y se excluye de la tabla; en la aplicación ocurre antes del partido.

Cada resultado es una ejecución por variante y frase: no es un estudio de precisión ni una distribución de latencias. Los JSON anexos incluyen los argumentos originales del modelo, sus advertencias, tasas de prefill/decode y tiempos de carga/inferencia. Las propuestas de estas muestras quedaron retenidas por la baja confianza del modelo. La revisión humana sigue siendo obligatoria.

## Gol simple

Frase idéntica: «Gol nuestro, dorsal siete.»

| Variante | Caracteres del esquema | Caracteres de sistema | Inferencia |
| --- | ---: | ---: | ---: |
| Original, todos los eventos/campos | 1.996 | 381 | 34,57 s |
| Esquema general compacto | 908 | 83 | 15,00 s |
| Dos inferencias, clasificación y campos | 967 en total | 83 por llamada | 17,78 s |
| Herramienta de gol con dos campos | 320 | 83 | 5,95 s |
| Herramienta de gol + normalización de dorsal | 320 | 83 | 5,93 s |
| Ruta incorporada a la aplicación | 342 | 89 | 5,98 s |

La variante general compacta asignó un equipo incorrecto en esta muestra. Dividir en dos inferencias completas no fue más rápido que la compacta y tampoco resolvió bien el dorsal. La herramienta específica omitió «siete» hasta normalizar únicamente el tramo explícito «dorsal siete» a «dorsal 7»; entonces devolvió `equipo: nuestro, dorsal: 7`.

El esquema original produjo además penalti y otros campos que la frase no mencionaba. El nuevo esquema no expone campos disciplinarios para un gol y solo permite el indicador de penalti si existe una mención explícita. «Dorsal siete» no cuenta como siete metros.

## Parada con participante rival

Frase: «Parada rival, dorsal uno, lanzamiento de nuestro dorsal nueve.»

| Variante | Esquema | Sistema | Inferencia |
| --- | ---: | ---: | ---: |
| Original | 1.996 caracteres | 381 caracteres | 34,23 s |
| Ruta específica | 454 caracteres | 89 caracteres | 7,68 s |

La ruta específica conservó ambos dorsales, pero el modelo devolvió `parada` como equipo. Por ello la aplicación fija las referencias de perspectiva explícitas y no ambiguas de la cláusula principal: aquí «rival» es equipo 2; el «nuestro» del lanzamiento relacionado no lo cambia. Si aparecen referencias contradictorias en la cláusula principal, se mantiene la incertidumbre para revisar. Esta resolución se comprueba con pruebas de dominio; no se presenta el argumento original equivocado como un acierto de Needle.

## Cambio aplicado

1. Una ruta literal identifica solo prefijos de acción inequívocos; frases negadas, con varias acciones o sin prefijo claro usan el esquema general.
2. Los números dictados de 0–99 se normalizan únicamente tras un marcador explícito de dorsal, en los siete idiomas. No se modifica la transcripción almacenada, ni nombres, ni se recorta 100 a 1.
3. Needle recibe una sola herramienta con los campos que exige esa acción/frase, y hechos breves sobre idioma y perspectiva. No se ejecutan herramientas.
4. La propuesta vuelve al esquema canónico original. Se conservan los filtros de negación, datos no respaldados, múltiples llamadas y baja confianza, y el editor de revisión antes de guardar.
5. El editor muestra los tiempos reales de Whistle y Needle para contrastar la experiencia en cada dispositivo.

Los casos medidos reducen aproximadamente un 78–83 % el tiempo de interpretación. No implica esa misma mejora en todo el catálogo, otros idiomas o teléfonos físicos. Quedan pendientes medidas reales en Firefox Android, ruido de pabellón y una batería amplia de precisión; no se ha usado el benchmark como prueba de preparación para competición.

## Reproducir

Con `npm run dev` en el puerto 5173 y los pesos descargados mediante `node scripts/download-voice-test-models.mjs`:

```sh
CHROMIUM_PATH=/ruta/a/chrome \
VOICE_MODELS_DIR="$PWD/node_modules/.cache/voice-models" \
BENCH_VARIANTS=current,compact,staged,optimized \
BENCH_TEXT='Gol nuestro, dorsal siete.' \
node scripts/benchmark-needle.mjs
```

`BENCH_BROWSER=firefox` y `FIREFOX_PATH` permiten usar Firefox de escritorio. El informe se escribe en `test-results/needle-benchmark.json`; las mediciones de esta investigación están preservadas en este directorio.

La explicación de contexto se apoya en la [ficha oficial del modelo](https://huggingface.co/Cactus-Compute/needle3), que sitúa esquema, sistema y conversación en el mismo contexto, y en la [guía de herramientas de Cactus](https://www.cactuscompute.com/blog/designing-tools-for-needle), que recomienda herramientas específicas, argumentos respaldados por texto y hechos en el turno de sistema. Las diferencias de tiempo de la tabla son mediciones locales, no cifras de esas fuentes.
