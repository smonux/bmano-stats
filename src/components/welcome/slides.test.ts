import { expect, test } from 'vitest';
import { slides } from './slides';
import { languages, tr, type Language } from '../../i18n';
import { interpretCommand } from '../../voice/commands';

test('the guide play examples follow the implemented grammar in every interface language', () => {
  const examples = slides.find((slide) => slide.grammar)!.examples!;
  for (const language of Object.keys(languages) as Language[]) {
    const goal = interpretCommand(tr(examples[0].spoken, {}, language), language, ['A', 'B']);
    expect(goal.proposal, language).toEqual({
      evento: 'gol',
      equipo: 'equipo1',
      dorsal: 7,
      dorsal_relacionado: 1,
      penalti: true,
    });
    const substitution = interpretCommand(tr(examples[1].spoken, {}, language), language, [
      'A',
      'B',
    ]);
    expect(substitution.proposal, language).toEqual({
      evento: 'sustitucion',
      equipo: 'equipo1',
      dorsal: 7,
      dorsal_relacionado: 9,
    });
  }
});

test('both guide note examples explicitly use Spanish and leave reminders as free text', () => {
  const examples = slides.find((slide) => slide.illustration === 'note')!.examples!;
  expect(examples).toHaveLength(2);
  for (const example of examples) {
    expect(example.language).toBe('es');
    const result = interpretCommand(example.spoken, example.language!, ['A', 'B']);
    expect(result.proposal).toEqual({
      evento: 'nota',
      equipo: 'desconocido',
      nota: example.spoken.slice(example.spoken.indexOf(':') + 2),
    });
  }
});
