// Explicit test setup. Application users download through the voice panel.
import { DEFAULT_MODEL, DEFAULT_SPEECH_MODEL } from 'cactus-needle';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { resolve } from 'node:path';
const directory=resolve(process.env.VOICE_MODELS_DIR ?? 'node_modules/.cache/voice-models');
await mkdir(directory,{recursive:true});
for(const model of [DEFAULT_MODEL,DEFAULT_SPEECH_MODEL]) {
 const path=resolve(directory,`${model.name}.cact`);
 const valid=bytes=>bytes.length===model.size&&createHash('sha256').update(bytes).digest('hex')===model.sha256;
 try{if(valid(await readFile(path))){console.log(`${model.name}: verificado`);continue;}}catch{}
 const response=await fetch(model.url);if(!response.ok)throw new Error(`${model.name}: HTTP ${response.status}`);
 const bytes=new Uint8Array(await response.arrayBuffer());if(!valid(bytes))throw new Error(`${model.name}: tamaño o SHA-256 incorrecto`);
 await writeFile(path+'.tmp',bytes);await rename(path+'.tmp',path);console.log(`${model.name}: descargado y verificado`);
}
console.log(`VOICE_MODELS_DIR=${directory}`);
