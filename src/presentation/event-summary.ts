import type { EventDraft } from '../data/database';
import { definitions, relatedTeam, type Match, type Snapshot } from '../domain/model';
import { tr } from '../i18n';

/** Shared human-readable draft context; validation stays in eventDraftIssues. */
export function draftSummary(draft: EventDraft, match: Match, data: Snapshot): string {
  const definition = draft.type ? definitions[draft.type] : null;
  const team = data.teams.find((team) => team.id === draft.teamId)?.name;
  const participant = (dorsal: string, teamId: string | null) => {
    if (dorsal === '') return tr('Sin identificar');
    const name = data.players.find(
      (player) => player.teamId === teamId && player.dorsal === Number(dorsal),
    )?.name;
    return `#${Number(dorsal)}${name ? ' ' + name : ''}`;
  };
  const parts = [definition ? tr(definition.label) : tr('Evento sin indicar')];
  if (draft.type !== 'note') {
    parts.push(team ?? tr('Equipo pendiente'));
    if (definition && draft.type !== 'passive') {
      parts.push(`${tr(definition.principal)}: ${participant(draft.primaryDorsal, draft.teamId)}`);
      if (definition.related && (draft.relatedDorsal !== '' || draft.type === 'substitution')) {
        parts.push(
          `${tr(definition.related)}: ${participant(draft.relatedDorsal, draft.teamId && draft.type ? relatedTeam(match, draft.type, draft.teamId) : null)}`,
        );
      }
    }
  }
  parts.push(`${tr('Tiempo')} ${draft.period} · ${draft.minute}′`);
  return parts.join(' · ');
}
