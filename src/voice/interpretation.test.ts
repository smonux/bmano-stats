import { expect, test } from 'vitest';
import { captureContext, resolveTeam, resolveDorsal, toVoiceDraft, type CaptureContext } from './interpretation';
import type { Snapshot, Match } from '../domain/model';
const base={createdAt:1,updatedAt:1,deletedAt:null};
const match:Match={...base,id:'m',localTeamId:'a',visitorTeamId:'b',date:'2026-10-16',status:'active',clock:{period:2,elapsedMs:180000,startedAt:null}};
const data:Snapshot={teams:[{...base,id:'a',name:'Águilas',nameKey:'águilas'},{...base,id:'b',name:'Leones',nameKey:'leones'}],matches:[match],events:[],players:[{...base,id:'p',teamId:'a',name:'Ana',dorsal:9,isUnknown:false},{...base,id:'q',teamId:'b',name:'Ana',dorsal:12,isUnknown:false}]};
const context:CaptureContext=captureContext(match,data);
const proposal={evento:'gol',equipo:'nuestro',nombre:'Ana',nombre_relacionado:'',penalti:false,azul:false,infraccion:''};
test('speaker perspective always assigns our team to team 1, independent of venue',()=>{
 const ours=toVoiceDraft('gol nuestro, Ana',proposal,context);
 expect(ours.draft).toMatchObject({type:'goal',teamId:'a',primaryDorsal:'9',rawText:'gol nuestro, Ana',period:2,minute:3});
 for(const word of ['nuestro','nuestra','nuestros','nuestras','nosotros','nosotras','mi equipo','equipo1']) expect(resolveTeam(word,context)).toBe('a');
 for(const word of ['ellos','ellas','rival','contrario','suyo','suya','suyos','suyas','su equipo','equipo2']) expect(resolveTeam(word,context)).toBe('b');
 for(const word of ['local','visitante','','desconocido']) expect(resolveTeam(word,context)).toBeNull();
 expect(toVoiceDraft('gol nuestro, Marta',{...proposal,nombre:'Marta'},context).draft.primaryDorsal).toBe('');
 const reversed={...context,match:{...match,localTeamId:'b',visitorTeamId:'a'}};
 expect(toVoiceDraft('gol nuestro, Ana',proposal,reversed).draft).toMatchObject({teamId:'b',primaryDorsal:'12'});
});
test('names are resolved within the correct team; dorsal 0 is valid; duplicate names are ambiguous',()=>{
 expect(resolveDorsal('ana','b',data)).toBe('12');expect(resolveDorsal('dorsal 0','a',data)).toBe('0');
 expect(resolveDorsal('100','a',data)).toBe('');expect(resolveDorsal('An','a',data)).toBe('');
 const duplicate={...data,players:[...data.players,{...data.players[0],id:'p2',dorsal:10}]};expect(resolveDorsal('Ana','a',duplicate)).toBe('');
});
test('related players follow event roles; incompatible fields are dropped',()=>{
 const goal=toVoiceDraft('gol de Águilas', {...proposal,equipo:'Águilas',nombre_relacionado:'Ana',azul:true},context).draft;expect(goal.relatedDorsal).toBe('9');expect(goal.metadata).toEqual({});
 const save=toVoiceDraft('parada nuestra',{...proposal,evento:'parada',equipo:'nuestro',nombre_relacionado:'Ana',penalti:true},context).draft;expect(save.relatedDorsal).toBe('12');expect(save.metadata).toEqual({penalty:true});
 const passive=toVoiceDraft('pasivo rival',{...proposal,evento:'pasivo',equipo:'rival',penalti:true},context).draft;expect(passive).toMatchObject({teamId:'b',primaryDorsal:'',relatedDorsal:'',metadata:{}});
});
test('invalid or withheld interpretation preserves a pending draft',()=>{
 for(const result of [null,{}, {...proposal,evento:'inventado'}, {...proposal,equipo:5}]) expect(toVoiceDraft('literal',result,context).draft).toMatchObject({type:null,teamId:null,rawText:'literal'});
});

test('multiple, ungrounded and negated calls remain pending; one withheld candidate requires visible review', async()=>{
 const {selectProposal}=await import('./interpretation');
 const accepted={success:true,function_calls:[{name:'registrar_jugada',arguments:proposal}],suppressed_calls:[],confidence:0.8};
 expect(selectProposal(accepted).proposal).toEqual(proposal);
 const withheld=selectProposal({...accepted,function_calls:[],suppressed_calls:accepted.function_calls});expect(withheld.proposal).toEqual(proposal);expect(withheld.warnings.join(' ')).toContain('incertidumbre');
 expect(selectProposal({...accepted,confidence:0.1}).warnings.join(' ')).toContain('confianza baja');
 for(const change of [{success:false},{function_calls:[]},{suppressed_calls:accepted.function_calls},{function_calls:[...accepted.function_calls,...accepted.function_calls]},{validation:{ungrounded:['equipo']}},{validation:{negation:true}}]) expect(selectProposal({...accepted,...change}).proposal).toBeNull();
});
