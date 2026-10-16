import { beforeEach, expect, test, vi } from 'vitest';
import { languages } from '../i18n';
const mocks=vi.hoisted(()=>({transcribe:vi.fn(async(_audio:unknown,_options:unknown)=>({text:'test'})),complete:vi.fn(async(_text:string,_options:unknown)=>({success:true,function_calls:[],suppressed_calls:[],confidence:0})),createNeedle:vi.fn(),createWhistle:vi.fn()}));
vi.mock('cactus-needle/browser',()=>({createNeedle:mocks.createNeedle,createWhistle:mocks.createWhistle}));
import { VoiceEngine } from './engine';
beforeEach(()=>{vi.clearAllMocks();mocks.createWhistle.mockResolvedValue({transcribe:mocks.transcribe,close:async()=>{}});mocks.createNeedle.mockResolvedValue({complete:mocks.complete,close:async()=>{}});});
test('all supported speech languages reach Whistle and Needle without changing canonical event schema',async()=>{
 for(const code of Object.keys(languages) as (keyof typeof languages)[]) {
  const engine=new VoiceEngine(code);await engine.prepare(()=>{});await engine.transcribe(new Float32Array(100),16000,['example']);await engine.interpret('example',['La Jota','Rival']);
  expect(mocks.transcribe.mock.lastCall?.[1]).toMatchObject({language:code,keywords:['example']});
  expect(mocks.createNeedle.mock.lastCall?.[0].system).toContain(`spoken in ${code}`);
  expect(mocks.createNeedle.mock.lastCall?.[0].system).toContain('NEVER home/away');
  expect(mocks.complete.mock.lastCall?.[1]).toMatchObject({tools:{registrar_jugada:{inputSchema:{properties:{evento:{enum:expect.arrayContaining(['gol'])}}}}}});
  await engine.close();
 }
});
