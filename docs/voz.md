# Captura local por voz

## Preparación y uso durante el partido

Antes del partido, elige **Idioma de voz** y pulsa **Cargar Cactus** en Nuevo partido o Ajustes. Solo se descarga y carga **Whistle**. Se comprueba su archivo real en CacheStorage; el SDK verifica tamaño y SHA-256 al cargarlo. Una copia antigua de Needle no es necesaria ni suficiente para marcar la voz como preparada. La preferencia anterior de capas se ignora y se ha retirado el selector.

Whistle conserva su modelo, revisión, configuración de audio y los siete idiomas: español, inglés, alemán, francés, italiano, neerlandés y polaco. Se amplían sus pistas `keywords` con vocabulario de balonmano, nombres de los dos equipos, nombres conocidos y dorsales reales de ambas plantillas, en cifras y palabras del idioma elegido. Se eliminan duplicados y no se corta arbitrariamente la lista en 80 entradas. No se añaden los cien dorsales posibles: únicamente los conocidos en ese partido. Estas pistas ayudan al reconocimiento, pero no garantizan su precisión.

**Comprobar micrófono** solicita permiso y cierra inmediatamente las pistas. La publicación por Tailscale Serve usa HTTPS. Durante el partido, **Voz** es push to talk directo: mantener pulsado y soltar para terminar, también con Espacio o Intro. No hay segundo menú ni grabación con un toque. El límite es 20 segundos y el minuto se toma al comenzar la captura. Whistle trabaja en su worker; mientras transcribe se muestra un indicador animado y sigue disponible la entrada manual.

El editor conserva la transcripción literal, muestra tiempos separados de **Whistle en segundos** y **Reglas en milisegundos**, y permite revisar antes de guardar. Una interpretación ambigua abre un borrador pendiente; no modifica el marcador por sí sola. El audio no se conserva ni se envía a un servicio externo. Tras recargar un partido, solo se cargan archivos locales: si falta Whistle se deshabilita voz y aparece la alerta de preparación.

## Intérprete determinista

No se crea ninguna sesión de Needle ni se descargan sus pesos. El paquete `cactus-needle` 0.3.0 y su motor WASM compartido siguen siendo la dependencia usada para Whistle; el nombre del paquete o del WASM no implica que se esté ejecutando el modelo Needle. Los experimentos anteriores quedan en `docs/benchmarks/needle/` y scripts históricos, sin intervenir en desarrollo, compilación ni captura actual.

El análisis de `src/voice/deterministic.ts` sigue estas fases:

1. **Evento:** busca palabras clave e inflexiones del idioma de captura, incluso fuera del inicio de la frase. Distingue el penalti de lanzamiento del penalti cometido. Una asistencia propone un gol con asistente; no inventa goleador. No se consulta una tabla de frases del dataset.
2. **Aproximación:** solo si no hay evento literal, busca la mejor palabra clave próxima en ese idioma. Usa distancia de edición con transposiciones (uno o dos cambios según longitud), prefijos suficientemente largos y margen entre eventos competidores. «penal» es un alias de «penalti»; «exclucion» puede aproximarse a «exclusión». Si dos tipos compiten, deja el evento pendiente. Los nombres conocidos y nombres de club se excluyen de esa aproximación. Una advertencia visible identifica el resultado aproximado.
3. **Equipo:** separa participante principal y relacionado para aplicar la perspectiva. Nuestro/nosotros/nosotras/mi equipo y equivalentes → equipo 1; ellos/ellas/rival/contrario/suyo y equivalentes → equipo 2. El asistente de gol pertenece al mismo equipo; lanzador de una parada, perdedor en recuperación y beneficiarios/provocadores pertenecen al contrario. Local/visitante no resuelven la perspectiva. Los nombres de club exactos también se aceptan según el contexto del partido. Sin evidencia suficiente, equipo desconocido.
4. **Participantes:** reconoce dorsales 0–99 en cifras o palabras y nombres literales, usando la plantilla para reconocer nombres conocidos incluso en minúsculas. No aproxima nombres ni inventa un dorsal a partir del nombre. La resolución del dorsal por nombre ocurre después, dentro del equipo correcto. Los minutos, tanteos, metros y duración de exclusión no se convierten en dorsales. Un número fuera de rango se omite sin truncar; las autocorrecciones explícitas pueden sustituir el dorsal anterior.
5. **Metadatos, uno a uno:** penalti solo en gol/parada/fallo de siete metros; azul solo en descalificación; Pasos/Dobles/Pisando solo en infracción. Pasivo solo admite equipo. La exclusión no exige dorsal. Las sanciones con tipo incierto conservan equipo/jugador cuando están expresos, con evento pendiente.

Preguntas, negaciones, jugadas anuladas, varias acciones y avisos de pasivo sin infracción no producen una propuesta de acción definitiva. Los colores de una camiseta no se toman por tarjetas y el tiempo restante no se interpreta como exclusión. No se usa un modelo de extracción alternativo ni entrenamiento.

## Ejemplos de los siete idiomas

| Idioma | Gol propio | Parada rival con lanzador propio |
| --- | --- | --- |
| ES | Gol nuestro, dorsal veintiuno | Parada rival, dorsal uno; tiro de nuestro nueve |
| EN | Our goal, number twenty-one | Save their number one; shot from our number nine |
| DE | Tor für uns, Nummer einundzwanzig | Parade Gegner Nummer eins; Wurf von unser Nummer neun |
| FR | But pour nous, numéro vingt et un | Arrêt adversaire numéro un; tir de notre numéro neuf |
| IT | Gol nostro, numero ventuno | Parata loro numero uno; tiro di nostro numero nove |
| NL | Doelpunt voor ons, rugnummer eenentwintig | Redding tegenstander rugnummer een; schot van ons rugnummer negen |
| PL | Nasza bramka, numer dwadzieścia jeden | Obrona rywala numer jeden; rzut zawodnika nasz numer dziewięć |

Los comandos breves y explícitos son más predecibles que una narración implícita. Se cubren las formas cardinales 0–99, variantes de género comunes y números compuestos; francés incluye septante/huitante/octante/nonante. La revisión sigue siendo necesaria con nombres nuevos, referencias pronominales ambiguas y expresiones sin palabra de acción reconocible.

Referencias lingüísticas usadas para revisar números compuestos: [Duden](https://www.duden.de/sprachwissen/rechtschreibregeln/getrennt-und-zusammenschreibung), [Académie française](https://www.dictionnaire-academie.fr/article/QDL078), [Treccani](https://www.treccani.it/vocabolario/ventuno/) y [Zintegrowana Platforma Edukacyjna](https://zpe.gov.pl/a/jezykowy-swiat-liczb/DpbQ4CKTd).

## Verificación

```sh
npm test
npm run build
npm run voice:evaluate
node scripts/download-voice-test-models.mjs
VOICE_MODELS_DIR="$PWD/node_modules/.cache/voice-models" npm run test:e2e
```

`voice:evaluate` ejecuta las 600 transcripciones sintéticas españolas, conserva cada propuesta y publica [resultados y conclusiones](benchmarks/reglas/LEEME.md). No ejecuta Whistle, no le añade nombres de las respuestas esperadas como plantilla y no mide reconocimiento acústico. Las reglas se han ajustado con ese corpus completo; los resultados son una comprobación de regresión, no una estimación independiente de precisión.

Las pruebas de código cubren 11 eventos y perspectiva en los siete idiomas, cada dorsal 0–99 en cifras y palabras, variantes ortográficas independientes, aproximación, roles, metadatos, rechazos y vocabulario de Whistle. Los recorridos de navegador emplean Whistle real, audio sintético, descarga única, cambios de idioma y recarga sin conexión sin Needle. Requieren Chromium y `VOICE_MODELS_DIR` con `whistle.cact`; `CHROMIUM_PATH` permite indicar el ejecutable.

No se ha evaluado todavía con Android/iOS físicos, ruido de pista ni un corpus acústico equivalente en los otros seis idiomas. Los errores de Whistle y los límites semánticos de las reglas siguen requiriendo revisión antes de guardar.
