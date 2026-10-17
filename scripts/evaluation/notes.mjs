export function evaluationNotes(report, sampleCount) {
  const results = report.results;
  const format = (value) => `${value.correct}/${value.total} (${value.percent} %)`;
  const failures = results.filter((row) => !row.exact);
  const notes = `# Evaluación del intérprete por reglas

Ejecutar desde la raíz: \`npm run voice:evaluate\`. No abre Whistle ni Needle, no descarga archivos y no entrena. Usa las ${sampleCount} transcripciones sintéticas españolas del dataset y solo el contexto de nombres de equipo. **No se pasan nombres ni dorsales extraídos de las respuestas esperadas como entrada.**

| Medida | Resultado |
| --- | --- |
| Evento en las ${report.summary.event.total} acciones con tipo conocido | ${format(report.summary.event)} |
| Equipo en esas acciones | ${format(report.summary.team)} |
| Evento y equipo simultáneamente | ${format(report.summary.eventAndTeam)} |
| Respuesta completa exacta, incluidas abstenciones | ${format(report.summary.exact)} |
| Rechazos correctos | ${format(report.summary.rejection)} |
| Acciones inciertas sin tipo inventado | ${format(report.summary.safeUncertain)} |
| Falsos positivos entre rechazos | ${report.summary.falsePositiveActions} |

Tiempo exclusivo del intérprete en Node ${process.version} de este servidor: mediana ${report.timingMs.p50.toFixed(3)} ms, percentil 95 ${report.timingMs.p95.toFixed(3)} ms. No incluye audio ni Whistle y no predice el tiempo en Android. La compilación de expresiones regulares se calienta antes de medir.

## Casos que requieren revisión

${failures.map((row) => `- **${row.id}**: «${row.query}». Esperado: \`${JSON.stringify(row.expected)}\`. Devuelto: \`${JSON.stringify(row.actual)}\`.`).join('\n')}

## Conclusiones y límites

Evento y equipo funcionan bien en este corpus. Los rechazos impiden convertir charla, negaciones y acciones múltiples en eventos. Las expresiones implícitas sin palabra de acción reconocible quedan pendientes. Los nombres juntos sin puntuación pueden ser ambiguos sin plantilla de jugadores; los nombres conocidos se pasan al intérprete real y a Whistle, pero no se han añadido artificialmente a esta evaluación.

Se han ajustado reglas consultando el conjunto completo, incluida la partición test. Estos resultados miden regresión sobre el corpus disponible y **no son una estimación independiente de precisión**. No acreditan el reconocimiento con ruido de pabellón ni la exactitud de Whistle. El dataset es español; los otros seis idiomas tienen pruebas unitarias específicas, pero necesitan un corpus de voz propio antes de comparar precisión.

\`resultado.json\` conserva cada entrada, etiqueta, propuesta, coincidencia literal o aproximada, advertencias y duración; incluye métricas por evento, estilo, partición y campo, además de hashes del corpus y de la implementación.
`;
  return notes;
}
