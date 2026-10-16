import { expect, test } from 'vitest';
import { matchReport } from './report';
import type { GameEvent, Snapshot } from './model';
const base={createdAt:1,updatedAt:1,deletedAt:null};
const event=(id:string,period:number,minute:number,teamId='a',extra:Partial<GameEvent>={}):GameEvent=>({...base,id,matchId:'m',schemaVersion:1,type:'goal',teamId,primaryPlayerId:null,relatedPlayerId:null,orderKey:Number(id),period,minute,metadata:{},rawText:'',note:'',...extra});
const data:Snapshot={teams:[{...base,id:'a',name:'A',nameKey:'a'},{...base,id:'b',name:'B',nameKey:'b'}],players:[],matches:[{...base,id:'m',localTeamId:'a',visitorTeamId:'b',date:'2026-10-16',status:'active',clock:{period:2,elapsedMs:240000,startedAt:null}}],events:[event('4',2,3),event('2',1,2,'b'),event('3',1,2),event('1',1,0),event('5',2,1,'a',{type:null}),event('6',1,4,'a',{deletedAt:2})]};
test('reports sort periods and ties chronologically without changing the app event array',()=>{
 const report=matchReport(data,'m');expect(report.events.map(e=>e.id)).toEqual(['1','2','3','5','4']);
 expect(data.events[0].id).toBe('4');expect(report.stats.teams.a.goals).toBe(3);expect(report.stats.teams.b.goals).toBe(1);
});
test('each goal changes the cumulative score exactly at its own minute, including minute zero',()=>{
 const report=matchReport(data,'m');const [first,second]=report.periods;
 expect(first.start).toEqual([0,0]);expect(first.end).toEqual([2,1]);expect(second.start).toEqual([2,1]);expect(second.end).toEqual([3,1]);
 expect(first.series[0].filter(p=>p.goal)).toEqual([{minute:0,goals:1,goal:true},{minute:2,goals:2,goal:true}]);
 expect(second.series[0].filter(p=>p.goal)).toEqual([{minute:3,goals:3,goal:true}]);expect(second.maxMinute).toBe(5);
 expect(report.periods.flatMap(p=>p.series.flat()).filter(p=>p.goal)).toHaveLength(4);
});
