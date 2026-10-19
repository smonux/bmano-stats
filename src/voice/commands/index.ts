import type { Language } from '../../i18n';
import { definitions } from '../../domain/event-definitions';
import { spokenTypes } from '../event-types';
import { createAnalysisContext } from '../analysis/context';
import type {
  InterpretationResult,
  RulePlayer,
  RuleProposal,
  TeamPerspective,
  TokenSpan,
} from '../analysis/types';
import { NO_EVENT, REVIEW_WARNING, rejectInterpretation } from '../analysis/results';
import { commandEvent } from './events';
import { commandPlayers } from './players';
import { commandVocabulary } from './vocabulary';

/** Protocol: event, team, primary, related, metadata. No placeholders or role reordering. */
export function interpretCommand(
  text: string,
  language: Language,
  teams: string[],
  players: RulePlayer[] = [],
): InterpretationResult {
  if (!text.trim() || text.length > 10_000) return rejectInterpretation(NO_EVENT);
  const context = createAnalysisContext(text, language, teams, players);
  const event = commandEvent(context);
  if (!event) return rejectInterpretation(NO_EVENT);
  const warnings = [REVIEW_WARNING];
  if (event.match === 'approximate')
    warnings.push('Evento reconocido por aproximación de palabra clave. Revisa el tipo de evento.');
  const team =
    [...context.teamReferences]
      .filter((span) => span.from >= event.to)
      .sort((a, b) => a.from - b.from || b.to - a.to)[0]?.team ?? 'equipo1';
  const proposal: RuleProposal = { evento: event.event, equipo: team };
  const vocabulary = commandVocabulary[language];
  const penalty = context.findPattern(context.rules.penalty);
  const blue = context.findPattern(vocabulary.blue);
  const subtypes = (Object.keys(context.rules.infraction) as ('Pasos' | 'Dobles' | 'Pisando')[])
    .flatMap((kind) =>
      context.findPattern(context.rules.infraction[kind]).map((span) => ({ ...span, kind })),
    )
    .sort((a, b) => a.from - b.from);
  const colours = context.findPattern(
    `${vocabulary.yellow}|${vocabulary.red}|${vocabulary.blue}|${vocabulary.card}`,
  );
  const excluded: TokenSpan[] = [...context.teamReferences, ...penalty, ...colours, ...subtypes];
  if (['gol', 'parada', 'fallo'].includes(event.event) && penalty.length) proposal.penalti = true;
  if (event.event === 'descalificacion' && (event.colour ? event.colour === 'blue' : blue.length))
    proposal.azul = true;
  if (event.event === 'infraccion' && subtypes[0]) proposal.infraccion = subtypes[0].kind;
  const definition = definitions[spokenTypes[event.event]];
  if (spokenTypes[event.event] !== 'passive') {
    const relatedTeam = definition.sameTeam ? team : team === 'equipo1' ? 'equipo2' : 'equipo1';
    const slots: TeamPerspective[] = definition.related ? [team, relatedTeam] : [team];
    const mentions = commandPlayers(context, event.to, slots, excluded, warnings);
    mentions.forEach((mention, index) => {
      if (mention.shirtNumber !== undefined)
        proposal[index ? 'dorsal_relacionado' : 'dorsal'] = mention.shirtNumber;
      else if (mention.name) proposal[index ? 'nombre_relacionado' : 'nombre'] = mention.name;
    });
  }
  return {
    proposal,
    warnings: [...new Set(warnings)],
    eventKeyword: context.originalText(event),
    eventMatch: event.match,
  };
}
