# Evaluación del intérprete por reglas

Ejecutar desde la raíz: `npm run voice:evaluate`. No abre Whistle ni Needle, no descarga archivos y no entrena. Usa las 645 transcripciones sintéticas españolas del dataset y solo el contexto de nombres de equipo. **No se pasan nombres ni dorsales extraídos de las respuestas esperadas como entrada.**

| Medida | Resultado |
| --- | --- |
| Evento en las 540 acciones con tipo conocido | 538/540 (99.63 %) |
| Equipo en esas acciones | 538/540 (99.63 %) |
| Evento y equipo simultáneamente | 538/540 (99.63 %) |
| Respuesta completa exacta, incluidas abstenciones | 642/645 (99.53 %) |
| Rechazos correctos | 96/96 (100 %) |
| Acciones inciertas sin tipo inventado | 9/9 (100 %) |
| Falsos positivos entre rechazos | 0 |

Tiempo exclusivo del intérprete en Node v22.22.1 de este servidor: mediana 0.208 ms, percentil 95 0.736 ms. No incluye audio ni Whistle y no predice el tiempo en Android. La compilación de expresiones regulares se calienta antes de medir.

## Casos que requieren revisión

- **parada-006-3**: «Nuestro dorsal doce se quedó con el lanzamiento.». Esperado: `{"evento":"parada","equipo":"equipo1","dorsal":12}`. Devuelto: `null`.
- **parada-007-3**: «El lanzamiento acabó en las manos del portero rival, dorsal dieciséis.». Esperado: `{"evento":"parada","equipo":"equipo2","dorsal":16}`. Devuelto: `null`.
- **descalificacion-003-2**: «Descalificacion de Lucia Maria ha provocado la roja». Esperado: `{"evento":"descalificacion","equipo":"desconocido","nombre":"Lucia","nombre_relacionado":"Maria"}`. Devuelto: `{"evento":"descalificacion","equipo":"desconocido","nombre_relacionado":"Lucia Maria"}`.

## Conclusiones y límites

Evento y equipo funcionan bien en este corpus. Los rechazos impiden convertir charla, negaciones y acciones múltiples en eventos. Las expresiones implícitas sin palabra de acción reconocible quedan pendientes. Los nombres juntos sin puntuación pueden ser ambiguos sin plantilla de jugadores; los nombres conocidos se pasan al intérprete real y a Whistle, pero no se han añadido artificialmente a esta evaluación.

Se han ajustado reglas consultando el conjunto completo, incluida la partición test. Estos resultados miden regresión sobre el corpus disponible y **no son una estimación independiente de precisión**. No acreditan el reconocimiento con ruido de pabellón ni la exactitud de Whistle. El dataset es español; los otros seis idiomas tienen pruebas unitarias específicas, pero necesitan un corpus de voz propio antes de comparar precisión.

`resultado.json` conserva cada entrada, etiqueta, propuesta, coincidencia literal o aproximada, advertencias y duración; incluye métricas por evento, estilo, partición y campo, además de hashes del corpus y de la implementación.
