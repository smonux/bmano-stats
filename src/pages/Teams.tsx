import { tr } from '../i18n';
import { useState } from 'react';
import { ChevronRight, Plus, Pencil, Search } from 'lucide-react';
import { repo } from '../data/database';
import { type Snapshot } from '../domain/model';
import { Empty, ErrorMessage, Modal, PageTitle, navigate, useAction } from '../components/ui';

function Teams({ data, id }: { data: Snapshot; id?: string }) {
  const [query, setQuery] = useState('');
  const [add, setAdd] = useState(false);
  const [name, setName] = useState('');
  const [editing, setEditing] = useState<{ id?: string; dorsal: string; name: string } | null>(
    null,
  );
  const action = useAction();
  const team = data.teams.find((t) => t.id === id);
  const [rename, setRename] = useState<string | null>(null);
  if (id && !team) {
    return (
      <Empty title={tr('Equipo no encontrado')}>
        <button onClick={() => navigate('/equipos')}>{tr('Volver a equipos')}</button>
      </Empty>
    );
  }
  const players = data.players
    .filter((p) => p.teamId === id && !p.isUnknown && !p.deletedAt)
    .sort((a, b) => a.dorsal! - b.dorsal!);
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
          onClick={() => (team ? setEditing({ dorsal: '', name: '' }) : setAdd(true))}
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
            players.map((p) => (
              <button
                className="list-row"
                key={p.id}
                onClick={() => setEditing({ id: p.id, dorsal: String(p.dorsal), name: p.name })}
              >
                <b className="jersey">{p.dorsal}</b>
                <span>
                  <strong>{p.name || tr('Nombre pendiente')}</strong>
                  <small>{tr('Dorsal fijo · toca para editar el nombre')}</small>
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
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <section className="panel">
            {data.teams
              .filter(
                (t) =>
                  !t.deletedAt && t.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
              )
              .map((t) => (
                <button
                  className="list-row"
                  key={t.id}
                  onClick={() => navigate(`/equipos/${t.id}`)}
                >
                  <span className="team-avatar">{t.name.slice(0, 2).toUpperCase()}</span>
                  <span>
                    <strong>{t.name}</strong>
                    <small>
                      {
                        data.players.filter(
                          (p) => p.teamId === t.id && !p.isUnknown && !p.deletedAt,
                        ).length
                      }{' '}
                      {tr('jugadores identificados')}
                    </small>
                  </span>
                  <ChevronRight size={18} />
                </button>
              ))}
            {!data.teams.filter(
              (t) => !t.deletedAt && t.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
            ).length && (
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
        <Modal title={tr('Nuevo equipo')} close={() => !action.busy && setAdd(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              action.run(async () => {
                const t = await repo.addTeam(name);
                setAdd(false);
                setName('');
                navigate(`/equipos/${t.id}`);
              });
            }}
          >
            <label>
              {tr('Nombre del equipo')}
              <input
                autoFocus
                required
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <ErrorMessage text={action.error} />
            <button className="primary full" disabled={action.busy}>
              {tr('Crear equipo')}
            </button>
          </form>
        </Modal>
      )}
      {rename !== null && team && (
        <Modal title={tr('Nombre del equipo')} close={() => !action.busy && setRename(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
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
                onChange={(e) => setRename(e.target.value)}
                required
                maxLength={100}
              />
            </label>
            <ErrorMessage text={action.error} />
            <button className="primary full" disabled={action.busy}>
              {tr('Guardar nombre')}
            </button>
          </form>
        </Modal>
      )}
      {editing && team && (
        <Modal title={tr('Jugador')} close={() => !action.busy && setEditing(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              action.run(async () => {
                await repo.savePlayer(team.id, editing.dorsal, editing.name);
                setEditing(null);
              });
            }}
          >
            <div className="filter-row">
              <label>
                {tr('Dorsal')}
                <input
                  aria-label={tr('Dorsal')}
                  required
                  inputMode="numeric"
                  pattern="[0-9]{1,2}"
                  maxLength={2}
                  value={editing.dorsal}
                  onChange={(e) => setEditing({ ...editing, dorsal: e.target.value })}
                  readOnly={Boolean(editing.id)}
                />
              </label>
              <label>
                {tr('Nombre (opcional)')}
                <input
                  maxLength={100}
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                />
              </label>
            </div>
            <p className="caption">
              {tr('Un dorsal identifica siempre al mismo jugador dentro de su equipo.')}
            </p>
            <ErrorMessage text={action.error} />
            <button className="primary full" disabled={action.busy}>
              {tr('Guardar jugador')}
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}

export { Teams };
