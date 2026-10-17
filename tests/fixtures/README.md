# Audio de prueba

`gol-local.wav` es voz española sintética generada localmente con Piper y el modelo `es_ES-davefx-medium`:

```sh
python -m piper -m es_ES-davefx-medium.onnx -f original.wav -- 'Gol del equipo local, dorsal siete.'
ffmpeg -i original.wav -af apad=whole_dur=10 gol-local.wav
```

El silencio final evita que Chromium repita la frase durante la captura. [Modelo y ficha de origen](https://huggingface.co/rhasspy/piper-voices/tree/main/es/es_ES/davefx/medium), dataset CC0 según su ficha. El modelo se usa solo al generar esta muestra y no forma parte de la aplicación.

No contiene grabaciones ni datos de usuarios. Comprueba el recorrido real PCM → Whistle → reglas → revisión → guardado, incluido el caso en que el usuario debe corregir los campos. La prueba adjunta la transcripción y propuesta reales a su resultado. No acredita precisión de reconocimiento: se han observado errores con voz sintética y no se ha medido el reconocimiento en una pista.
