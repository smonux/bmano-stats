import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { getLanguage, tr, type Language } from '../i18n';
import { definitions, eventState, type Snapshot } from '../domain/model';
import { matchReport, type PeriodTimeline } from '../domain/report';
import { emptyStats, efficacy, labels, metrics, type Metric } from '../domain/statistics';

let fonts:Promise<string[]>|undefined;
function loadFonts() {
 return fonts??=Promise.all(['handball-sans.ttf','handball-sans-bold.ttf'].map(async name=>{
  const response=await fetch(`${import.meta.env.BASE_URL}fonts/${name}`);if(!response.ok)throw new Error('No se pudo generar el PDF.');
  const bytes=new Uint8Array(await response.arrayBuffer());let text='';
  for(let i=0;i<bytes.length;i+=8192)text+=String.fromCharCode(...bytes.subarray(i,i+8192));
  return btoa(text);
 })).catch(error=>{fonts=undefined;throw error;});
}

export async function createMatchPdf(data:Snapshot,matchId:string,language:Language=getLanguage()):Promise<File> {
 const fontData=await loadFonts(),report=matchReport(data,matchId),t=(text:string,values:Record<string,string|number>={})=>tr(text,values,language);
 const doc=new jsPDF({unit:'mm',format:'a4',compress:true});
 for(const [index,name] of ['normal','bold'].entries()){
  doc.addFileToVFS(`handball-${name}.ttf`,fontData[index]);doc.addFont(`handball-${name}.ttf`,'Handball',name);
 }
 doc.setFont('Handball');doc.setProperties({title:report.teams.map(team=>team.name).join(' - '),subject:t('Estadísticas del partido'),creator:'handballstats'});
 const ink:[number,number,number]=[23,23,23],yellow:[number,number,number]=[255,214,0];
 const margin=12,width=186,bottom=282;
 let y=0;
 const newPage=()=>{doc.addPage();y=19;};
 const room=(height:number)=>{if(y+height>bottom)newPage();};
 const title=(text:string)=>{room(25);doc.setFont('Handball','bold');doc.setFontSize(10);doc.setTextColor(...ink);doc.text(text,margin,y+5);y+=9;};
 const table=(head:string[],body:string[][],options:Record<string,unknown>={})=>{
  autoTable(doc,{startY:y,head:[head],body,margin:{left:margin,right:margin,top:19,bottom:16},
   styles:{font:'Handball',fontSize:7.1,textColor:ink,cellPadding:1.15,lineColor:[225,225,220],lineWidth:0.1,overflow:'linebreak'},
   headStyles:{fillColor:ink,textColor:[255,255,255],fontStyle:'bold'},
   alternateRowStyles:{fillColor:[248,248,243]},rowPageBreak:'avoid',...options});
  y=(doc as jsPDF&{lastAutoTable:{finalY:number}}).lastAutoTable.finalY+4;
 };
 doc.setFillColor(...yellow);doc.rect(0,0,210,3,'F');doc.setFillColor(...ink);doc.rect(0,3,210,10,'F');
 doc.setTextColor(255);doc.setFont('Handball','bold');doc.setFontSize(9);doc.text('handballstats',margin,9.5);
 doc.setTextColor(...ink);doc.setFont('Handball','normal');doc.setFontSize(8);
 doc.text(`${report.match.date}  |  ${t(report.match.status==='active'?'En curso':'Finalizado')}`,margin,21);
 doc.setFontSize(6);doc.setTextColor(90);doc.text(t('EQUIPO 1 · NOSOTROS'),margin,25);doc.text(t('EQUIPO 2 · RIVAL'),198,25,{align:'right'});doc.setTextColor(...ink);
 doc.setFont('Handball','bold');doc.setFontSize(11);
 const names=report.teams.map(team=>doc.splitTextToSize(team.name,65) as string[]);
 doc.text(names[0],margin,29);doc.text(names[1],198,29,{align:'right'});
 doc.setFontSize(28);const scoreText=report.teams.map(team=>report.stats.teams[team.id]?.goals??0).join(' : ');doc.setFontSize(Math.min(28,28*44/doc.getTextWidth(scoreText)));doc.text(scoreText,105,36,{align:'center'});
 y=Math.max(44,29+Math.max(...names.map(lines=>lines.length))*4.5);
 doc.setFont('Handball','normal');doc.setFontSize(7);doc.text(t('Generado: {date}',{date:new Date(report.generatedAt).toLocaleString(language)}),margin,y);y+=5;

 title(t('Estadísticas por equipo'));
 const metricNames:Partial<Record<Metric,string>>={shots:'Tiros',goalsReceived:'Goles recibidos',shotsReceived:'Tiros recibidos',penaltiesReceived:'Penaltis recibidos',blue:'Azules',penaltyGoals:'Goles de 7 m',penaltyMisses:'Fallos de 7 m',penaltySaves:'Paradas de 7 m'};
 const nameOf=(metric:Metric)=>t(metricNames[metric]??labels[metric]??metric);
 const totals=report.teams.map(team=>report.stats.teams[team.id]??emptyStats());
 const core:Metric[]=['goals','shots','misses','saves','goalsReceived','shotsReceived','losses','recoveries'];
 const shown=metrics.filter(metric=>core.includes(metric)||totals.some(stats=>stats[metric]));
 const pairs=shown.map(metric=>[nameOf(metric),String(totals[0][metric]),String(totals[1][metric])]);
 pairs.push([t('Eficacia de tiro'),efficacy(totals[0]),efficacy(totals[1])]);
 const middle=Math.ceil(pairs.length/2),rows=Array.from({length:middle},(_,i)=>[...pairs[i],...(pairs[i+middle]??['','',''])]);
 table([t('Estadísticas'),'1','2',t('Estadísticas'),'1','2'],rows,{columnStyles:{0:{cellWidth:64},1:{cellWidth:14,halign:'center'},2:{cellWidth:15,halign:'center'},3:{cellWidth:64},4:{cellWidth:14,halign:'center'},5:{cellWidth:15,halign:'center'}}});
 const playerCore:Metric[]=['goals','shots','misses','saves','assists','losses','recoveries','exclusions'];
 const short:Partial<Record<Metric,string>>={goals:'G',shots:'T',misses:'F',saves:'P',assists:'As',losses:'Pe',recoveries:'R',exclusions:'2m'};
 title(t('Estadísticas por jugador'));
 for(const team of report.teams){
  const players=data.players.filter(player=>player.teamId===team.id&&Object.values(report.stats.players[player.id]??{}).some(Boolean)).sort((a,b)=>Number(a.isUnknown)-Number(b.isUnknown)||(a.dorsal??0)-(b.dorsal??0));
  doc.setFont('Handball','bold');doc.setFontSize(8.5);const lines=doc.splitTextToSize(team.name,width);room(lines.length*3.5+14);doc.text(lines,margin,y+3);y+=lines.length*3.5+4;
  if(!players.length){doc.setFont('Handball','normal');doc.setFontSize(7.5);doc.text(t('Sin datos registrados'),margin,y+2);y+=7;continue;}
  const playerName=(id:string)=>{const p=data.players.find(player=>player.id===id)!;return p.isUnknown?t('Desconocido'):`#${p.dorsal} ${p.name}`.trim();};
  table([t('Jugador'),...playerCore.map(metric=>short[metric]!)],players.map(player=>[playerName(player.id),...playerCore.map(metric=>String(report.stats.players[player.id][metric]))]),{columnStyles:{0:{cellWidth:66}}});
  // Less frequent metrics are listed only when nonzero, preserving a compact table.
  const extra=metrics.filter(metric=>!playerCore.includes(metric)&&players.some(player=>report.stats.players[player.id][metric]));
  if(extra.length)table([t('Jugador'),t('Otras estadísticas')],players.flatMap(player=>{
   const stats=report.stats.players[player.id],values=extra.filter(metric=>stats[metric]).map(metric=>`${nameOf(metric)}: ${stats[metric]}`);
   return values.length?[[playerName(player.id),values.join(' · ')]]:[];
  }),{columnStyles:{0:{cellWidth:66}}});
 }
 doc.setFont('Handball','normal');doc.setFontSize(6.5);room(10);
 const legend=playerCore.map(metric=>`${short[metric]}: ${nameOf(metric)}`).join(' · ');
 const legendLines=doc.splitTextToSize(legend,width);room(legendLines.length*3+3);doc.text(legendLines,margin,y);y+=legendLines.length*3+3;

 title(t('Evolución del marcador'));
 doc.setFont('Handball','normal');doc.setFontSize(7);doc.text(t('Marcador acumulado. Cada escalón corresponde a un gol en su minuto.'),margin,y);y+=5;
 const chart=(period:PeriodTimeline,left:number,top:number)=>{
  const cw=90,ch=48,plotX=left+8,plotY=top+8,pw=cw-11,ph=ch-14;
  const maxGoals=Math.max(5,Math.ceil(Math.max(...period.end)/5)*5),x=(minute:number)=>plotX+minute/period.maxMinute*pw,py=(goals:number)=>plotY+ph-goals/maxGoals*ph;
  doc.setFont('Handball','bold');doc.setFontSize(8);doc.setTextColor(...ink);doc.text(`${t('Tiempo')} ${period.period}  (${period.start.join('-')} / ${period.end.join('-')})`,left,top+3);
  doc.setFont('Handball','normal');doc.setFontSize(6);
  for(let i=0;i<=5;i++){
   doc.setDrawColor(220);doc.setLineWidth(.15);doc.line(plotX,py(maxGoals*i/5),plotX+pw,py(maxGoals*i/5));
   doc.setTextColor(70);doc.text(String(maxGoals*i/5),plotX-2,py(maxGoals*i/5)+1,{align:'right'});
   doc.text(String(period.maxMinute*i/5),x(period.maxMinute*i/5),plotY+ph+3,{align:'center'});
  }
  doc.text(t('Goles'),left,top+6.5);doc.text(t('Minutos'),left+cw,top+ch,{align:'right'});
  period.series.forEach((points,index)=>{
   const draw=(color:[number,number,number],lineWidth:number)=>{doc.setDrawColor(...color);doc.setLineWidth(lineWidth);doc.setLineDashPattern(index?[1.4,.8]:[],0);for(let i=1;i<points.length;i++)doc.line(x(points[i-1].minute),py(points[i-1].goals),x(points[i].minute),py(points[i].goals));};
   if(!index)draw([125,105,0],.75);draw(index?ink:yellow,.4);
   doc.setLineDashPattern([],0);doc.setDrawColor(...ink);doc.setFillColor(...(index?ink:yellow));doc.setLineWidth(.15);
   for(const point of points.filter(point=>point.goal))doc.circle(x(point.minute),py(point.goals),.6,'FD');
  });
 };
 for(let i=0;i<report.periods.length;i+=2){room(58);chart(report.periods[i],margin,y);if(report.periods[i+1])chart(report.periods[i+1],margin+96,y);y+=54;}
 doc.setFontSize(7);doc.setFont('Handball','normal');room(12);
 const chartLegend=report.teams.map((team,i)=>`${i+1}: ${team.name} (${t(i?'línea negra discontinua':'línea amarilla')})`).join(' · ');
 const chartLegendLines=doc.splitTextToSize(chartLegend,width);room(chartLegendLines.length*3.3+3);doc.text(chartLegendLines,margin,y);y+=chartLegendLines.length*3.3+3;

 room(48);title(t('Eventos por tiempo'));
 doc.setFontSize(7);doc.setFont('Handball','normal');doc.text(t('Orden cronológico creciente. Los pendientes no cuentan en el marcador ni en las estadísticas.'),margin,y);y+=5;
 for(let period=1;period<=report.match.clock.period;period++){
  const events=report.events.filter(event=>event.period===period);title(`${t('Tiempo')} ${period}`);
  if(!events.length){doc.setFont('Handball','normal');doc.setFontSize(7);doc.text(t('Sin eventos registrados'),margin,y);y+=5;continue;}
  const player=(id:string|null)=>{const p=data.players.find(item=>item.id===id);return !p||p.isUnknown?t('Desconocido'):`#${p.dorsal}${p.name?' '+p.name:''}`;};
  table([t('Minuto'),t('Equipo'),t('Evento'),t('Jugadores')],events.map(event=>{
   const definition=event.type?definitions[event.type]:null;
   const kind=[definition?t(definition.label):t('Evento sin indicar'),event.metadata.penalty?'7 m':'',event.metadata.blue?t('Tarjeta azul'):'',event.metadata.infraction?t(event.metadata.infraction):'',eventState(event,report.match,data.players)==='pending'?t('Pendiente'):''].filter(Boolean).join(' · ');
   const participants=event.type==='passive'?'':(event.type==='substitution'?`${t('Sale')}: `:'')+player(event.primaryPlayerId)+(event.relatedPlayerId&&definition?.related?` / ${t(definition.related)}: ${player(event.relatedPlayerId)}`:'');
   const team=report.teams.findIndex(team=>team.id===event.teamId);
   return [String(event.minute),team<0?t('Sin equipo'):String(team+1),kind,participants];
  }),{columnStyles:{0:{cellWidth:13},1:{cellWidth:15},2:{cellWidth:47},3:{cellWidth:111}},styles:{font:'Handball',fontSize:7,cellPadding:1,lineWidth:.1,lineColor:[225,225,220],textColor:ink,overflow:'linebreak'},didDrawPage:({pageNumber}:{pageNumber:number})=>{
   if(pageNumber>1){doc.setFont('Handball','bold');doc.setFontSize(8);doc.text(`${t('Eventos por tiempo')} - ${t('Tiempo')} ${period}`,margin,13);}
  }});
 }
 for(let page=1;page<=doc.getNumberOfPages();page++){
  doc.setPage(page);doc.setFont('Handball','normal');doc.setFontSize(6.5);doc.setTextColor(100);doc.setDrawColor(210);doc.setLineWidth(.15);doc.line(margin,286,198,286);
  doc.text('handballstats',margin,290);doc.text(`${page} / ${doc.getNumberOfPages()}`,198,290,{align:'right'});
 }
 const name=`handball-stats-${report.match.date}-${report.teams.map(team=>team.name).join('-')}`.replace(/[^\p{L}\p{N}_-]/gu,'-').slice(0,180);
 return new File([doc.output('arraybuffer')],`${name}.pdf`,{type:'application/pdf'});
}
