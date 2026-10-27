import { CircleCheck, CircleX, TriangleAlert } from 'lucide-react';
import { tr } from '../../i18n';
import type { EventDraft } from '../../data/database';
import type { Snapshot } from '../../domain/schema';
import { definitions } from '../../domain/event-definitions';
import { relatedTeam } from '../../domain/events';
import type { PracticeEvaluation } from '../../voice/practice/evaluate';
import type { RefObject } from 'react';

export function PracticeResult({
  draft,
  data,
  evaluation,
  assisted,
  resultRef,
}: {
  draft: EventDraft;
  data: Snapshot;
  evaluation: PracticeEvaluation;
  assisted: boolean;
  resultRef: RefObject<HTMLElement | null>;
}) {
  const { state, missing, wrong, issues } = evaluation;
  const Icon = state === 'green' ? CircleCheck : state === 'amber' ? TriangleAlert : CircleX;
  const definition = draft.type ? definitions[draft.type] : null;
  const team = (id: string | null) =>
    data.teams.find((team) => team.id === id)?.name ?? tr('Sin identificar');
  const participant = (id: string | null, dorsal: string) => {
    if (dorsal === '') return tr('Sin identificar');
    const player = data.players.find(
      (player) => player.teamId === id && player.dorsal === Number(dorsal),
    );
    return `#${Number(dorsal)}${player?.name ? ' · ' + player.name : ''} · ${team(id)}`;
  };
  const relatedId =
    draft.teamId && draft.type ? relatedTeam(data.matches[0], draft.type, draft.teamId) : null;
  return (
    <section
      ref={resultRef}
      tabIndex={-1}
      className={`practice-result ${state}`}
      aria-label={tr('Resultado del reto')}
    >
      <div className="practice-state" role="status">
        <Icon size={28} aria-hidden="true" />
        <strong>
          {tr(
            state === 'green'
              ? assisted
                ? 'Completado con ayuda'
                : 'Reconocido por voz'
              : state === 'amber'
                ? 'Válida · revisa los detalles'
                : 'Necesita revisión',
          )}
        </strong>
      </div>
      {state === 'green' ? (
        <p>{tr('Reto completo. Los datos coinciden con la jugada propuesta.')}</p>
      ) : (
        <>
          {state === 'amber' && (
            <p>{tr('La jugada puede registrarse, pero aún falta completar el reto.')}</p>
          )}
          {wrong.length > 0 && (
            <p>
              {tr('No coincide con el reto; revisa: {fields}.', {
                fields: wrong.map((field) => tr(field)).join(', '),
              })}
            </p>
          )}
          {missing.length > 0 && (
            <p>
              {tr('Para completar el reto falta: {fields}.', {
                fields: missing.map((field) => tr(field)).join(', '),
              })}
            </p>
          )}
          {issues.length > 0 && (
            <ul>
              {issues.map((issue) => (
                <li key={issue}>{tr(issue)}</li>
              ))}
            </ul>
          )}
        </>
      )}
      <dl className="practice-fields">
        <dt>{tr('Evento')}</dt>
        <dd>{tr(definition?.label ?? 'Evento sin indicar')}</dd>
        {draft.type !== 'note' && (
          <>
            <dt>{tr('Equipo')}</dt>
            <dd>{team(draft.teamId)}</dd>
          </>
        )}
        {definition && !['note', 'passive'].includes(draft.type!) && (
          <>
            <dt>{tr(definition.principal)}</dt>
            <dd>{participant(draft.teamId, draft.primaryDorsal)}</dd>
            {definition.related &&
              (draft.relatedDorsal !== '' || evaluation.missing.includes(definition.related)) && (
                <>
                  <dt>{tr(definition.related)}</dt>
                  <dd>{participant(relatedId, draft.relatedDorsal)}</dd>
                </>
              )}
          </>
        )}
      </dl>
      {draft.metadata.penalty && (
        <p>
          {tr('De penalti')}: {tr('Sí')}
        </p>
      )}
      {draft.metadata.blue && (
        <p>
          {tr('Tarjeta azul')}: {tr('Sí')}
        </p>
      )}
      {draft.metadata.infraction && (
        <p>
          {tr('Tipo de infracción')}: {tr(draft.metadata.infraction)}
        </p>
      )}
      {draft.rawText.trim() && <p className="practice-transcript">{draft.rawText}</p>}
    </section>
  );
}
