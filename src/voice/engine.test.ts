import { beforeEach, expect, test, vi } from 'vitest';
import { languages } from '../i18n';
const mocks=vi.hoisted(()=>({transcribe:vi.fn(async(_audio:unknown,_options:unknown)=>({text:'test'})),close:vi.fn(),createWhistle:vi.fn(),createNeedle:vi.fn()}));
vi.mock('cactus-needle/browser',()=>({createWhistle:mocks.createWhistle,createNeedle:mocks.createNeedle}));
import { VoiceEngine } from './engine';
beforeEach(()=>{vi.clearAllMocks();mocks.createWhistle.mockResolvedValue({transcribe:mocks.transcribe,close:mocks.close});});
test('preparation loads only unchanged Whistle; interpretation needs no model session',async()=>{
 const engine=new VoiceEngine('es');
 expect((await engine.interpret('Gol nuestro, dorsal siete.',['La Jota','Rival'])).proposal).toEqual({evento:'gol',equipo:'equipo1',dorsal:7});
 expect(mocks.createNeedle).not.toHaveBeenCalled();expect(mocks.createWhistle).not.toHaveBeenCalled();
 await engine.prepare(()=>{},true);expect(engine.ready).toBe(true);
 expect(mocks.createWhistle.mock.lastCall?.[0]).toMatchObject({offline:true});
 expect(mocks.createWhistle.mock.lastCall?.[0]).not.toHaveProperty('model');expect(mocks.createWhistle.mock.lastCall?.[0]).not.toHaveProperty('modelSha256');
 await engine.close();expect(engine.ready).toBe(false);expect(mocks.close).toHaveBeenCalledTimes(1);expect(mocks.createNeedle).not.toHaveBeenCalled();
});
test('all seven languages still reach Whistle unchanged',async()=>{
 for(const language of Object.keys(languages) as (keyof typeof languages)[]){
  const engine=new VoiceEngine(language);await engine.prepare(()=>{});await engine.transcribe(new Float32Array(100),16000,['example']);
  expect(mocks.transcribe.mock.lastCall?.[1]).toMatchObject({language,keywords:['example']});await engine.close();
 }
 expect(mocks.createNeedle).not.toHaveBeenCalled();
});
test('rule extraction reports its duration and preserves literal roster names',async()=>{
 const engine=new VoiceEngine('es');const result=await engine.interpret('Gol nuestro, ana maría.',['La Jota','Rival'],[{name:'Ana María',team:'equipo1'}]);
 expect(result.proposal).toEqual({evento:'gol',equipo:'equipo1',nombre:'ana maría'});expect(result.timing.method).toBe('deterministic');expect(result.timing.elapsedMs).toBeGreaterThanOrEqual(0);expect(result.warnings.join(' ')).toContain('revisa');
});
