# Audios sintéticos para la práctica

Cuatro archivos generados con Piper y `es_ES-davefx-medium`, el mismo modelo de síntesis descrito en [el audio de prueba anterior](../README.md). Solo se usan en tests; no se copian a `dist` ni se añaden al modelo o a las pistas de Whistle.

| Archivo | Texto sintetizado |
| --- | --- |
| goal.wav | Gol nuestro. |
| assist.wav | Gol nuestro de Marta, pase de la quince. |
| penalty.wav | Penalti cometido por ellos, número doce, provocado por Elena. |
| exclusion.wav | Exclusión de ellos. |

Generación con una instalación temporal de Piper (sin dependencia del proyecto):

```sh
uv run --with piper-tts python -m piper -m /ruta/es_ES-davefx-medium.onnx -f goal.wav -- 'Gol nuestro.'
```

La integración entrega estos WAV como un MediaStream sintético y conserva VoiceRecorder, AudioWorklet, Whistle, palabras clave, intérprete, adaptador y evaluación reales. Conserva en el informe las transcripciones y estados observados antes de cualquier corrección. Si Whistle falla, la prueba utiliza el editor habitual; no modifica el resultado del reconocedor ni atribuye éxito a pulsar grabar. Los recorridos controlados de `tests/review/voice-practice.spec.ts` sí sustituyen captura/ASR y lo indican expresamente. Ninguno acredita un micrófono físico, voces humanas independientes ni ruido de pista.
