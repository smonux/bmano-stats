import { DialogForm } from '../components/ui/DialogForm';
import { ShirtNumberPicker } from '../components/ShirtNumberPicker';
import { tr } from '../i18n';
import { useId, useState } from 'react';
import { ChevronRight, Plus, Pencil, Search } from 'lucide-react';
import { repo } from '../data/database';
import { type Snapshot } from '../domain/model';
import { Empty, Modal, PageTitle, navigate, useAction } from '../components/ui';
function Teams({ data, id }: { data: Snapshot; id?: string }) {
  const errorId = useId();
  const [query, setQuery] = useState('');
  const [add, setAdd] = useState(false);
  const [name, setName] = useState('');
  const [editing, setEditing] = useState<{
    id?: string;
    dorsal: string;
    name: string;
    isGoalkeeper: boolean;
  } | null>(null);
  const action = useAction();
  const team = data.teams.find((team) => team.id === id);
  const [rename, setRename] = useState<string | null>(null);
  if (id && !team) {
    return (
      <Empty title={tr('Equipo no encontrado')}>
        <button onClick={() => navigate('/equipos')}>{tr('Volver a equipos')}</button>
      </Empty>
    );
  }
  const players = data.players
    .filter((player) => player.teamId === id && !player.isUnknown && !player.deletedAt)
    .sort((a, b) => a.dorsal! - b.dorsal!);
  const visibleTeams = data.teams.filter(
    (team) => !team.deletedAt && team.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
  );
  return (
    <>
      <PageTitle
        title={team?.name ?? tr('Equipos')}
        subtitle={
          team
            ? tr('Una plantilla abierta. Completa los nombres cuando quieras.')
            : tr('Conocidos de siempre. Rivales por descubrir.')
        }
        back={team ? '/equipos' : '/'}
      >
        <button
          className="primary"
          onClick={() =>
            team
              ? setEditing({
                  dorsal: '',
                  name: '',
                  isGoalkeeper: false,
                })
              : setAdd(true)
          }
        >
          <Plus size={18} />
          {team ? tr('Jugador') : tr('Equipo')}
        </button>
      </PageTitle>
      {team ? (
        <section className="panel">
          <div className="section-heading">
            <h2>
              {tr('Jugadores')} <span className="muted">{players.length}</span>
            </h2>
            <button className="text-button" onClick={() => setRename(team.name)}>
              <Pencil size={15} /> {tr('Nombre del equipo')}
            </button>
          </div>
          {players.length ? (
            players.map((player) => (
              <button
                className="list-row"
                key={player.id}
                onClick={() =>
                  setEditing({
                    id: player.id,
                    dorsal: String(player.dorsal),
                    name: player.name,
                    isGoalkeeper: Boolean(player.isGoalkeeper),
                  })
                }
              >
                <b className="jersey">{player.dorsal}</b>
                <span>
                  <strong>{player.name || tr('Nombre pendiente')}</strong>
                  <small>
                    {player.isGoalkeeper && <>{tr('Portero')} · </>}
                    {tr('Dorsal fijo · toca para editar el nombre')}
                  </small>
                </span>
                <ChevronRight size={18} />
              </button>
            ))
          ) : (
            <Empty title={tr('Todavía sin jugadores')}>
              <p>
                {tr('Introduce un dorsal al registrar un evento y lo añadiremos automáticamente.')}
              </p>
            </Empty>
          )}
        </section>
      ) : (
        <>
          <div className="search-field">
            <Search size={19} />
            <input
              aria-label={tr('Buscar equipo')}
              placeholder={tr('Buscar equipo…')}
              value={query}
              onChange={(inputEvent) => setQuery(inputEvent.target.value)}
            />
          </div>
          <section className="panel">
            {visibleTeams.map((team) => (
              <button
                className="list-row"
                key={team.id}
                onClick={() => navigate(`/equipos/${team.id}`)}
              >
                <span className="team-avatar">{team.name.slice(0, 2).toUpperCase()}</span>
                <span>
                  <strong>{team.name}</strong>
                  <small>
                    {
                      data.players.filter(
                        (player) =>
                          player.teamId === team.id && !player.isUnknown && !player.deletedAt,
                      ).length
                    }{' '}
                    {tr('jugadores identificados')}
                  </small>
                </span>
                <ChevronRight size={18} />
              </button>
            ))}
            {!visibleTeams.length && (
              <Empty title={query ? tr('Sin coincidencias') : tr('Tu primer equipo')}>
                <p>
                  {query
                    ? tr('Prueba con otro nombre.')
                    : tr('Añade un equipo. Los dorsales pueden llegar después.')}
                </p>
              </Empty>
            )}
          </section>
        </>
      )}
      {add && (
        <Modal
          className="form-dialog"
          title={tr('Nuevo equipo')}
          close={() => !action.busy && setAdd(false)}
        >
          <DialogForm
            error={action.error}
            errorId={errorId}
            busy={action.busy}
            actions={
              <>
                <button type="button" disabled={action.busy} onClick={() => setAdd(false)}>
                  {tr('Cancelar')}
                </button>
                <button className="primary" disabled={action.busy}>
                  {tr('Crear equipo')}
                </button>
              </>
            }
            onSubmit={(inputEvent) => {
              inputEvent.preventDefault();
              action.run(async () => {
                const team = await repo.addTeam(name);
                setAdd(false);
                setName('');
                navigate(`/equipos/${team.id}`);
              });
            }}
          >
            <label>
              {tr('Nombre del equipo')}
              <input
                autoFocus
                aria-invalid={!!action.error || undefined}
                aria-describedby={action.error ? errorId : undefined}
                required
                maxLength={100}
                value={name}
                onChange={(inputEvent) => setName(inputEvent.target.value)}
              />
            </label>
          </DialogForm>
        </Modal>
      )}
      {rename !== null && team && (
        <Modal
          className="form-dialog"
          title={tr('Nombre del equipo')}
          close={() => !action.busy && setRename(null)}
        >
          <DialogForm
            error={action.error}
            errorId={errorId}
            busy={action.busy}
            actions={
              <>
                <button type="button" disabled={action.busy} onClick={() => setRename(null)}>
                  {tr('Cancelar')}
                </button>
                <button className="primary" disabled={action.busy}>
                  {tr('Guardar nombre')}
                </button>
              </>
            }
            onSubmit={(inputEvent) => {
              inputEvent.preventDefault();
              action.run(async () => {
                await repo.renameTeam(team.id, rename);
                setRename(null);
              });
            }}
          >
            <label>
              {tr('Nombre')}
              <input
                value={rename}
                onChange={(inputEvent) => setRename(inputEvent.target.value)}
                aria-invalid={!!action.error || undefined}
                aria-describedby={action.error ? errorId : undefined}
                required
                maxLength={100}
              />
            </label>
          </DialogForm>
        </Modal>
      )}
      {editing && team && (
        <Modal
          className="form-dialog"
          title={tr('Jugador')}
          close={() => !action.busy && setEditing(null)}
        >
          <DialogForm
            error={action.error}
            errorId={errorId}
            busy={action.busy}
            actions={
              <>
                <button type="button" disabled={action.busy} onClick={() => setEditing(null)}>
                  {tr('Cancelar')}
                </button>
                <button className="primary" disabled={action.busy}>
                  {tr('Guardar jugador')}
                </button>
              </>
            }
            onSubmit={(inputEvent) => {
              inputEvent.preventDefault();
              action.run(async () => {
                await repo.savePlayer(team.id, editing.dorsal, editing.name, editing.isGoalkeeper);
                setEditing(null);
              });
            }}
          >
            <div className="filter-row">
              <ShirtNumberPicker
                label={tr('Dorsal')}
                errorId={action.error ? errorId : undefined}
                value={editing.dorsal}
                disabled={Boolean(editing.id)}
                change={(dorsal) => setEditing({ ...editing, dorsal })}
              />
              <label>
                {tr('Nombre (opcional)')}
                <input
                  maxLength={100}
                  value={editing.name}
                  onChange={(inputEvent) =>
                    setEditing({
                      ...editing,
                      name: inputEvent.target.value,
                    })
                  }
                />
              </label>
            </div>
            <label className="goalkeeper-option">
              <input
                type="checkbox"
                checked={editing.isGoalkeeper}
                onChange={(event) => setEditing({ ...editing, isGoalkeeper: event.target.checked })}
              />
              {tr('Portero')}
            </label>
            <p className="caption">
              {tr('Un dorsal identifica siempre al mismo jugador dentro de su equipo.')}
            </p>
          </DialogForm>
        </Modal>
      )}
    </>
  );
}
export { Teams };
