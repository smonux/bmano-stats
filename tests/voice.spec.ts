import { test, expect } from '@playwright/test';
import { resolve } from 'node:path';
import { DEFAULT_MODEL, DEFAULT_SPEECH_MODEL } from 'cactus-needle';
const models=process.env.VOICE_MODELS_DIR;
test.beforeEach(async({page})=>{await page.addInitScript(()=>{localStorage.setItem('handball-language','es');localStorage.setItem('handball-welcome-v1','done');});});
test('real Whistle and Needle: microphone to reviewed event, then reload offline',async({page,context},testInfo)=>{
 test.skip(!models,'Set VOICE_MODELS_DIR to a folder containing the pinned needle3.cact and whistle.cact models.');
 test.setTimeout(180000);
 await page.addInitScript(()=>{
  const original=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
  const tracked=window as unknown as {voiceTestTracks:MediaStreamTrack[]};tracked.voiceTestTracks=[];
  navigator.mediaDevices.getUserMedia=async options=>{const stream=await original(options);tracked.voiceTestTracks.push(...stream.getTracks());return stream;};
 });
 let modelRequests=0;
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 // Serve real pinned files locally to avoid CDN/network variability; the SDK checks their hashes.
 for(const model of [DEFAULT_MODEL,DEFAULT_SPEECH_MODEL]) await context.route(model.url,route=>{modelRequests++;return route.fulfill({path:resolve(models!,`${model.name}.cact`),contentType:'application/octet-stream',headers:{'access-control-allow-origin':'*'}});});
 await page.goto('/');await page.getByRole('button',{name:/Nuevo partido/}).click();
 for(const label of ['Equipo 1 (nuestro)','Equipo 2 (rival)']){await page.getByRole('group',{name:label,exact:true}).getByRole('button',{name:'Nuevo',exact:true}).click();await page.getByLabel(label,{exact:true}).fill(label==='Equipo 1 (nuestro)'?'Águilas':'Leones');}
 await page.getByRole('button',{name:'Iniciar partido'}).click();await page.getByRole('button',{name:'Voz',exact:true}).click();
 await page.getByRole('button',{name:'Preparar voz local'}).click();
 await expect(page.getByRole('button',{name:'Grabar con un toque'})).toBeVisible({timeout:60000});
 await page.getByRole('button',{name:'Grabar con un toque'}).click();await expect(page.getByRole('button',{name:'Terminar grabación'})).toBeVisible();
 // Record one complete, synthetic Spanish utterance from Chromium's fake microphone.
 await page.waitForTimeout(6500);await page.getByRole('button',{name:'Terminar grabación'}).click();
 await page.getByRole('button',{name:'Evento manual',exact:true}).click();
 await expect(page.getByRole('dialog')).toHaveCount(1);
 await expect(page.getByText('Propuesta lista. Termina la edición manual para revisarla.')).toBeVisible({timeout:60000});
 await page.getByRole('dialog').getByRole('button',{name:'Cancelar',exact:true}).click();
 const editor=page.getByRole('dialog',{name:'Nuevo evento'});await expect(editor).toBeVisible({timeout:10000});
 await expect(editor.getByText(/Transcripción original/)).toBeVisible();
 await testInfo.attach('propuesta-real.json',{body:JSON.stringify({transcripcion:await page.locator('.voice-transcript').first().textContent(),tipo:await editor.getByLabel('Evento',{exact:true}).inputValue(),equipo:await editor.getByLabel('Equipo',{exact:true}).inputValue(),dorsal:await editor.getByLabel('Dorsal principal',{exact:true}).inputValue()}),contentType:'application/json'});
 // Recognition is a proposal: explicitly review/correct it before committing.
 await editor.getByLabel('Evento',{exact:true}).selectOption('goal');
 await editor.getByLabel('Equipo',{exact:true}).selectOption({label:'Águilas'});
 await editor.getByLabel('Dorsal principal',{exact:true}).fill('7');
 await expect(page.getByLabel('Marcador 0 a 0')).toBeVisible();
 await page.screenshot({path:testInfo.outputPath('voz-revision.png'),fullPage:true});
 await editor.getByRole('button',{name:'Guardar evento',exact:true}).click();await expect(page.getByLabel('Marcador 1 a 0')).toBeVisible();
 await page.evaluate(async()=>{await navigator.serviceWorker.ready;});await page.reload();await page.waitForFunction(()=>navigator.serviceWorker.controller!==null);
 const downloads=modelRequests;await context.setOffline(true);await page.reload();await page.getByRole('button',{name:'Voz',exact:true}).click();await page.getByRole('button',{name:'Preparar voz local'}).click();await expect(page.getByRole('button',{name:'Grabar con un toque'})).toBeVisible({timeout:30000});
 const hold=page.getByRole('button',{name:'Mantén pulsado para hablar'});await hold.hover();await page.mouse.down();await expect(page.getByRole('button',{name:'Terminar grabación'})).toBeVisible();await page.waitForTimeout(6500);await page.mouse.up();await expect(editor).toBeVisible({timeout:40000});await expect(editor.getByText(/Transcripción original/)).toBeVisible();
 await editor.getByRole('button',{name:'Cancelar',exact:true}).click();await expect(page.getByLabel('Marcador 1 a 0')).toBeVisible();
 expect(modelRequests).toBe(downloads);
 expect(await page.evaluate(()=>{const tracks=(window as unknown as {voiceTestTracks:MediaStreamTrack[]}).voiceTestTracks;return tracks.length>0&&tracks.every(t=>t.readyState==='ended');})).toBe(true);
 await page.evaluate(()=>{navigator.mediaDevices.getUserMedia=async()=>{throw new DOMException('Denied by test','NotAllowedError');};});
 await page.getByRole('button',{name:'Grabar con un toque'}).click();await expect(page.getByRole('alert')).toContainText('No hay permiso para el micrófono');
 expect(errors).toEqual([]);
});
