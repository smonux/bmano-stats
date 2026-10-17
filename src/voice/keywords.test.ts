import {expect,test} from 'vitest';
import {whistleKeywords} from './keywords';
import {languages,type Language} from '../i18n';
const players=[{name:'Ana María',dorsal:0},{name:'Íñigo',dorsal:21},{name:'Ana María',dorsal:21},{name:'',dorsal:99},{name:'No dorsal',dorsal:null}];
test('Whistle receives sport words, names and only known 0–99 numbers in digits and its language',()=>{
 for(const language of Object.keys(languages) as Language[]){
  const hints=whistleKeywords(language,['La Jota','Águilas'],players);
  expect(hints).toEqual(expect.arrayContaining(['La Jota','Águilas','Ana María','Íñigo','0','21','99']));
  expect(hints.filter(value=>value==='Ana María')).toHaveLength(1);expect(hints).not.toContain('6');
 }
 expect(whistleKeywords('es',[],players)).toEqual(expect.arrayContaining(['cero','veintiuno','noventa y nueve','penalti','asistencia','amarilla','roja','cambio','sustitución','sale','entra']));
 expect(whistleKeywords('fr',[],players)).toContain('quatre-vingt-dix-neuf');
 expect(whistleKeywords('pl',[],players)).toContain('dziewięćdziesiąt dziewięć');
});
test('does not discard known numbers or names at an arbitrary 80-entry limit',()=>{
 const players=Array.from({length:100},(_,dorsal)=>({name:`Nombre ${dorsal}`,dorsal}));
 const hints=whistleKeywords('es',[],players);expect(hints).toContain('Nombre 99');expect(hints).toContain('99');expect(hints).toContain('noventa y nueve');
 expect(whistleKeywords('es',[],[{name:'a\nb',dorsal:123}])).toContain('a b');expect(whistleKeywords('es',[],[{name:'',dorsal:123}])).not.toContain('123');
});
