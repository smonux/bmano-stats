import { expect, test } from 'vitest';
import type { CompletionResult } from 'cactus-needle/browser';
import { adaptNeedleResult } from './hybrid';
import { toolForEvent } from './play-schema';
import { routeVoiceEvent } from './event-routing';
import { spokenEvents } from './event-types';

function response(arguments_: Record<string, unknown>, name = 'gol'): CompletionResult {
  return {
    success: true,
    type: 'call',
    error: null,
    error_code: null,
    reasoning: '',
    confidence: 0.9,
    function_calls: [
      { name, arguments: arguments_ as CompletionResult['function_calls'][number]['arguments'] },
    ],
    suppressed_calls: [],
  };
}

test('goal schema has all six fields, a team default and no other event metadata', () => {
  const tool = toolForEvent('gol', ['La Jota', 'Leones'], 'equipo1').gol.inputSchema;
  expect(Object.keys(tool.properties)).toEqual([
    'equipo',
    'dorsal',
    'nombre',
    'dorsal_asistente',
    'nombre_asistente',
    'penalti',
  ]);
  expect(tool.properties.equipo).toMatchObject({
    default: 'equipo1',
    enum: ['equipo1', 'equipo2', 'desconocido'],
  });
  expect(tool.properties.dorsal).toMatchObject({ minimum: 0, maximum: 99 });
  expect(tool.additionalProperties).toBe(false);
});
test('each of the twelve events exposes a fixed, relevant schema', () => {
  for (const event of spokenEvents) {
    const properties = toolForEvent(event, ['A', 'B'], 'equipo2')[event].inputSchema.properties;
    expect(properties).not.toHaveProperty('evento');
    expect(properties).toHaveProperty('equipo.default', 'equipo2');
    expect('azul' in properties).toBe(event === 'descalificacion');
    expect('infraccion' in properties).toBe(event === 'infraccion');
    expect('penalti' in properties).toBe(['gol', 'parada', 'fallo'].includes(event));
  }
  expect(Object.keys(toolForEvent('pasivo', [], 'equipo1').pasivo.inputSchema.properties)).toEqual([
    'equipo',
  ]);
});
test('Needle supplies roles and numbers; goal assist fields map to the existing editor', () => {
  expect(
    adaptNeedleResult(
      'gol',
      response({
        equipo: 'equipo2',
        dorsal: 0,
        nombre: 'Ana',
        dorsal_asistente: 99,
        nombre_asistente: 'Lucía',
        penalti: true,
      }),
      'equipo1',
    ).proposal,
  ).toEqual({
    evento: 'gol',
    equipo: 'equipo2',
    dorsal: 0,
    nombre: 'Ana',
    dorsal_relacionado: 99,
    nombre_relacionado: 'Lucía',
    penalti: true,
  });
});
test.each([{}, { equipo: 'desconocido' }, { equipo: 'gol' }])(
  'unresolved team uses the selected default with a visible warning: %j',
  (args) => {
    const result = adaptNeedleResult('gol', response({ ...args, dorsal: 7 }), 'equipo2');
    expect(result.proposal).toEqual({ evento: 'gol', equipo: 'equipo2', dorsal: 7 });
    expect(result.warnings.join(' ')).toContain('equipo por defecto');
  },
);
test('a valid team from Needle is preserved even when it differs from the default', () => {
  const result = adaptNeedleResult('gol', response({ equipo: 'equipo2' }), 'equipo1');
  expect(result.proposal.equipo).toBe('equipo2');
  expect(result.warnings.join(' ')).not.toContain('equipo por defecto');
});
test('invalid and unrelated fields are omitted without truncating numbers or dropping a valid team', () => {
  const result = adaptNeedleResult(
    'gol',
    response({
      equipo: 'equipo2',
      dorsal: 100,
      dorsal_asistente: -1,
      azul: true,
      infraccion: 'Pasos',
      evento: 'parada',
    }),
    'equipo1',
  );
  expect(result.proposal).toEqual({ evento: 'gol', equipo: 'equipo2' });
  expect(result.warnings.join(' ')).toContain('campos no válidos');
});
test('suppressed calls remain uncertain drafts; multiple or ungrounded calls do not fill participants', () => {
  const uncertain = response({ equipo: 'equipo2', dorsal: 7 });
  uncertain.suppressed_calls = uncertain.function_calls;
  uncertain.function_calls = [];
  expect(adaptNeedleResult('gol', uncertain, 'equipo1').warnings.join(' ')).toContain(
    'incertidumbre',
  );
  for (const bad of [
    { ...uncertain, function_calls: uncertain.suppressed_calls },
    { ...response({ dorsal: 7 }), validation: { ungrounded: ['dorsal'] } },
    { ...response({ dorsal: 7 }), validation: { negation: true } },
    response({ dorsal: 7 }, 'parada'),
  ]) {
    expect(adaptNeedleResult('gol', bad, 'equipo1').proposal).toEqual({
      evento: 'gol',
      equipo: 'equipo1',
    });
  }
});
test.each([
  ['Gol nuestro, dorsal siete?', 'gol'],
  ['tiro fallado del ocho', 'fallo'],
  ['pasos del nuestro', 'infraccion'],
  ['exclucion rival', 'exclusion'],
  ['cambio nuestro sale seis entra nueve', 'sustitucion'],
])('event rules route noisy text without extracting its metadata: %s', (text, event) => {
  const routed = routeVoiceEvent(text, 'es', ['La Jota', 'Leones']);
  expect(routed.event).toBe(event);
  expect(routed).not.toHaveProperty('proposal');
});
