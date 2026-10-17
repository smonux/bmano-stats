// Text-only regression and timing evaluation; no training and no model downloads.
import {createHash} from 'node:crypto';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {rolldown} from 'rolldown';
const root=fileURLToPath(new URL('../',import.meta.url)),directory=resolve(root,'docs/benchmarks/reglas');
const dataset=await readFile(resolve(root,'datasets/voz-es/dataset.jsonl'),'utf8');
const rows=dataset.trim().split('\n').map(JSON.parse);
const bundle=await rolldown({input:resolve(root,'src/voice/deterministic.ts'),platform:'node',logLevel:'silent'});
const {output}=await bundle.generate({format:'esm'});await bundle.close();
const {interpretDeterministically:interpret}=await import('data:text/javascript;base64,'+Buffer.from(output[0].code).toString('base64'));
const stable=value=>value===null?'null':JSON.stringify(Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b))));
// Warm regex compilation before measuring, without reading annotations or player names.
interpret('Gol nuestro dorsal siete','es',['A','B']);
const results=rows.map(row=>{
 const expected=row.answers[0]?.arguments??null,start=performance.now();
 const result=interpret(row.query,'es',row.metadata.teams);const elapsedMs=performance.now()-start;
 return {id:row.id,category:row.metadata.category,style:row.metadata.style,split:row.metadata.split,query:row.query,teams:row.metadata.teams,expected,actual:result.proposal,exact:stable(expected)===stable(result.proposal),eventKeyword:result.eventKeyword,eventMatch:result.eventMatch,warnings:result.warnings,elapsedMs};
});
const ratio=(correct,total)=>({correct,total,percent:total?Number((correct/total*100).toFixed(2)):null});
const summarize=items=>{
 const known=items.filter(row=>row.expected&&row.expected.evento!=='desconocido'),negative=items.filter(row=>!row.expected),uncertain=items.filter(row=>row.expected?.evento==='desconocido');
 return {samples:items.length,exact:ratio(items.filter(row=>row.exact).length,items.length),
  event:ratio(known.filter(row=>row.actual?.evento===row.expected.evento).length,known.length),
  team:ratio(known.filter(row=>row.actual?.equipo===row.expected.equipo).length,known.length),
  eventAndTeam:ratio(known.filter(row=>row.actual?.evento===row.expected.evento&&row.actual?.equipo===row.expected.equipo).length,known.length),
  rejection:ratio(negative.filter(row=>!row.actual).length,negative.length),
  safeUncertain:ratio(uncertain.filter(row=>!row.actual||row.actual.evento==='desconocido').length,uncertain.length),
  falsePositiveActions:negative.filter(row=>row.actual&&row.actual.evento!=='desconocido').length};
};
const distribution=field=>Object.fromEntries([...new Set(results.map(row=>row[field]))].sort().map(value=>[value,summarize(results.filter(row=>row[field]===value))]));
const times=results.map(row=>row.elapsedMs).sort((a,b)=>a-b);
const fields=['evento','equipo','dorsal','nombre','dorsal_relacionado','nombre_relacionado','penalti','azul','infraccion'];
const fieldScores=Object.fromEntries(fields.map(field=>{
 const applicable=results.filter(row=>row.expected&&Object.hasOwn(row.expected,field));
 return [field,{...ratio(applicable.filter(row=>row.actual?.[field]===row.expected[field]).length,applicable.length),unexpected:results.filter(row=>row.actual&&Object.hasOwn(row.actual,field)&&(!row.expected||!Object.hasOwn(row.expected,field))).length}];
}));
const hash=value=>createHash('sha256').update(value).digest('hex');
const implementationFiles=['src/voice/deterministic.ts','src/voice/lexicon.ts','src/voice/approximate.ts','src/voice/numbers.ts'];
const report={date:new Date().toISOString(),runtime:process.version,method:'deterministic; text only; no ASR or audio evaluation',language:'es',rosterProvided:false,datasetSha256:hash(dataset),implementationSha256:hash((await Promise.all(implementationFiles.map(path=>readFile(resolve(root,path),'utf8')))).join('\n')),evaluationNotice:'Rules were developed using this synthetic corpus, including its test partition. Partition scores are regression results, not an independent generalization estimate.',summary:summarize(results),byCategory:distribution('category'),byStyle:distribution('style'),byPartition:distribution('split'),fields:fieldScores,timingMs:{mean:times.reduce((a,b)=>a+b,0)/times.length,p50:times[Math.floor(times.length*.5)],p95:times[Math.floor(times.length*.95)],max:times.at(-1)},results};
await mkdir(directory,{recursive:true});await writeFile(resolve(directory,'resultado.json'),JSON.stringify(report,null,2)+'\n');
const format=value=>`${value.correct}/${value.total} (${value.percent} %)`;
const failures=results.filter(row=>!row.exact);
const notes=`# Evaluación del intérprete por reglas\n\nEjecutar desde la raíz: \`npm run voice:evaluate\`. No abre Whistle ni Needle, no descarga archivos y no entrena. Usa las 600 transcripciones sintéticas españolas del dataset y solo el contexto de nombres de equipo. **No se pasan nombres ni dorsales extraídos de las respuestas esperadas como entrada.**\n\n| Medida | Resultado |\n| --- | --- |\n| Evento en las 495 acciones con tipo conocido | ${format(report.summary.event)} |\n| Equipo en esas acciones | ${format(report.summary.team)} |\n| Evento y equipo simultáneamente | ${format(report.summary.eventAndTeam)} |\n| Respuesta completa exacta, incluidas abstenciones | ${format(report.summary.exact)} |\n| Rechazos correctos | ${format(report.summary.rejection)} |\n| Acciones inciertas sin tipo inventado | ${format(report.summary.safeUncertain)} |\n| Falsos positivos entre rechazos | ${report.summary.falsePositiveActions} |\n\nTiempo exclusivo del intérprete en Node ${process.version} de este servidor: mediana ${report.timingMs.p50.toFixed(3)} ms, percentil 95 ${report.timingMs.p95.toFixed(3)} ms. No incluye audio ni Whistle y no predice el tiempo en Android. La compilación de expresiones regulares se calienta antes de medir.\n\n## Casos que requieren revisión\n\n${failures.map(row=>`- **${row.id}**: «${row.query}». Esperado: \`${JSON.stringify(row.expected)}\`. Devuelto: \`${JSON.stringify(row.actual)}\`.`).join('\n')}\n\n## Conclusiones y límites\n\nEvento y equipo funcionan bien en este corpus. Los rechazos impiden convertir charla, negaciones y acciones múltiples en eventos. Las expresiones implícitas sin palabra de acción reconocible quedan pendientes. Los nombres juntos sin puntuación pueden ser ambiguos sin plantilla de jugadores; los nombres conocidos se pasan al intérprete real y a Whistle, pero no se han añadido artificialmente a esta evaluación.\n\nSe han ajustado reglas consultando el conjunto completo, incluida la partición test. Estos resultados miden regresión sobre el corpus disponible y **no son una estimación independiente de precisión**. No acreditan el reconocimiento con ruido de pabellón ni la exactitud de Whistle. El dataset es español; los otros seis idiomas tienen pruebas unitarias específicas, pero necesitan un corpus de voz propio antes de comparar precisión.\n\n\`resultado.json\` conserva cada entrada, etiqueta, propuesta, coincidencia literal o aproximada, advertencias y duración; incluye métricas por evento, estilo, partición y campo, además de hashes del corpus y de la implementación.\n`;
await writeFile(resolve(directory,'LEEME.md'),notes);
console.log(JSON.stringify({summary:report.summary,timingMs:report.timingMs,failures:failures.map(row=>row.id)},null,2));
