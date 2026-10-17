import { expect,test } from 'vitest';
import type { Language } from '../i18n';
import { interpretDeterministically as parse } from './deterministic';
import { spokenEvents } from './lexicon';
import { parseSpokenNumber,spokenNumber } from './numbers';
const utterances:Record<Language,string[]>={
 es:['Gol nuestro dorsal 21','Parada nuestra dorsal 21','Fallo nuestro dorsal 21','Pérdida nuestra dorsal 21','Recuperación nuestra dorsal 21','Penalti cometido por nuestro dorsal 21','Exclusión nuestra dorsal 21','Amarilla nuestra dorsal 21','Descalificación nuestra dorsal 21','Pasivo nuestro','Pasos de nuestro dorsal 21'],
 en:['Our goal number 21','Our save number 21','Our missed shot number 21','Our turnover number 21','Our recovery number 21','Our conceded penalty number 21','Our suspension number 21','Our yellow card number 21','Our red card number 21','Our passive play','Our steps number 21'],
 de:['Tor für uns Nummer 21','Parade für uns Nummer 21','Fehlwurf für uns Nummer 21','Ballverlust für uns Nummer 21','Ballgewinn für uns Nummer 21','Siebenmeter gegen uns Nummer 21','Zeitstrafe für uns Nummer 21','Gelbe Karte für uns Nummer 21','Rote Karte für uns Nummer 21','Passives Spiel für uns','Schritte für uns Nummer 21'],
 fr:['But pour nous numéro 21','Arrêt pour nous numéro 21','Tir raté pour nous numéro 21','Perte de balle pour nous numéro 21','Récupération pour nous numéro 21','Penalty commis par nous numéro 21','Exclusion pour nous numéro 21','Carton jaune pour nous numéro 21','Carton rouge pour nous numéro 21','Jeu passif pour nous','Marcher pour nous numéro 21'],
 it:['Gol nostro numero 21','Parata nostra numero 21','Tiro sbagliato nostro numero 21','Palla persa nostra numero 21','Recupero nostro numero 21','Rigore commesso da noi numero 21','Esclusione nostra numero 21','Cartellino giallo nostro numero 21','Cartellino rosso nostro numero 21','Gioco passivo nostro','Passi nostri numero 21'],
 nl:['Doelpunt voor ons rugnummer 21','Redding voor ons rugnummer 21','Misser voor ons rugnummer 21','Balverlies voor ons rugnummer 21','Balwinst voor ons rugnummer 21','Onze speler veroorzaakt een strafworp rugnummer 21','Tijdstraf voor ons rugnummer 21','Gele kaart voor ons rugnummer 21','Rode kaart voor ons rugnummer 21','Passief spel voor ons','Loopfout voor ons rugnummer 21'],
 pl:['Nasza bramka numer 21','Nasza obrona numer 21','Nasz niecelny rzut numer 21','Nasza strata numer 21','Nasz przechwyt numer 21','Nasz karny numer 21','Nasze wykluczenie numer 21','Nasza żółta kartka numer 21','Nasza czerwona kartka numer 21','Nasza pasywna gra','Nasze kroki numer 21'],
};
const teams=['La Jota','Águilas'];
for(const language of Object.keys(utterances) as Language[]){
 test(`${language}: all 11 events and recorder perspective`,()=>{
  utterances[language].forEach((text,index)=>{
   const result=parse(text,language,teams).proposal;
   expect(result,text).toMatchObject({evento:spokenEvents[index],equipo:'equipo1',...(index===9?{}:{dorsal:21})});
  });
 });
 test(`${language}: every shirt 0–99 in digits and Whistle's spoken hints`,()=>{
  for(let n=0;n<100;n++){
   const text=utterances[language][0];
   expect(parse(text.replace('21',String(n)),language,teams).proposal,text).toMatchObject({evento:'gol',equipo:'equipo1',dorsal:n});
   expect(parse(text.replace('21',spokenNumber(n,language)),language,teams).proposal,spokenNumber(n,language)).toMatchObject({evento:'gol',equipo:'equipo1',dorsal:n});
  }
 });
}
// Independent spellings exercise linguistic boundaries, regional and ASR variants.
const golden:Record<Language,Record<number,string>>={
 es:{0:'cero',1:'uno',16:'dieciséis',21:'veintiún',22:'veintidós',23:'veintitrés',26:'veintiséis',31:'treinta y uno',99:'noventa y nueve'},
 en:{0:'zero',11:'eleven',12:'twelve',13:'thirteen',15:'fifteen',18:'eighteen',21:'twenty-one',40:'forty',88:'eighty-eight',99:'ninety nine'},
 de:{1:'eins',11:'elf',12:'zwölf',16:'sechzehn',17:'siebzehn',21:'einundzwanzig',22:'zwei und zwanzig',30:'dreißig',61:'einundsechzig',99:'neunundneunzig'},
 fr:{0:'zéro',17:'dix-sept',21:'vingt et un',70:'soixante-dix',71:'soixante-et-onze',79:'soixante-dix-neuf',80:'quatre-vingts',81:'quatre-vingt-un',90:'quatre-vingt-dix',99:'quatre-vingt-dix-neuf'},
 it:{1:'uno',11:'undici',18:'diciotto',21:'ventuno',23:'ventitré',28:'ventotto',31:'trentuno',38:'trentotto',88:'ottantotto',99:'novantanove'},
 nl:{0:'nul',11:'elf',12:'twaalf',14:'veertien',18:'achttien',21:'eenentwintig',22:'tweeëntwintig',23:'drieëntwintig',30:'dertig',88:'achtentachtig',99:'negenennegentig'},
 pl:{1:'jeden',2:'dwa',5:'pięć',9:'dziewięć',11:'jedenaście',15:'piętnaście',21:'dwadzieścia jeden',40:'czterdzieści',60:'sześćdziesiąt',99:'dziewięćdziesiąt dziewięć'},
};
test('independent word spellings, French regional numbers and range rejection',()=>{
 for(const language of Object.keys(golden) as Language[])for(const [n,text]of Object.entries(golden[language]))expect(parseSpokenNumber(text,language),text).toBe(Number(n));
 for(const [text,n]of [['septante et un',71],['huitante',80],['octante',80],['nonante-neuf',99]] as const)expect(parseSpokenNumber(text,'fr')).toBe(n);
 for(const text of ['100','123','1.5','-1','one hundred','ciento veintitrés','tres cuatro'])expect(parseSpokenNumber(text,'es')).toBeUndefined();
});
test('role-specific extraction, primary team and literal names, without roster inference',()=>{
 const cases:[string,object][]=[
  ['Parada rival dorsal uno, tiro de nuestro dorsal nueve',{evento:'parada',equipo:'equipo2',dorsal:1,dorsal_relacionado:9}],
  ['Gol nuestro dorsal siete asistencia de Ana María',{evento:'gol',equipo:'equipo1',dorsal:7,nombre_relacionado:'Ana María'}],
  ['Gol de Ana',{evento:'gol',equipo:'desconocido',nombre:'Ana'}],
  ['Recuperación nuestra dorsal ocho, pierde el dorsal once rival',{evento:'recuperacion',equipo:'equipo1',dorsal:8,dorsal_relacionado:11}],
  ['Penalti cometido por nuestro seis sobre el nueve rival',{evento:'penalti_cometido',equipo:'equipo1',dorsal:6,dorsal_relacionado:9}],
  ['Roja nuestra dorsal dos, provocada por Ana rival',{evento:'descalificacion',equipo:'equipo1',dorsal:2,nombre_relacionado:'Ana'}],
  ['Gol de La Jota',{evento:'gol',equipo:'equipo1'}],
  ['Gol de La Jota',{evento:'gol',equipo:'equipo2'}],
 ];
 cases.forEach(([text,expected],index)=>expect(parse(text,'es',index===cases.length-1?[...teams].reverse():teams).proposal,text).toMatchObject(expected));
 const roster=[{name:'Ana María',team:'equipo1' as const},{name:'Ana María',team:'equipo2' as const}];
 expect(parse('gol de ana maria','es',teams,roster).proposal).toEqual({evento:'gol',equipo:'desconocido',nombre:'ana maria'});
});
test('penalty and discipline metadata do not leak to other event types',()=>{
 expect(parse('Gol nuestro siete de penalti','es',teams).proposal).toMatchObject({evento:'gol',dorsal:7,penalti:true});
 expect(parse('Gol nuestro siete','es',teams).proposal).not.toHaveProperty('penalti');
 expect(parse('Descalificación rival seis tarjeta azul','es',teams).proposal).toMatchObject({evento:'descalificacion',equipo:'equipo2',dorsal:6,azul:true});
 expect(parse('Exclusión nuestra dos minutos','es',teams).proposal).toEqual({evento:'exclusion',equipo:'equipo1'});
 expect(parse('Pasivo nuestro dorsal seis','es',teams).proposal).toEqual({evento:'pasivo',equipo:'equipo1'});
 for(const [word,infraccion]of [['pasos','Pasos'],['dobles','Dobles'],['pisando','Pisando']])expect(parse(word+' nuestro seis','es',teams).proposal).toMatchObject({evento:'infraccion',infraccion});
 expect(parse('Infracción nuestra seis','es',teams).proposal).not.toHaveProperty('infraccion');
});
test('rejects cancellations, multiple actions and non-play commentary; numbers are contextual',()=>{
 for(const text of ['No ha sido gol nuestro','Gol nuestro y pérdida rival','Gol nuestro y gol rival','La camiseta azul es bonita','Vamos 12 a 10','Quedan dos minutos','¿Ha sido gol de ellos?','Buen pase de Marta','El pabellón está lleno'])expect(parse(text,'es',teams).proposal,text).toBeNull();
 for(const text of ['Gol nuestro minuto seis','Gol nuestro 12:10','Gol nuestro dorsal ciento veintitrés','Gol nuestro dorsal 123','Gol nuestro un tanto'])expect(parse(text,'es',teams).proposal,text).not.toHaveProperty('dorsal');
 expect(parse('Gol del seis, perdón, del siete nuestro','es',teams).proposal).toMatchObject({dorsal:7,equipo:'equipo1'});
 expect(parse('Gol local seis','es',teams).proposal).toMatchObject({equipo:'desconocido',dorsal:6});
});
test('keyword approximation is a bounded fallback and never fuzzes known player names',()=>{
 for(const [text,evento]of [['Exclucion nuestra dorsal seis','exclusion'],['Recupera nuestra dorsal seis','recuperacion'],['Penal nuestro dorsal seis','penalti_cometido'],['Asistencia nuestra de Ana','gol']])expect(parse(text,'es',teams).proposal,text).toMatchObject({evento,equipo:'equipo1'});
 const typo=parse('Exclucion nuestra dorsal seis','es',teams);expect(typo.eventMatch).toBe('approximate');expect(typo.warnings.join(' ')).toContain('aproximación');
 expect(parse('Asistencia nuestra de Ana','es',teams).proposal).toEqual({evento:'gol',equipo:'equipo1',nombre_relacionado:'Ana'});
 expect(parse('Exclucion','es',teams,[{name:'Exclucion',team:'equipo1'}]).proposal).toBeNull();
});

test('opposing teams, save participants and approximate event terms across all languages',()=>{
 const cases:Record<Language,[string,string,string]>={
  es:['Gol rival dorsal 21','Parada rival dorsal 1 tiro de nuestro dorsal 9','Exclucion nuestra dorsal 6'],
  en:['Their goal number 21','Save their number 1 shot from our number 9','Our suspenson number 6'],
  de:['Tor Gegner Nummer 21','Parade Gegner Nummer 1 Wurf von unser Nummer 9','Zeitstrfe unser Nummer 6'],
  fr:['But adversaire numéro 21','Arrêt adversaire numéro 1 tir de notre numéro 9','Exclucion notre numéro 6'],
  it:['Gol loro numero 21','Parata loro numero 1 tiro di nostro numero 9','Esclusone nostra numero 6'],
  nl:['Doelpunt tegenstander rugnummer 21','Redding tegenstander rugnummer 1 schot van ons rugnummer 9','Tijdstaf onze rugnummer 6'],
  pl:['Bramka rywala numer 21','Obrona rywala numer 1 rzut zawodnika nasz numer 9','Wyklucznie nasze numer 6'],
 };
 for(const language of Object.keys(cases) as Language[]){
  const [goal,save,typo]=cases[language];
  expect(parse(goal,language,teams).proposal,goal).toMatchObject({evento:'gol',equipo:'equipo2',dorsal:21});
  expect(parse(save,language,teams).proposal,save).toMatchObject({evento:'parada',equipo:'equipo2',dorsal:1,dorsal_relacionado:9});
  const result=parse(typo,language,teams);expect(result.proposal,typo).toMatchObject({evento:'exclusion',equipo:'equipo1',dorsal:6});expect(result.eventMatch,typo).toBe('approximate');
 }
});

test('known player names are not event cues or shirt numbers',()=>{
 const players=[{name:'Marco',team:'equipo1' as const},{name:'Siete',team:'equipo1' as const}];
 expect(parse('Amarilla nuestra a Marco','es',teams,players).proposal).toEqual({evento:'amarilla',equipo:'equipo1',nombre:'Marco'});
 expect(parse('Gol nuestro de Siete','es',teams,players).proposal).toEqual({evento:'gol',equipo:'equipo1',nombre:'Siete'});
});

test('gender and ASR-split compound numbers keep their full value',()=>{
 const cases:[Language,string,number][]=[['es','veinti seis',26],['es','treinta y una',31],['es','noventa y un',91],['fr','vingt et une',21],['fr','soixante et une',61],['fr','quatre-vingt-une',81],['it','ventuna',21],['pl','dwadzieścia dwie',22],['pl','trzydzieści jedna',31]];
 for(const [language,words,number]of cases){expect(parseSpokenNumber(words,language),words).toBe(number);expect(parse(utterances[language][0].replace('21',words),language,teams).proposal,words).toHaveProperty('dorsal',number);}
});
