import { VoicePreparation } from '../components/VoicePreparation';
import { useVoiceSetup } from '../voice/setup';
import { tr } from '../i18n';
import { useState } from 'react';
import { ArrowRight, Plus } from 'lucide-react';
import { repo, type TeamChoice } from '../data/database';
import { type Snapshot } from '../domain/model';
import { ErrorMessage, PageTitle, navigate, useAction } from '../components/ui';
import { todayDateString } from '../presentation/matches';

function TeamPicker({
  label,
  data,
  value,
  change,
}: {
  label: string;
  data: Snapshot;
  value: TeamChoice;
  change: (v: TeamChoice) => void;
}) {
  const isNew = value.name !== undefined;
  return (
    <fieldset className="team-picker">
      <legend>{label}</legend>
      <div className="picker-row">
        {isNew ? (
          <input
            aria-label={label}
            placeholder={tr('Nombre del nuevo equipo')}
            value={value.name}
            maxLength={100}
            onChange={(e) => change({ name: e.target.value })}
          />
        ) : (
          <select
            aria-label={label}
            value={value.id}
            onChange={(e) => change({ id: e.target.value })}
          >
            <option value="">{tr('Seleccionar equipo')}</option>
            {data.teams
              .filter((t) => !t.deletedAt)
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
          </select>
        )}
        <button type="button" onClick={() => change(isNew ? { id: '' } : { name: '' })}>
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
  const [local, setLocal] = useState<TeamChoice>({ id: '' });
  const [visitor, setVisitor] = useState<TeamChoice>({ id: '' });
  const [date, setDate] = useState(todayDateString());
  const action = useAction();
  const setup = useVoiceSetup();
  return (
    <>
      <PageTitle title={tr('Nuevo partido')} subtitle={tr('Lo esencial para empezar.')} />
      <div className="panel form-panel">
        <VoicePreparation />
      </div>
      <form
        className="panel form-panel"
        onSubmit={(e) => {
          e.preventDefault();
          action.run(async () => {
            if (setup.phase !== 'ready' || !setup.languageChosen) {
              throw new Error(tr('Carga Cactus y elige el idioma antes de iniciar el partido.'));
            }
            const match = await repo.createMatch(local, visitor, date);
            navigate(`/partidos/${match.id}`);
          });
        }}
      >
        <TeamPicker label={tr('Equipo 1 (nuestro)')} data={data} value={local} change={setLocal} />
        <div className="versus">
          <span>VS</span>
        </div>
        <TeamPicker
          label={tr('Equipo 2 (rival)')}
          data={data}
          value={visitor}
          change={setVisitor}
        />
        <label>
          {tr('Fecha')}
          <input type="date" value={date} required onChange={(e) => setDate(e.target.value)} />
        </label>
        <ErrorMessage text={action.error} />
        <button
          className="primary full"
          disabled={
            action.busy ||
            setup.phase !== 'ready' ||
            !setup.languageChosen ||
            !(local.id || local.name?.trim()) ||
            !(visitor.id || visitor.name?.trim())
          }
        >
          {action.busy ? tr('Creando…') : tr('Iniciar partido')}
          <ArrowRight size={18} />
        </button>
        <p className="caption">{tr('No necesitas una plantilla para registrar el partido.')}</p>
      </form>
    </>
  );
}

export { NewMatch };
