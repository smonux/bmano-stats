# Comandos ordenados sobre el corpus histórico

Ejecutar: `npm run voice:evaluate:commands`.

Este informe ejecuta el parser de producción sobre las 645 frases originales, sin modificar sus etiquetas y sin proporcionar plantilla ni nombres extraídos de las respuestas. El corpus contiene frases libres, omisión de equipo etiquetada como desconocido, funciones fuera de orden y nombres sin plantilla. El contrato nuevo exige evento, equipo, jugador 1, jugador 2 y metadatos; aplica equipo 1 por defecto y solo reconoce nombres conocidos. Por ello estas métricas describen incompatibilidades con el formato anterior, **no la precisión sobre comandos válidos**.

- Evento: 196/540 (36.3 %).
- Equipo: 137/540 (25.37 %).
- Evento y equipo: 137/540 (25.37 %).
- Respuesta exacta: 184/645 (28.53 %).
- Falsos positivos en frases originalmente negativas: 10.
- Mediana: 0.183 ms; p95: 0.423 ms en Node v22.22.1 de este servidor, sin Whistle/audio y sin plantilla.

Las pruebas de comandos cubren por separado los doce eventos, colores de tarjeta y dorsales 0–99 en siete idiomas, orden de jugadores conocidos/desconocidos y aproximaciones de nombres. No constituyen una evaluación independiente de audio real ni de ruido de pista. El JSON conserva todas las entradas, etiquetas, resultados y hashes, incluidas discrepancias. El corpus anterior se conserva para comparar; no se reetiquetan errores ni se entrena.
