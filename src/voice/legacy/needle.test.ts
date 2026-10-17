import { expect, test } from 'vitest';
const proposal = {
  evento: 'gol',
  equipo: 'nuestro',
  nombre: 'Ana',
  nombre_relacionado: '',
  penalti: false,
  azul: false,
  infraccion: '',
};

test('multiple, ungrounded and negated calls remain pending; one withheld candidate requires visible review', async () => {
  const { selectProposal } = await import('./needle');
  const accepted = {
    success: true,
    function_calls: [{ name: 'registrar_jugada', arguments: proposal }],
    suppressed_calls: [],
    confidence: 0.8,
  };
  expect(selectProposal(accepted).proposal).toEqual(proposal);
  const withheld = selectProposal({
    ...accepted,
    function_calls: [],
    suppressed_calls: accepted.function_calls,
  });
  expect(withheld.proposal).toEqual(proposal);
  expect(withheld.warnings.join(' ')).toContain('incertidumbre');
  expect(selectProposal({ ...accepted, confidence: 0.1 }).warnings.join(' ')).toContain(
    'confianza baja',
  );
  for (const change of [
    { success: false },
    { function_calls: [] },
    { suppressed_calls: accepted.function_calls },
    { function_calls: [...accepted.function_calls, ...accepted.function_calls] },
    { validation: { ungrounded: ['equipo'] } },
    { validation: { negation: true } },
  ]) {
    expect(selectProposal({ ...accepted, ...change }).proposal).toBeNull();
  }
});
