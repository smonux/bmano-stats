import { VoicePreparation } from '../components/VoicePreparation';
import { useVoiceSetup } from '../voice/setup';
import { tr } from '../i18n';
import { useRef, useState } from 'react';
import { ArrowRight, Plus } from 'lucide-react';
import { repo, type TeamChoice } from '../data/database';
import { type Snapshot } from '../domain/model';
import { ErrorMessage, PageTitle, navigate, useAction } from '../components/ui';
import { lastOurTeam, todayDateString } from '../presentation/matches';
import { WheelPicker } from '../components/WheelPicker';
function TeamPicker({
  label,
  data,
  value,
  change,
  id,
}: {
  label: string;
  data: Snapshot;
  value: TeamChoice;
  change: (v: TeamChoice) => void;
  id: string;
}) {
  const isNew = value.name !== undefined;
  return (
    <fieldset id={id} className="team-picker">
      <legend>{label}</legend>
      <div className="picker-row">
        {isNew ? (
          <input
            aria-label={label}
            placeholder={tr('Nombre del nuevo equipo')}
            value={value.name}
            maxLength={100}
            onChange={(inputEvent) =>
              change({
                name: inputEvent.target.value,
              })
            }
          />
        ) : (
          <WheelPicker
            label={label}
            hideLabel
            value={value.id}
            options={[
              {
                value: '',
                label: tr('Seleccionar equipo'),
              },
              ...data.teams
                .filter((team) => !team.deletedAt)
                .map((team) => ({
                  value: team.id,
                  label: team.name,
                })),
            ]}
            change={(id) =>
              change({
                id,
              })
            }
          />
        )}
        <button
          type="button"
          onClick={() =>
            change(
              isNew
                ? {
                    id: '',
                  }
                : {
                    name: '',
                  },
            )
          }
        >
          {isNew ? (
            tr('Catálogo')
          ) : (
            <>
              <Plus size={16} /> {tr('Nuevo')}
            </>
          )}
        </button>
      </div>
      <small>
        {isNew
          ? tr('Solo hace falta el nombre. Los jugadores se añaden después.')
          : tr('Elige un equipo o crea uno nuevo.')}
      </small>
    </fieldset>
  );
}
function NewMatch({ data }: { data: Snapshot }) {
  const [local, setLocal] = useState<TeamChoice>(() => ({ id: lastOurTeam(data) }));
  const [visitor, setVisitor] = useState<TeamChoice>({
    id: '',
  });
  const [date, setDate] = useState(todayDateString());
  const action = useAction();
  const setup = useVoiceSetup();
  const form = useRef<HTMLFormElement>(null);
  const voiceReady = setup.phase === 'ready' && setup.languageChosen;
  const hasOurTeam = Boolean(local.id || local.name?.trim());
  const hasRival = Boolean(visitor.id || visitor.name?.trim());
  const sameTeam = Boolean(local.id && local.id === visitor.id);
  const teamsReady = hasOurTeam && hasRival && !sameTeam && Boolean(date);
  const focusChoice = (id: string) => {
    document.getElementById(id)?.querySelector<HTMLElement>('input, [role="listbox"]')?.focus();
  };
  const create = (mode: 'voice' | 'manual') => {
    if (!form.current?.reportValidity()) return;
    void action.run(async () => {
      if (mode === 'voice' && !voiceReady) {
        throw new Error(
          tr('Carga el reconocimiento de voz y elige el idioma antes de iniciar el partido.'),
        );
      }
      const match = await repo.createMatch(local, visitor, date);
      navigate(`/partidos/${match.id}`);
    });
  };
  return (
    <>
      <PageTitle title={tr('Nuevo partido')} subtitle={tr('Lo esencial para empezar.')} />
      {!setup.configured ? (
        <div className="panel form-panel">
          <VoicePreparation />
        </div>
      ) : setup.phase !== 'ready' ? (
        <div className="panel" role="status">
          <p>
            {tr(
              ['checking', 'cached', 'loading'].includes(setup.phase)
                ? 'Preparando reconocimiento de voz desde este dispositivo…'
                : 'La voz necesita atención. Puedes iniciar con entrada manual.',
            )}
          </p>
          {setup.error && <ErrorMessage text={setup.error} />}
          <a href="#/ajustes">{tr('Revisar reconocimiento de voz en Ajustes')}</a>
        </div>
      ) : null}
      <form
        ref={form}
        className="panel form-panel"
        onSubmit={(inputEvent) => {
          inputEvent.preventDefault();
          create('voice');
        }}
      >
        <TeamPicker
          id="our-team-choice"
          label={tr('Equipo 1 (nuestro)')}
          data={data}
          value={local}
          change={setLocal}
        />
        <div className="versus">
          <span>VS</span>
        </div>
        <TeamPicker
          id="rival-team-choice"
          label={tr('Equipo 2 (rival)')}
          data={data}
          value={visitor}
          change={setVisitor}
        />
        <label>
          {tr('Fecha')}
          <input
            id="match-date"
            type="date"
            value={date}
            required
            onChange={(inputEvent) => setDate(inputEvent.target.value)}
          />
        </label>
        <ErrorMessage text={action.error} />
        <div className="start-requirements">
          {!hasOurTeam && (
            <button type="button" onClick={() => focusChoice('our-team-choice')}>
              {tr('Elige nuestro equipo')}
            </button>
          )}
          {(!hasRival || sameTeam) && (
            <button type="button" onClick={() => focusChoice('rival-team-choice')}>
              {tr(sameTeam ? 'Elige un rival diferente' : 'Elige el equipo rival')}
            </button>
          )}
          {!date && (
            <button type="button" onClick={() => document.getElementById('match-date')?.focus()}>
              {tr('Elige la fecha')}
            </button>
          )}
          {!voiceReady && (
            <p className="caption">
              {tr(
                'La voz necesita preparación. Puedes iniciar solo con entrada manual y prepararla después en Ajustes.',
              )}
            </p>
          )}
        </div>
        <button className="primary full" disabled={action.busy || !voiceReady || !teamsReady}>
          {action.busy ? tr('Creando…') : tr('Iniciar partido')}
          <ArrowRight size={18} />
        </button>
        {!voiceReady && (
          <button
            type="button"
            className="full"
            disabled={action.busy || !teamsReady}
            onClick={() => create('manual')}
          >
            {tr('Iniciar solo con entrada manual')}
          </button>
        )}
        <p className="caption">{tr('No necesitas una plantilla para registrar el partido.')}</p>
      </form>
    </>
  );
}
export { NewMatch };
