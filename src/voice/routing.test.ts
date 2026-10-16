import {expect,test} from 'vitest';
import {routeSpokenEvent,toolForPlay,captureFacts} from './routing';
test('only an unambiguous action prefix selects a narrow tool',()=>{
 expect(routeSpokenEvent('Gol nuestro, dorsal siete.','es')).toBe('goal');expect(routeSpokenEvent('Tor für uns Nummer sieben','de')).toBe('goal');
 for(const text of ['No es gol nuestro','Gol nuestro y exclusión rival','Gol nuestro y gol rival','Me han dicho gol nuestro','Una jugada cualquiera'])expect(routeSpokenEvent(text,'es')).toBeNull();
});
test('a simple goal asks only team and number, with exact number normalization',()=>{
 const route=toolForPlay('Gol nuestro, dorsal siete.','es',['La Jota','Rival']);expect(route.text).toBe('Gol nuestro, dorsal 7.');expect(route.type).toBe('goal');
 expect(Object.keys(route.tools.gol.inputSchema.properties)).toEqual(['equipo','dorsal']);expect(route.schemaCharacters).toBeLessThan(450);
 expect(captureFacts('es')).toContain('equipo1=nuestro/nosotros');
});
test('related and disciplinary fields enter the schema only when their action and phrase need them',()=>{
 const goal=toolForPlay('Gol nuestro, dorsal siete, asistencia de Ana.','es',['A','B']);expect(goal.tools.gol.inputSchema.properties).toHaveProperty('nombre_relacionado');
 const penalty=toolForPlay('Gol nuestro dorsal siete de penalti','es',['A','B']);expect(penalty.tools.gol.inputSchema.properties).toHaveProperty('penalti');
 const plain=toolForPlay('Exclusión nuestra número ocho','es',['A','B']);expect(plain.tools.exclusion.inputSchema.properties).not.toHaveProperty('penalti');expect(plain.tools.exclusion.inputSchema.properties).not.toHaveProperty('azul');
 const unknown=toolForPlay('No es gol nuestro','es',['A','B']);expect(unknown.name).toBe('registrar_jugada');expect(unknown.tools.registrar_jugada.inputSchema.properties).toHaveProperty('evento');
});

test('explicit perspective is grounded in the primary clause, never the related opponent',()=>{
 expect(toolForPlay('Gol nuestro dorsal siete','es',['A','B']).teamReference).toBe('equipo1');
 expect(toolForPlay('Parada rival dorsal uno, lanzamiento de nuestro dorsal nueve','es',['A','B']).teamReference).toBe('equipo2');
 expect(toolForPlay('Gol dorsal siete','es',['A','B']).teamReference).toBeUndefined();
 expect(toolForPlay('Gol nuestro rival dorsal siete','es',['A','B']).teamReference).toBeUndefined();
 expect(toolForPlay('No gol nuestro dorsal siete','es',['A','B']).teamReference).toBeUndefined();
});
