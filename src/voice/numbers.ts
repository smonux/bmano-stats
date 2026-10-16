import type { Language } from '../i18n';
import { normalize } from './interpretation';
const units:Record<Language,string[]>={es:'cero uno dos tres cuatro cinco seis siete ocho nueve'.split(' '),en:'zero one two three four five six seven eight nine'.split(' '),de:'null eins zwei drei vier fünf sechs sieben acht neun'.split(' '),fr:'zéro un deux trois quatre cinq six sept huit neuf'.split(' '),it:'zero uno due tre quattro cinque sei sette otto nove'.split(' '),nl:'nul een twee drie vier vijf zes zeven acht negen'.split(' '),pl:'zero jeden dwa trzy cztery pięć sześć siedem osiem dziewięć'.split(' ')};
const teens:Record<Language,string[]>={es:'diez once doce trece catorce quince dieciséis diecisiete dieciocho diecinueve'.split(' '),en:'ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'.split(' '),de:'zehn elf zwölf dreizehn vierzehn fünfzehn sechzehn siebzehn achtzehn neunzehn'.split(' '),fr:['dix','onze','douze','treize','quatorze','quinze','seize','dix sept','dix huit','dix neuf'],it:'dieci undici dodici tredici quattordici quindici sedici diciassette diciotto diciannove'.split(' '),nl:'tien elf twaalf dertien veertien vijftien zestien zeventien achttien negentien'.split(' '),pl:'dziesięć jedenaście dwanaście trzynaście czternaście piętnaście szesnaście siedemnaście osiemnaście dziewiętnaście'.split(' ')};
const tens:Record<Language,string[]>={es:'veinte treinta cuarenta cincuenta sesenta setenta ochenta noventa'.split(' '),en:'twenty thirty forty fifty sixty seventy eighty ninety'.split(' '),de:'zwanzig dreißig vierzig fünfzig sechzig siebzig achtzig neunzig'.split(' '),fr:'vingt trente quarante cinquante soixante septante huitante nonante'.split(' '),it:'venti trenta quaranta cinquanta sessanta settanta ottanta novanta'.split(' '),nl:'twintig dertig veertig vijftig zestig zeventig tachtig negentig'.split(' '),pl:'dwadzieścia trzydzieści czterdzieści pięćdziesiąt sześćdziesiąt siedemdziesiąt osiemdziesiąt dziewięćdziesiąt'.split(' ')};
const key=(value:string)=>normalize(value).replace(/ß/g,'ss');
const dictionaries=new Map<Language,Map<string,number>>();
function dictionary(language:Language) {
 const existing=dictionaries.get(language);if(existing)return existing;
 const result=new Map<string,number>(),add=(word:string,n:number)=>result.set(key(word),n);
 units[language].forEach((word,n)=>add(word,n));teens[language].forEach((word,n)=>add(word,n+10));
 for(let n=20;n<100;n++){
  const decade=tens[language][Math.floor(n/10)-2],u=n%10,unit=units[language][u];let word=decade+(u?' '+unit:'');
  if(language==='es'&&u)word=n<30?'veinti'+unit:decade+' y '+unit;
  if(language==='de'&&u)word=(u===1?'ein':unit)+'und'+decade;
  if(language==='nl'&&u)word=unit+'en'+decade;
  if(language==='it'&&u)word=(u===1||u===8?decade.slice(0,-1):decade)+unit;
  if(language==='fr'){
   if(n<70)word=decade+(u===1?' et un':u?' '+unit:'');
   else if(n<80)word='soixante'+(n===71?' et ':' ')+teens.fr[n-70];
   else word=n===80?'quatre vingts':'quatre vingt '+(n<90?unit:teens.fr[n-90]);
   if(n>=70)add(decade+(u===1?' et un':u?' '+unit:''),n);
  }
  add(word,n);
 }
 if(language==='es'){add('un',1);add('una',1);add('veintiún',21);}
 if(language==='fr')add('une',1);
 if(language==='de'){add('ein',1);add('eine',1);}
 if(language==='pl'){add('jedna',1);add('dwie',2);}
 dictionaries.set(language,result);return result;
}
const markers:Record<Language,string>={es:'dorsal|n[uú]mero',en:'number|shirt number',de:'nummer|r[uü]ckennummer',fr:'num[eé]ro|dossard',it:'numero',nl:'rugnummer|nummer',pl:'numer'};
/** Only an explicit shirt-number span is normalized; names and the stored transcript stay literal. */
export function normalizeShirtNumbers(text:string,language:Language) {
 const words=dictionary(language);
 return text.replace(new RegExp(`(\\b(?:${markers[language]})\\s+)([\\p{L}-]+(?:\\s+[\\p{L}-]+){0,4})`,'giu'),(whole,prefix:string,phrase:string)=>{
  const parts=phrase.split(/\s+/);if(/\b(hundred|thousand|million|hundert|tausend|cien|ciento|mil|cent|mille|cento|mila|honderd|duizend|sto|tysiac)\b/u.test(key(phrase)))return whole;for(let length=parts.length;length>0;length--){const number=words.get(key(parts.slice(0,length).join(' ')));if(number!==undefined){if(length<parts.length&&words.has(key(parts[length])))return whole;return prefix+number+(length<parts.length?' '+parts.slice(length).join(' '):'');}}
  return whole;
 });
}
