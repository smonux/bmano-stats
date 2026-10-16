import 'fake-indexeddb/auto';
import { afterEach, beforeEach, expect, test } from 'vitest';
import { HandballDatabase, repository, type EventDraft } from './database';
import { changeClock, elapsed, eventState, unknownId, type Match } from '../domain/model';
import { calculate, efficacy, emptyStats } from '../domain/statistics';
let db: HandballDatabase, repo: ReturnType<typeof repository>, match: Match;
beforeEach(async () => { db = new HandballDatabase(crypto.randomUUID()); repo = repository(db); match = await repo.createMatch({name:'Local'}, {name:'Visitante'}, '2026-10-15'); });
afterEach(async () => { await db.delete(); });
const draft = (type: EventDraft['type'], extra: Partial<EventDraft> = {}): EventDraft => ({matchId:match.id,type,teamId:match.localTeamId,period:1,minute:0,metadata:{},primaryDorsal:'',relatedDorsal:'',note:'',rawText:'',...extra});
const stats = async () => {const s=await db.snapshot(); return calculate(s.matches,s.events,s.players);};
test('unknown goal counts once; correction moves attribution; deletion removes consequences', async () => {
 const e=await repo.saveEvent(draft('goal')); expect((await stats()).players[unknownId(match.localTeamId)].goals).toBe(1);
 await repo.saveEvent(draft('goal',{id:e.id,expectedUpdatedAt:e.updatedAt,primaryDorsal:'7',relatedDorsal:'9'}));
 const s=await stats(); expect(s.teams[match.localTeamId].goals).toBe(1); expect(s.players[unknownId(match.localTeamId)]).toBeUndefined();
 expect(Object.values(s.players).reduce((n,p)=>n+p.assists,0)).toBe(1); expect(await db.events.count()).toBe(1);
 await repo.deleteEvent(e.id); expect((await stats()).teams).toEqual({});
});
test('save and recovery derive opposite consequences without extra events', async () => {
 await repo.saveEvent(draft('save',{primaryDorsal:'1',relatedDorsal:'8',metadata:{penalty:true}}));
 await repo.saveEvent(draft('recovery')); await repo.saveEvent(draft('loss'));
 const s=await stats(); expect(s.teams[match.localTeamId]).toMatchObject({saves:1,recoveries:1,losses:1,penaltySaves:1});
 expect(s.teams[match.visitorTeamId]).toMatchObject({shots:1,misses:1,losses:1,recoveries:0,penaltyMisses:1}); expect(await db.events.count()).toBe(3);
});
test('pending events do not count; passive has no individual; infraction requires subtype', async () => {
 const e=await repo.saveEvent(draft('goal',{teamId:null})); expect(eventState(e,match,[])).toBe('pending');
 await repo.saveEvent(draft('infraction')); await repo.saveEvent(draft(null)); expect((await stats()).teams).toEqual({});
 await repo.saveEvent(draft('passive')); expect((await stats()).players).toEqual({}); expect((await stats()).teams[match.localTeamId]).toMatchObject({passives:1,losses:0});
 await repo.saveEvent(draft('infraction',{metadata:{infraction:'Pasos'}})); expect((await stats()).teams[match.localTeamId]).toMatchObject({losses:1,infractions:1,Pasos:1});
});
test('disciplinary and penalty events count without inventing assists or provocateurs', async () => {
 for (const type of ['penalty','exclusion','yellow','disqualification'] as const) await repo.saveEvent(draft(type,{metadata:{blue:true}}));
 const s=await stats(); expect(s.teams[match.localTeamId]).toMatchObject({penalties:1,exclusions:1,yellow:1,disqualifications:1,blue:1});
 expect(s.players[unknownId(match.localTeamId)].forcedExclusions).toBe(0); expect(s.teams[match.visitorTeamId].penaltiesReceived).toBe(1);
});
test('clock pauses, resumes, supports extra periods and stays stopped after finish', () => {
 const m={...match,clock:{period:1,elapsedMs:0,startedAt:1000}};
 const paused=changeClock(m,'pause',61000); expect(elapsed(paused.clock,90000)).toBe(60000);
 const resumed=changeClock(paused,'resume',90000); expect(elapsed(resumed.clock,120000)).toBe(90000);
 let next=changeClock(resumed,'period',120000); next=changeClock(next,'period',130000); expect(next.clock.period).toBe(3);
 const done=changeClock(next,'finish',140000); expect(done.clock.startedAt).toBeNull(); expect(()=>changeClock(done,'resume')).toThrow(); expect(efficacy(emptyStats())).toBe('—');
});
test('invalid writes roll back automatic teams and players', async () => {
 await expect(repo.createMatch({name:'Duplicado'},{name:'Duplicado'},'2026-10-15')).rejects.toThrow(); expect(await db.teams.count()).toBe(2);
 await expect(repo.saveEvent(draft('goal',{primaryDorsal:'6',minute:-1}))).rejects.toThrow(); expect(await db.players.count()).toBe(2);
});
test('concurrent dorsal reuse and stale edits are safe', async () => {
 const [a]=await Promise.all([repo.saveEvent(draft('goal',{primaryDorsal:'7'})),repo.saveEvent(draft('miss',{primaryDorsal:'7'}))]); expect(await db.players.count()).toBe(3);
 await repo.saveEvent(draft('goal',{id:a.id,expectedUpdatedAt:a.updatedAt,primaryDorsal:'7',minute:1}));
 await expect(repo.saveEvent(draft('goal',{id:a.id,expectedUpdatedAt:a.updatedAt}))).rejects.toThrow('otra ventana');
});
test('backup roundtrip retains pending events; corrupt import leaves data intact', async () => {
 await repo.saveEvent(draft(null)); await repo.saveEvent(draft('goal')); const backup=await repo.exportBackup();
 await repo.importBackup(JSON.parse(JSON.stringify(backup))); expect(await db.snapshot()).toEqual({teams:backup.teams,players:backup.players,matches:backup.matches,events:backup.events});
 const invalid=structuredClone(backup); invalid.events[0].matchId='missing'; await expect(repo.importBackup(invalid)).rejects.toThrow(); expect(await db.events.count()).toBe(2);
 await repo.deleteMatch(match.id); expect((await stats()).teams).toEqual({});
});
