// Prepare static download assets. No training, server or changes to Whistle.
import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdir,readFile,writeFile,rename,mkdtemp,rm} from 'node:fs/promises';
import {resolve} from 'node:path';
import catalog from '../src/voice/model-artifacts.json' with {type:'json'};
const {needleArtifacts,needleSource}=catalog;
const NEEDLE_DEPTHS=Object.keys(needleArtifacts).map(Number);
const directory=resolve('public/models');
const valid=(bytes,artifact)=>bytes.length===artifact.size&&createHash('sha256').update(bytes).digest('hex')===artifact.sha256;
const exists=async(path,artifact)=>{try{return valid(await readFile(path),artifact);}catch{return false;}};
await mkdir(directory,{recursive:true});
const depths=NEEDLE_DEPTHS.filter(depth=>needleArtifacts[depth].file);
if((await Promise.all(depths.map(depth=>exists(resolve(directory,needleArtifacts[depth].file),needleArtifacts[depth])))).every(Boolean)) {
 console.log('Needle: variantes 4, 8 y 12 verificadas para servir como archivos estáticos.');
} else {
 const cache=resolve(process.env.VOICE_MODELS_DIR??'node_modules/.cache/voice-models');
 await mkdir(cache,{recursive:true});
 const source=resolve(cache,'needle3.cact');
 if(!await exists(source,needleSource)){
  const response=await fetch(needleSource.url);if(!response.ok)throw new Error(`Needle: HTTP ${response.status}`);
  const bytes=new Uint8Array(await response.arrayBuffer());if(!valid(bytes,needleSource))throw new Error('Needle: tamaño o SHA-256 incorrecto.');
  await writeFile(source+'.tmp',bytes);await rename(source+'.tmp',source);
 }
 const temporary=await mkdtemp(resolve(cache,'needle-depths-'));
 try{
  await promisify(execFile)('python3',['scripts/needle-depths.py',source,'--depths',...depths.map(String),'--out',temporary]);
  for(const depth of depths){
   const artifact=needleArtifacts[depth],bytes=await readFile(resolve(temporary,`needle3-${depth}l.cact`));
   if(!valid(bytes,artifact))throw new Error(`Needle ${depth}: tamaño o SHA-256 incorrecto.`);
   const path=resolve(directory,artifact.file);await writeFile(path+'.tmp',bytes);await rename(path+'.tmp',path);
  }
  console.log('Needle: variantes 4, 8 y 12 preparadas y verificadas, sin entrenamiento.');
 }finally{await rm(temporary,{recursive:true,force:true});}
}
