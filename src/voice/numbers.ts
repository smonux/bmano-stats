import type { Language } from '../i18n';

export const numberKey = (value:string) => value.toLocaleLowerCase().normalize('NFD').replace(/\p{M}/gu,'').replace(/ł/g,'l').replace(/ß/g,'ss').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const units:Record<Language,string[]>={es:'cero uno dos tres cuatro cinco seis siete ocho nueve'.split(' '),en:'zero one two three four five six seven eight nine'.split(' '),de:'null eins zwei drei vier fünf sechs sieben acht neun'.split(' '),fr:'zéro un deux trois quatre cinq six sept huit neuf'.split(' '),it:'zero uno due tre quattro cinque sei sette otto nove'.split(' '),nl:'nul een twee drie vier vijf zes zeven acht negen'.split(' '),pl:'zero jeden dwa trzy cztery pięć sześć siedem osiem dziewięć'.split(' ')};
const teens:Record<Language,string[]>={es:'diez once doce trece catorce quince dieciséis diecisiete dieciocho diecinueve'.split(' '),en:'ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'.split(' '),de:'zehn elf zwölf dreizehn vierzehn fünfzehn sechzehn siebzehn achtzehn neunzehn'.split(' '),fr:['dix','onze','douze','treize','quatorze','quinze','seize','dix sept','dix huit','dix neuf'],it:'dieci undici dodici tredici quattordici quindici sedici diciassette diciotto diciannove'.split(' '),nl:'tien elf twaalf dertien veertien vijftien zestien zeventien achttien negentien'.split(' '),pl:'dziesięć jedenaście dwanaście trzynaście czternaście piętnaście szesnaście siedemnaście osiemnaście dziewiętnaście'.split(' ')};
const tens:Record<Language,string[]>={es:'veinte treinta cuarenta cincuenta sesenta setenta ochenta noventa'.split(' '),en:'twenty thirty forty fifty sixty seventy eighty ninety'.split(' '),de:'zwanzig dreißig vierzig fünfzig sechzig siebzig achtzig neunzig'.split(' '),fr:'vingt trente quarante cinquante soixante septante huitante nonante'.split(' '),it:'venti trenta quaranta cinquanta sessanta settanta ottanta novanta'.split(' '),nl:'twintig dertig veertig vijftig zestig zeventig tachtig negentig'.split(' '),pl:'dwadzieścia trzydzieści czterdzieści pięćdziesiąt sześćdziesiąt siedemdziesiąt osiemdziesiąt dziewięćdziesiąt'.split(' ')};
/** Canonical spelling for the vocabulary hints sent to Whistle. */
export function spokenNumber(number:number,language:Language):string {
 if(!Number.isInteger(number)||number<0||number>99)throw new RangeError('Shirt number must be 0–99');
 if(number<10)return units[language][number];
 if(number<20)return teens[language][number-10];
 const u=number%10,decade=tens[language][Math.floor(number/10)-2],unit=units[language][u];
 if(language==='fr'){
  if(number<70)return decade+(u===1?' et un':u?' '+unit:'');
  if(number<80)return 'soixante'+(number===71?' et ':' ')+teens.fr[number-70];
  return number===80?'quatre-vingts':'quatre-vingt-'+(number<90?unit:teens.fr[number-90].replaceAll(' ','-'));
 }
 if(!u)return decade;
 if(language==='es')return number<30?({22:'veintidós',23:'veintitrés',26:'veintiséis'}[number]??'veinti'+unit):decade+' y '+unit;
 if(language==='de')return (u===1?'ein':unit)+'und'+decade;
 if(language==='nl')return unit+([2,3].includes(u)?'ën':'en')+decade;
 if(language==='it'){const value=(u===1||u===8?decade.slice(0,-1):decade)+unit;return u===3?value.slice(0,-1)+'é':value;}
 return decade+' '+unit;
}
const dictionaries=new Map<Language,Map<string,number>>();
export function numberDictionary(language:Language):ReadonlyMap<string,number> {
 const cached=dictionaries.get(language);if(cached)return cached;
 const result=new Map<string,number>();
 const add=(word:string,n:number)=>result.set(numberKey(word),n);
 units[language].forEach((word,n)=>add(word,n));teens[language].forEach((word,n)=>add(word,n+10));
 for(let n=20;n<100;n++){
  const decade=tens[language][Math.floor(n/10)-2],u=n%10,unit=units[language][u];let word=decade+(u?' '+unit:'');
  if(language==='es'&&u){word=n<30?'veinti'+unit:decade+' y '+unit;if(n<30)add('veinti '+unit,n);}
  if(language==='de'&&u){word=(u===1?'ein':unit)+'und'+decade;add((u===1?'ein':unit)+' und '+decade,n);}
  if(language==='nl'&&u){word=unit+'en'+decade;add(unit+' en '+decade,n);}
  if(language==='it'&&u){word=(u===1||u===8?decade.slice(0,-1):decade)+unit;add((u===1||u===8?decade.slice(0,-1):decade)+' '+unit,n);}
  if(language==='fr'){
   if(n<70)word=decade+(u===1?' et un':u?' '+unit:'');
   else if(n<80)word='soixante'+(n===71?' et ':' ')+teens.fr[n-70];
   else word=n===80?'quatre vingts':'quatre vingt '+(n<90?unit:teens.fr[n-90]);
   if(n>=70){add(decade+(u===1?' et un':u?' '+unit:''),n);if(n<90)add('octante'+(u===1?' et un':u?' '+unit:''),n);}
  }
  add(word,n);
 }
 if(language==='es'){add('un',1);add('una',1);add('veintiún',21);add('veintiuna',21);}
 if(language==='en'){add('oh',0);add('nought',0);}
 if(language==='fr'){add('une',1);add('quatre vingt',80);}
 if(language==='de'){add('ein',1);add('eine',1);}
 if(language==='pl'){add('jedna',1);add('jedno',1);add('dwie',2);}
 // Spoken gender/apocope variants of the unit in compound shirt numbers.
 for(const [word,number]of [...result]){
  if(language==='es'&&number%10===1&&number>=20){add(word.replace(/uno$/u,'un'),number);add(word.replace(/uno$/u,'una'),number);}
  if(language==='fr'&&/un$/u.test(word))add(word.replace(/un$/u,'une'),number);
  if(language==='it'&&/uno$/u.test(word)){add(word.replace(/uno$/u,'una'),number);add(word.replace(/uno$/u,'un'),number);}
  if(language==='pl'&&/jeden$/u.test(word)){add(word.replace(/jeden$/u,'jedna'),number);add(word.replace(/jeden$/u,'jedno'),number);}
  if(language==='pl'&&/dwa$/u.test(word))add(word.replace(/dwa$/u,'dwie'),number);
 }
 dictionaries.set(language,result);return result;
}
/** Exact complete span only: 123, 1.5, -1 and one hundred never become shirt 23/1. */
export function parseSpokenNumber(text:string,language:Language):number|undefined {
 if(/^\d{1,2}$/.test(text.trim()))return Number(text);
 if(/[\d.,+−]/u.test(text)||/^\s*-/.test(text))return undefined;
 return numberDictionary(language).get(numberKey(text));
}
export type NumberSpan={start:number;end:number;value:number|undefined};
export const largeNumbers='hundred|thousand|million|hundert|tausend|cien|ciento|mil|cent|mille|cento|mila|honderd|duizend|sto|tysiac';
/** Longest complete number, including spaced ASR compounds. Invalid spans stay invalid. */
export function numberAt(words:readonly string[],start:number,language:Language):NumberSpan|undefined {
 const dictionary=numberDictionary(language),first=words[start];if(first===undefined)return undefined;
 if(/^\d+$/.test(first))return {start,end:start+1,value:first.length<=2?Number(first):undefined};
 if(new RegExp(`^(?:${largeNumbers})$`,'u').test(first)){let end=start+1;while(end<words.length&&(dictionary.has(words[end])||/^\d+$/.test(words[end])||new RegExp(`^(?:${largeNumbers})$`,'u').test(words[end])))end++;return {start,end,value:undefined};}
 for(let size=Math.min(6,words.length-start);size>0;size--){
  const value=dictionary.get(words.slice(start,start+size).join(' '));
  if(value===undefined)continue;
  let end=start+size;
  // Prevent a partial reading of 'one hundred' or 'three four'.
  if(new RegExp(`^(?:${largeNumbers})$`,'u').test(words[end]??'')||dictionary.has(words[end]??'')||/^\d+$/.test(words[end]??'')){
   while(end<words.length&&(dictionary.has(words[end])||new RegExp(`^(?:${largeNumbers})$`,'u').test(words[end])||/^\d+$/.test(words[end])))end++;
   return {start,end,value:undefined};
  }
  return {start,end,value};
 }
 return undefined;
}
const markers:Record<Language,string>={es:'dorsal|n[uú]mero',en:'number|shirt number',de:'nummer|r[uü]ckennummer',fr:'num[eé]ro|dossard',it:'numero',nl:'rugnummer|nummer',pl:'numer'};
/** Historical benchmark helper; active extraction uses numberAt on token spans. */
export function normalizeShirtNumbers(text:string,language:Language) {
 return text.replace(new RegExp(`(\\b(?:${markers[language]})\\s+)([\\p{L}-]+(?:\\s+[\\p{L}-]+){0,5})`,'giu'),(whole,prefix:string,phrase:string)=>{
  const raw=phrase.split(/\s+/),match=numberAt(raw.map(numberKey),0,language);
  return match?.value!==undefined?prefix+match.value+(match.end<raw.length?' '+raw.slice(match.end).join(' '):''):whole;
 });
}
