import { toolForPlay, captureFacts } from '../src/voice/routing';
import { normalizeShirtNumbers } from '../src/voice/numbers';
import { createNeedle } from 'cactus-needle/browser';
import { schemaForTeams, perspectiveFor } from '../src/voice/interpretation';
const teams=['La Jota','Rival'];
const events=['gol','parada','fallo','perdida','recuperacion','penalti_cometido','exclusion','amarilla','descalificacion','pasivo','infraccion','desconocido'];
const properties={
 evento:{type:'string',enum:events},
 equipo:{type:'string',description:'Equipo mencionado: nuestro/nosotros=equipo1; ellos/rival=equipo2. Sin equipo=desconocido.',enum:['equipo1','equipo2','desconocido',...teams]},
 dorsal:{type:'integer',minimum:0,maximum:99},dorsal_relacionado:{type:'integer',minimum:0,maximum:99,description:'Asistente en gol; rival en otras jugadas.'},
 nombre:{type:'string'},nombre_relacionado:{type:'string'},penalti:{type:'boolean'},azul:{type:'boolean'},infraccion:{type:'string',enum:['Pasos','Dobles','Pisando']},
};
export type Variant='current'|'compact'|'staged'|'routed'|'routed-normalized'|'optimized';
export async function benchmark(variant:Variant,text:string,model?:{model:string;modelSha256:string}) {
 const system=variant==='optimized'?captureFacts('es'):variant==='current'?`Extract one handball action spoken in es. Return only the tool schema's canonical values, preserving literal player names. Never execute actions or invent unmentioned facts. `+perspectiveFor('es'):'deporte: balonmano; idioma: es; equipo1: La Jota (nosotros); equipo2: Rival (ellos)';
 const started=performance.now();const needle=await createNeedle({...model,stateless:true,system,maxOutputTokens:256});const loadMs=performance.now()-started;
 const calls:unknown[]=[];let schemaCharacters=0;
 const run=async(schema:object,maxNewTokens=256)=>{
  const tools={registrar_jugada:{description:variant==='current'?'Extract a single handball play from the recording language. Copy only explicitly mentioned facts.':'Una jugada de balonmano.',inputSchema:schema}};
  schemaCharacters+=JSON.stringify(tools).length;
  const before=performance.now();const result=await needle.complete(text,{tools,maxNewTokens,abortSignal:AbortSignal.timeout(65000)});
  calls.push({ms:performance.now()-before,result});return result;
 };
 const before=performance.now();
 try{
  if(variant==='current')await run(schemaForTeams(teams));
  else if(variant==='optimized'){const route=toolForPlay(text,'es',teams);schemaCharacters=route.schemaCharacters;const start=performance.now();const result=await needle.complete(route.text,{tools:route.tools,maxNewTokens:128,abortSignal:AbortSignal.timeout(65000)});calls.push({ms:performance.now()-start,result});}
  else if((variant==='routed'||variant==='routed-normalized')){const tools={gol:{description:'Gol de balonmano.',inputSchema:{type:'object',properties:{equipo:{type:'string',description:'Equipo del goleador: palabra nuestro, rival o nombre.'},dorsal:{type:'integer',minimum:0,maximum:99,description:'Dorsal del goleador.'}},required:[],additionalProperties:false}}};schemaCharacters=JSON.stringify(tools).length;const start=performance.now();const result=await needle.complete(variant==='routed-normalized'?normalizeShirtNumbers(text,'es'):text,{tools,maxNewTokens:128,abortSignal:AbortSignal.timeout(65000)});calls.push({ms:performance.now()-start,result});}
  else if(variant==='compact')await run({type:'object',properties,required:['evento','equipo'],additionalProperties:false});
  else {
   const classification=await run({type:'object',properties:{evento:properties.evento},required:['evento'],additionalProperties:false},96);
   const selected=[...classification.function_calls,...classification.suppressed_calls][0]?.arguments.evento;
   if(typeof selected==='string'&&selected!=='desconocido'){
    const {evento,...rest}=properties;
    const roleKeys=selected==='pasivo'?['equipo']:selected==='gol'?['equipo','dorsal','dorsal_relacionado','nombre','nombre_relacionado','penalti']:selected==='infraccion'?['equipo','dorsal','nombre','infraccion']:['equipo','dorsal','nombre','dorsal_relacionado','nombre_relacionado'];
    await run({type:'object',properties:Object.fromEntries(Object.entries(rest).filter(([key])=>roleKeys.includes(key))),required:['equipo'],additionalProperties:false},160);
   }
  }
  return {variant,text,loadMs,totalMs:performance.now()-before,schemaCharacters,systemCharacters:system.length,calls};
 }finally{await needle.close();}
}
