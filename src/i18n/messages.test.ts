import { expect, test } from 'vitest';
import { catalog } from './messages';
import { tr, supportedLanguage } from './index';
test('every message has six translations with the same interpolation placeholders',()=>{
 const vars=(s:string)=>[...s.matchAll(/\{(\w+)\}/g)].map(x=>x[1]).sort();
 for(const [source,translations]of Object.entries(catalog)) {expect(translations,source).toHaveLength(6);for(const translated of translations){expect(translated.trim(),source).not.toBe('');expect(vars(translated),source).toEqual(vars(source));}}
 expect(tr('Marcador {a} a {b}',{a:3,b:2},'en')).toBe('Score 3 to 2');expect(supportedLanguage('xx')).toBe('es');
});
