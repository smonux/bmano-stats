import { describe, expect, it } from 'vitest';
import { languages, type Language } from '../../i18n';
import { interpretCommand } from '../commands';
import { captureContext, toVoiceDraft } from '../interpretation';
import { whistleKeywords } from '../keywords';
import { practiceContext, emptyPracticeDraft, practiceIds } from './context';
import { practiceChallenges, practiceGoalExample, practicePhrases } from './challenges';
import { evaluatePractice } from './evaluate';
import { voicePracticeMessages } from '../../i18n/voice-practice';
import { practiceNames } from './names';

const data = practiceContext();
const match = data.matches[0];
function interpretation(text: string, language: Language = 'es') {
  const data = practiceContext(language);
  const players = data.players.map((player) => ({
    name: player.name,
    dorsal: player.dorsal,
    team: player.teamId === match.localTeamId ? ('equipo1' as const) : ('equipo2' as const),
  }));
  return interpretCommand(
    text,
    language,
    data.teams.map((team) => team.name),
    players,
  );
}
function interpret(text: string, language: Language = 'es') {
  return toVoiceDraft(
    text,
    interpretation(text, language).proposal,
    captureContext(match, practiceContext(language)),
  ).draft;
}

describe('practice phrases through the real text interpreter (no acoustic accuracy claim)', () => {
  for (const language of Object.keys(languages) as Language[])
    it(`${language}: all four phrases preserve event, perspective and participant roles`, () => {
      const data = practiceContext(language);
      for (const [index, text] of practicePhrases[language].entries()) {
        expect(interpretation(text, language).defaultTeamApplied, text).toBe(false);
        expect(interpretation(text, language).eventMatch, text).toBe('literal');
        const draft = interpret(text, language);
        const evaluation = evaluatePractice(draft, practiceChallenges[index], data, false);
        expect(evaluation, `${index}: ${text} -> ${JSON.stringify(draft)}`).toMatchObject({
          state: index === 3 ? 'amber' : 'green',
        });
        if (index === 1)
          expect(draft).toMatchObject({
            type: 'goal',
            teamId: practiceIds.own,
            primaryDorsal: '7',
            relatedDorsal: '9',
          });
        if (index === 2)
          expect(draft).toMatchObject({
            type: 'penalty',
            teamId: practiceIds.other,
            primaryDorsal: '12',
            relatedDorsal: '9',
          });
        if (index === 0) expect(draft.primaryDorsal).toBe('');
        if (index === 3) {
          expect(draft.primaryDorsal).toBe('');
          expect(evaluation.missing).toEqual(['Excluido']);
          expect(
            evaluatePractice({ ...draft, primaryDorsal: '8' }, practiceChallenges[3], data, true)
              .state,
          ).toBe('green');
        }
      }
      const introduction = practiceGoalExample[language].join(' ');
      expect(interpret(introduction, language)).toMatchObject({
        type: 'goal',
        teamId: practiceIds.own,
        primaryDorsal: '7',
        relatedDorsal: '9',
      });
      expect(
        evaluatePractice(interpret(introduction, language), practiceChallenges[1], data, false)
          .state,
      ).toBe('green');
      const names = practiceNames[language];
      expect(data.players.filter((player) => player.teamId === practiceIds.own)).toMatchObject([
        { dorsal: 7, name: names.scorer },
        { dorsal: 9, name: names.assistant },
      ]);
      const keywords = whistleKeywords(
        language,
        data.teams.map((team) => team.name),
        data.players,
      );
      expect(keywords).toEqual(expect.arrayContaining([names.scorer, names.assistant]));
      expect(practicePhrases[language][1]).toContain(names.scorer);
      expect(practicePhrases[language][1]).toContain(names.assistant);
      expect(practicePhrases[language][2]).toContain(names.assistant);
    });
  it('names and shirt numbers of the same identity are semantically interchangeable', () => {
    for (const text of ['Gol nuestro Marta Elena', 'Gol nuestro siete nueve', 'Gol nuestro 07 09'])
      expect(evaluatePractice(interpret(text), practiceChallenges[1], data, false).state).toBe(
        'green',
      );
    expect(
      evaluatePractice(interpret('Penalti rival 12 9'), practiceChallenges[2], data, false).state,
    ).toBe('green');
  });
  it('builds normal keywords for the whole practice roster, independently of the challenge', () => {
    const keywords = whistleKeywords(
      'es',
      data.teams.map((team) => team.name),
      data.players,
    );
    for (const word of ['Marta', 'Elena', '7', 'siete', '9', 'nueve', '12', 'doce', '8', 'ocho'])
      expect(keywords).toContain(word);
    expect(data.players.map(({ dorsal }) => dorsal)).not.toContain(15);
    expect(keywords).not.toContain(practicePhrases.es[1]);
    expect(keywords).not.toContain(practicePhrases.es[2]);
  });
  it('keeps user names and the transcript unchanged when recognition uses another language', () => {
    const userData = practiceContext('en');
    userData.players[0] = { ...userData.players[0], name: 'Marta Álvarez', dorsal: 27 };
    userData.players[1] = { ...userData.players[1], name: 'Elena López', dorsal: 18 };
    const before = structuredClone(userData);
    const text = 'Goal for us by Marta Álvarez, assisted by Elena López';
    const result = interpretCommand(
      text,
      'en',
      userData.teams.map((team) => team.name),
      userData.players.map((player) => ({
        name: player.name,
        dorsal: player.dorsal,
        team: player.teamId === practiceIds.own ? 'equipo1' : 'equipo2',
      })),
    );
    const draft = toVoiceDraft(text, result.proposal, captureContext(match, userData)).draft;
    expect(draft).toMatchObject({
      type: 'goal',
      primaryDorsal: '27',
      relatedDorsal: '18',
      rawText: text,
    });
    expect(userData).toEqual(before);
    const hints = whistleKeywords(
      'en',
      userData.teams.map((team) => team.name),
      userData.players,
    );
    expect(hints).toEqual(expect.arrayContaining(['Marta Álvarez', 'Elena López']));
    expect(hints).not.toContain('Martha');
    expect(hints).not.toContain('Helen');
  });
});

describe('semantic practice evaluation uses domain validation before challenge comparison', () => {
  it('provides all six translations with the same interpolation fields', () => {
    const fields = (value: string) =>
      [...value.matchAll(/\{\w+\}/g)].map((match) => match[0]).sort();
    for (const [source, translations] of Object.entries(voicePracticeMessages)) {
      expect(translations, source).toHaveLength(6);
      for (const translation of translations) {
        expect(translation.trim(), source).not.toBe('');
        expect(fields(translation), source).toEqual(fields(source));
      }
    }
  });
  it('accepts an unidentified scorer in A without inventing a player', () => {
    const draft = interpret('Gol nuestro');
    expect(draft.primaryDorsal).toBe('');
    expect(evaluatePractice(draft, practiceChallenges[0], data, false)).toEqual({
      state: 'green',
      missing: [],
      wrong: [],
      issues: [],
    });
  });
  it('distinguishes missing detail from valid but wrong players, teams and roles', () => {
    expect(
      evaluatePractice(interpret('Gol nuestro Marta'), practiceChallenges[1], data, false),
    ).toMatchObject({ state: 'amber', missing: ['Asistente'], wrong: [] });
    expect(
      evaluatePractice(interpret('Gol nuestro Elena Marta'), practiceChallenges[1], data, false),
    ).toMatchObject({ state: 'amber', missing: [], wrong: ['Goleador', 'Asistente'] });
    expect(
      evaluatePractice(interpret('Penalti nuestro 12 9'), practiceChallenges[2], data, false),
    ).toMatchObject({ state: 'amber', wrong: ['Equipo'] });
    expect(
      evaluatePractice(interpret('Penalti rival 9 12'), practiceChallenges[2], data, false),
    ).toMatchObject({ state: 'amber', wrong: ['Infractor', 'Beneficiario rival'] });
    expect(
      evaluatePractice(interpret('Gol nuestro 7 9 penalti'), practiceChallenges[1], data, false),
    ).toMatchObject({ state: 'amber', wrong: ['De penalti'] });
  });
  it('shows red for real missing requirements, invalid positions and same-player substitutions', () => {
    expect(
      evaluatePractice(emptyPracticeDraft(), practiceChallenges[0], data, false),
    ).toMatchObject({ state: 'red', issues: ['Selecciona un evento', 'Selecciona un equipo'] });
    const draft = interpret('Gol nuestro');
    expect(
      evaluatePractice({ ...draft, minute: 1000 }, practiceChallenges[0], data, false).state,
    ).toBe('red');
    expect(
      evaluatePractice({ ...draft, period: 2 }, practiceChallenges[0], data, false),
    ).toMatchObject({ state: 'red', issues: ['El tiempo indicado aún no existe.'] });
    expect(
      evaluatePractice(interpret('Infracción nuestra 7'), practiceChallenges[0], data, false),
    ).toMatchObject({ state: 'red', issues: ['Selecciona el tipo de infracción'] });
    expect(
      evaluatePractice(interpret('Cambio nuestro 7 7'), practiceChallenges[0], data, false).state,
    ).toBe('red');
  });
  it('requires the deliberate editor step in D and keeps evaluation side-effect free', () => {
    const before = structuredClone(data);
    const draft = { ...interpret('Exclusión de ellos'), primaryDorsal: '8' };
    expect(evaluatePractice(draft, practiceChallenges[3], data, false).state).toBe('amber');
    expect(evaluatePractice(draft, practiceChallenges[3], data, true).state).toBe('green');
    expect(data).toEqual(before);
    expect(data.events).toEqual([]);
    expect(data.matches[0].id).toBe(practiceIds.match);
  });
});
