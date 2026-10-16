// Run against Vite dev server. Real pinned model weights; no mocked inference.
import {chromium,firefox} from 'playwright-core';
import {DEFAULT_MODEL,DEFAULT_SPEECH_MODEL} from 'cactus-needle';
import {resolve} from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
const engine=process.env.BENCH_BROWSER==='firefox'?firefox:chromium;
const executablePath=process.env.BENCH_BROWSER==='firefox'?process.env.FIREFOX_PATH:process.env.CHROMIUM_PATH;
const browser=await engine.launch({executablePath,headless:true,args:engine===chromium?['--no-sandbox']:[]});
const output=resolve(process.env.BENCH_OUTPUT??'test-results/needle-benchmark.json');
const results=[];browser.on('disconnected',()=>console.error('BENCH browser disconnected'));
try {
 const context=await browser.newContext();
 for(const model of [DEFAULT_MODEL,DEFAULT_SPEECH_MODEL])await context.route(model.url,route=>route.fulfill({path:resolve(process.env.VOICE_MODELS_DIR??'node_modules/.cache/voice-models',`${model.name}.cact`),contentType:'application/octet-stream',headers:{'access-control-allow-origin':'*'}}));
 const page=await context.newPage();page.on('crash',()=>console.error('BENCH page crashed'));page.on('pageerror',error=>console.error('BENCH page error',error.message));await page.addInitScript(()=>{localStorage.setItem('handball-language','es');localStorage.setItem('handball-welcome-v1','done');});
 const base=process.env.BENCH_URL??'http://127.0.0.1:5173';await context.route(base+'/__needle-benchmark',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html><head></head><body>Needle benchmark</body></html>'}));await page.goto(base+'/__needle-benchmark');console.log('BENCH page ready');
 const texts=process.env.BENCH_TEXT?[process.env.BENCH_TEXT]:['Gol nuestro, dorsal siete.','Parada rival, portero uno, lanzamiento nuestro del nueve.'];
 const variants=(process.env.BENCH_VARIANTS??'current,compact,staged').split(',');
 for(const text of texts)for(const variant of variants){
  console.log('BENCH starting',variant,text);const result=await page.evaluate(async({variant,text})=>{const {benchmark}=await import('/scripts/benchmark-needle.ts');return benchmark(variant,text);},{variant,text}).catch(error=>({variant,text,error:error.message}));
  results.push(result);await mkdir(resolve(output,'..'),{recursive:true});await writeFile(output,JSON.stringify({browser:process.env.BENCH_BROWSER??'chromium',date:new Date().toISOString(),results},null,2));
  console.log(JSON.stringify(result));
 }
}finally{await browser.close();}
