import { beforeEach, expect, test, vi } from 'vitest';
import { languages } from '../i18n';
const mocks=vi.hoisted(()=>({transcribe:vi.fn(async(_audio:unknown,_options:unknown)=>({text:'test'})),complete:vi.fn(async(_text:string,_options:unknown)=>({success:true,function_calls:[],suppressed_calls:[],confidence:0})),createNeedle:vi.fn(),createWhistle:vi.fn()}));
vi.mock('cactus-needle/browser',()=>({createNeedle:mocks.createNeedle,createWhistle:mocks.createWhistle}));
import { VoiceEngine } from './engine';
import { NEEDLE_DEPTHS, needleModel } from './models';
beforeEach(()=>{vi.clearAllMocks();mocks.createWhistle.mockResolvedValue({transcribe:mocks.transcribe,close:async()=>{}});mocks.createNeedle.mockResolvedValue({complete:mocks.complete,close:async()=>{}});});
test('the chosen weights and hash reach Needle, while Whistle keeps its existing options',async()=>{
 for(const depth of NEEDLE_DEPTHS){
  const engine=new VoiceEngine('es',depth);await engine.prepare(()=>{},true);
  expect(mocks.createNeedle.mock.lastCall?.[0]).toMatchObject({model:needleModel(depth).url,modelSha256:needleModel(depth).sha256,offline:true});
  expect(mocks.createWhistle.mock.lastCall?.[0]).toMatchObject({offline:true});
  expect(mocks.createWhistle.mock.lastCall?.[0]).not.toHaveProperty('model');
  expect(mocks.createWhistle.mock.lastCall?.[0]).not.toHaveProperty('modelSha256');await engine.close();
 }
});
test('all supported speech languages reach Whistle and Needle without changing canonical event schema',async()=>{
 for(const code of Object.keys(languages) as (keyof typeof languages)[]) {
  const engine=new VoiceEngine(code);await engine.prepare(()=>{});await engine.transcribe(new Float32Array(100),16000,['example']);await engine.interpret('example',['La Jota','Rival']);
  expect(mocks.transcribe.mock.lastCall?.[1]).toMatchObject({language:code,keywords:['example']});
  expect(mocks.createNeedle.mock.lastCall?.[0].system).toContain(`locale:${code}`);
  expect(mocks.createNeedle.mock.lastCall?.[0].system).toContain('NEVER home/away');
  expect(mocks.complete.mock.lastCall?.[1]).toMatchObject({tools:{registrar_jugada:{inputSchema:{properties:{evento:{enum:expect.arrayContaining(['gol'])}}}}}});
  await engine.close();
 }
});

test('specific play tools are normalized back to the stable reviewed proposal without execution',async()=>{
 mocks.complete.mockResolvedValueOnce({success:true,function_calls:[{name:'gol',arguments:{equipo:'nuestro',dorsal:7}}],suppressed_calls:[],confidence:0.8} as never);
 const engine=new VoiceEngine('es');await engine.prepare(()=>{});const result=await engine.interpret('Gol nuestro, dorsal siete.',['La Jota','Rival']);
 expect(mocks.complete.mock.lastCall?.[0]).toBe('Gol nuestro, dorsal 7.');expect(mocks.complete.mock.lastCall?.[1]).toMatchObject({maxNewTokens:128,tools:{gol:{inputSchema:{properties:{dorsal:{type:'integer'}}}}}});
 expect(result.proposal).toMatchObject({evento:'gol',equipo:'equipo1',dorsal:7});expect(result.warnings.join(' ')).toContain('revisa');expect(result.timing.schemaCharacters).toBeLessThan(450);await engine.close();
});
