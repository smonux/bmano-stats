import { beforeEach, afterEach, expect, test, vi } from 'vitest';
const mocks=vi.hoisted(()=>({present:vi.fn(),created:vi.fn(),engine:{ready:false,prepare:vi.fn(),close:vi.fn()}}));
vi.mock('./readiness',()=>({localModelsPresent:mocks.present}));
vi.mock('./engine',()=>({VoiceEngine:vi.fn(function(...args:unknown[]){mocks.created(...args);return mocks.engine;}),voiceError:(e:unknown)=>(e as Error).message}));
beforeEach(()=>{
 vi.resetModules();vi.clearAllMocks();mocks.present.mockResolvedValue(true);mocks.engine.ready=false;mocks.engine.prepare.mockImplementation(async()=>{mocks.engine.ready=true;});mocks.engine.close.mockImplementation(async()=>{mocks.engine.ready=false;});
 const store=new Map<string,string>();vi.stubGlobal('localStorage',{getItem:(key:string)=>store.get(key)??null,setItem:(key:string,value:string)=>store.set(key,value)});
});
afterEach(()=>vi.unstubAllGlobals());
test('requires an explicit language and never loads models before it is selected',async()=>{
 const setup=await import('./setup');expect(await setup.prepareVoice(true)).toBe(false);expect(mocks.engine.prepare).not.toHaveBeenCalled();expect(setup.voiceState().languageChosen).toBe(false);
});
test('pre-match setup loads once; changing language reloads local files in offline mode',async()=>{
 const setup=await import('./setup');await setup.chooseVoiceLanguage('es');expect(await setup.prepareVoice(true)).toBe(true);expect(mocks.engine.prepare.mock.lastCall?.[1]).toBe(false);
 await setup.prepareVoice(true);expect(mocks.engine.prepare).toHaveBeenCalledTimes(1);
 await setup.chooseVoiceLanguage('pl');expect(mocks.engine.close).toHaveBeenCalledTimes(1);expect(setup.voiceState()).toMatchObject({phase:'cached',language:'pl',languageChosen:true});
 expect(await setup.prepareVoice(false)).toBe(true);expect(mocks.engine.prepare.mock.lastCall?.[1]).toBe(true);
});
test('refuses ready status if model files were not actually persisted',async()=>{
 const setup=await import('./setup');await setup.chooseVoiceLanguage('en');mocks.present.mockResolvedValue(false);
 expect(await setup.prepareVoice(true)).toBe(false);expect(setup.voiceState().phase).toBe('error');expect(mocks.engine.close).toHaveBeenCalled();expect(()=>setup.preparedEngine()).toThrow();
});
test('one saved Needle selection defaults to 12 and invalidates readiness until the selected file is available',async()=>{
 const setup=await import('./setup');expect(setup.voiceState().needleDepth).toBe(12);
 await setup.chooseVoiceLanguage('es');await setup.prepareVoice(true);expect(mocks.created).toHaveBeenLastCalledWith('es',12);
 mocks.present.mockImplementation(async(depth:number)=>depth===12);
 await setup.chooseNeedleDepth(8);expect(localStorage.getItem('handball-needle-depth')).toBe('8');
 expect(setup.voiceState()).toMatchObject({needleDepth:8,phase:'missing'});expect(()=>setup.preparedEngine()).toThrow();
 mocks.present.mockResolvedValue(true);await setup.prepareVoice(true);expect(mocks.created).toHaveBeenLastCalledWith('es',8);
 await setup.chooseNeedleDepth(12);expect(setup.voiceState()).toMatchObject({needleDepth:12,phase:'cached'});
 await setup.prepareVoice(false);expect(mocks.created).toHaveBeenLastCalledWith('es',12);expect(mocks.engine.prepare.mock.lastCall?.[1]).toBe(true);
});
