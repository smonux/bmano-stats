import { VoicePreparation } from './components/VoicePreparation';
import { useVoiceSetup, refreshVoiceFiles } from './voice/setup';
import { Welcome, LanguagePicker, hasSeenWelcome } from './components/Welcome';
import { ExclusionTimers } from './components/ExclusionTimers';
import { tr, useLanguage, getLanguage } from './i18n';
import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Activity,
  ArrowRight,
  BarChart3,
  CalendarDays,
  Check,
  ChevronRight,
  Download,
  Home,
  Mic,
  Pause,
  Play,
  Plus,
  Settings,
  ShieldCheck,
  Trash2,
  Upload,
  Users,
  Flag,
  Pencil,
  Search,
} from 'lucide-react';
import { db, repo, type TeamChoice } from './data/database';
import {
  chronological,
  definitions,
  elapsed,
  eventState,
  type Backup,
  type GameEvent,
  type Match,
  type Snapshot,
} from './domain/model';
import { calculate } from './domain/statistics';
import {
  Confirm,
  Empty,
  ErrorMessage,
  Modal,
  PageTitle,
  navigate,
  useAction,
  useRoute,
} from './components/ui';
import { VoiceCapture } from './components/VoiceCapture';
import { EventEditor } from './components/EventEditor';
import { Statistics } from './components/Statistics';
import { backupZip, readBackupFile } from './data/backup-files';

const teamName = (data: Snapshot, id: string) =>
  data.teams.find((t) => t.id === id)?.name ?? tr('Equipo');
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const dateLabel = (date: string) =>
  new Date(date + 'T12:00:00').toLocaleDateString(getLanguage(), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
const score = (data: Snapshot, m: Match) => {
  const s = calculate([m], data.events, data.players);
  return [s.teams[m.localTeamId]?.goals ?? 0, s.teams[m.visitorTeamId]?.goals ?? 0];
};

function MatchCard({ data, match }: { data: Snapshot; match: Match }) {
  const [a, b] = score(data, match);
  return (
    <button className="match-card" onClick={() => navigate(`/partidos/${match.id}`)}>
      <div className="match-card-top">
        <span>{dateLabel(match.date)}</span>
        <span className={`badge ${match.status === 'active' ? 'live' : ''}`}>
          {match.status === 'active' ? tr('En curso') : tr('Finalizado')}
        </span>
      </div>
      <div className="match-card-score">
        <div>
          <span>{teamName(data, match.localTeamId)}</span>
          <span>{teamName(data, match.visitorTeamId)}</span>
        </div>
        <div className="score-small">
          <strong>{a}</strong>
          <strong>{b}</strong>
        </div>
        <ChevronRight size={20} />
      </div>
    </button>
  );
}
function Dashboard({ data }: { data: Snapshot }) {
  const active = data.matches.filter((m) => !m.deletedAt && m.status === 'active');
  const total = data.matches.filter((m) => !m.deletedAt).length;
  return (
    <>
      <div className="home-heading">
        <span className="eyebrow">{tr('A PIE DE PISTA')}</span>
        <h1>{tr('Cada jugada cuenta.')}</h1>
        <p>
          {tr('Menos tiempo anotando.')}
          <br />
          {tr('Más atención en el partido.')}
        </p>
      </div>
      <div className="dashboard-grid">
        <button className="new-match-card" onClick={() => navigate('/nuevo')}>
          <div className="court" aria-hidden="true">
            <span />
            <i />
            <b />
          </div>
          <span className="round-plus">
            <Plus size={26} />
          </span>
          <span className="card-copy">
            <span className="eyebrow">{tr('LISTOS PARA EMPEZAR')}</span>
            <strong>{tr('Nuevo partido')}</strong>
            <span>{tr('Dos equipos. Un partido. Todo por registrar.')}</span>
          </span>
          <ArrowRight className="card-arrow" />
        </button>
        <button className="nav-card" onClick={() => navigate('/equipos')}>
          <Users />
          <strong>{tr('Equipos')}</strong>
          <span>{tr('Jugadores y dorsales')}</span>
          <span className="card-count">
            {data.teams.filter((t) => !t.deletedAt).length} {tr('equipos')} <ArrowRight size={17} />
          </span>
        </button>
        <button className="nav-card" onClick={() => navigate('/partidos')}>
          <CalendarDays />
          <strong>{tr('Partidos')}</strong>
          <span>{tr('Histórico y edición')}</span>
          <span className="card-count">
            {total} {tr('partidos')} <ArrowRight size={17} />
          </span>
        </button>
        <button className="statistics-card" onClick={() => navigate('/estadisticas')}>
          <span className="soft-icon">
            <BarChart3 />
          </span>
          <span>
            <strong>{tr('Estadísticas')}</strong>
            <small>{tr('El partido, en números.')}</small>
          </span>
          <ArrowRight />
        </button>
      </div>
      {active.length > 0 && (
        <section className="section">
          <div className="section-heading">
            <h2>{tr('Volver a la pista')}</h2>
            <span className="badge live">
              {active.length} {tr('en curso')}
            </span>
          </div>
          <div className="match-grid">
            {active.map((m) => (
              <MatchCard key={m.id} data={data} match={m} />
            ))}
          </div>
        </section>
      )}
      <div className="local-note">
        <ShieldCheck size={19} />
        <p>
          <strong>{tr('Tus datos se quedan contigo.')}</strong>
          <span>{tr('Guardado local, sin cuenta. Exporta una copia desde Ajustes.')}</span>
        </p>
      </div>
    </>
  );
}
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
  const [local, setLocal] = useState<TeamChoice>({ id: '' }),
    [visitor, setVisitor] = useState<TeamChoice>({ id: '' });
  const [date, setDate] = useState(today());
  const a = useAction();
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
          a.run(async () => {
            if (setup.phase !== 'ready' || !setup.languageChosen)
              throw new Error(tr('Carga Cactus y elige el idioma antes de iniciar el partido.'));
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
        <ErrorMessage text={a.error} />
        <button
          className="primary full"
          disabled={
            a.busy ||
            setup.phase !== 'ready' ||
            !setup.languageChosen ||
            !(local.id || local.name?.trim()) ||
            !(visitor.id || visitor.name?.trim())
          }
        >
          {a.busy ? tr('Creando…') : tr('Iniciar partido')}
          <ArrowRight size={18} />
        </button>
        <p className="caption">{tr('No necesitas una plantilla para registrar el partido.')}</p>
      </form>
    </>
  );
}
function Teams({ data, id }: { data: Snapshot; id?: string }) {
  const [query, setQuery] = useState(''),
    [add, setAdd] = useState(false),
    [name, setName] = useState('');
  const [editing, setEditing] = useState<{ id?: string; dorsal: string; name: string } | null>(
    null,
  );
  const a = useAction();
  const team = data.teams.find((t) => t.id === id);
  const [rename, setRename] = useState<string | null>(null);
  if (id && !team)
    return (
      <Empty title={tr('Equipo no encontrado')}>
        <button onClick={() => navigate('/equipos')}>{tr('Volver a equipos')}</button>
      </Empty>
    );
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
        <Modal title={tr('Nuevo equipo')} close={() => !a.busy && setAdd(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              a.run(async () => {
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
            <ErrorMessage text={a.error} />
            <button className="primary full" disabled={a.busy}>
              {tr('Crear equipo')}
            </button>
          </form>
        </Modal>
      )}
      {rename !== null && team && (
        <Modal title={tr('Nombre del equipo')} close={() => !a.busy && setRename(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              a.run(async () => {
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
            <ErrorMessage text={a.error} />
            <button className="primary full" disabled={a.busy}>
              {tr('Guardar nombre')}
            </button>
          </form>
        </Modal>
      )}
      {editing && team && (
        <Modal title={tr('Jugador')} close={() => !a.busy && setEditing(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              a.run(async () => {
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
            <ErrorMessage text={a.error} />
            <button className="primary full" disabled={a.busy}>
              {tr('Guardar jugador')}
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
function Matches({ data }: { data: Snapshot }) {
  const [query, setQuery] = useState('');
  const matches = data.matches
    .filter(
      (m) =>
        !m.deletedAt &&
        `${teamName(data, m.localTeamId)} ${teamName(data, m.visitorTeamId)}`
          .toLocaleLowerCase()
          .includes(query.toLocaleLowerCase()),
    )
    .sort(
      (a, b) =>
        Number(b.status === 'active') - Number(a.status === 'active') ||
        b.date.localeCompare(a.date) ||
        b.createdAt - a.createdAt,
    );
  return (
    <>
      <PageTitle title={tr('Partidos')} subtitle={tr('Cada encuentro, a mano.')} />
      <div className="search-field">
        <Search size={19} />
        <input
          aria-label={tr('Buscar partido por equipo')}
          placeholder={tr('Buscar equipo…')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {matches.length ? (
        <div className="match-grid">
          {matches.map((m) => (
            <MatchCard key={m.id} data={data} match={m} />
          ))}
        </div>
      ) : (
        <Empty title={tr('Todavía no hay partidos')}>
          <p>{tr('Crea un encuentro para empezar a registrar.')}</p>
          <button className="primary" onClick={() => navigate('/nuevo')}>
            {tr('Nuevo partido')}
          </button>
        </Empty>
      )}
    </>
  );
}
function MatchView({ data, match }: { data: Snapshot; match: Match }) {
  const [tab, setTab] = useState('events'),
    [editing, setEditing] = useState<GameEvent | 'new' | null>(null),
    [pendingOnly, setPendingOnly] = useState(false);
  const [confirm, setConfirm] = useState<'period' | 'finish' | 'delete' | GameEvent | null>(null);
  const [counterDialog, setCounterDialog] = useState(false);
  const a = useAction();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const events = data.events
    .filter((e) => e.matchId === match.id && !e.deletedAt)
    .sort(chronological)
    .reverse();
  const pending = events.filter((e) => eventState(e, match, data.players) === 'pending').length;
  const scores = score(data, match);
  return (
    <>
      <div className="match-page-title">
        <PageTitle
          title={match.status === 'active' ? tr('Partido en curso') : tr('Detalle del partido')}
          subtitle={dateLabel(match.date)}
          back="/partidos"
        >
          <span className={`badge ${match.status === 'active' ? 'live' : ''}`}>
            {match.status === 'active' ? tr('En curso') : tr('Finalizado')}
          </span>
        </PageTitle>
      </div>
      <section className="match-header panel">
        <div className="scoreboard">
          <div>
            <span className="eyebrow">{tr('EQUIPO 1 · NOSOTROS')}</span>
            <h2>{teamName(data, match.localTeamId)}</h2>
          </div>
          <strong
            aria-label={tr('Marcador {a} a {b}', { a: scores[0], b: scores[1] })}
            className="score"
          >
            {scores[0]}
            <span>:</span>
            {scores[1]}
          </strong>
          <div>
            <span className="eyebrow">{tr('EQUIPO 2 · RIVAL')}</span>
            <h2>{teamName(data, match.visitorTeamId)}</h2>
          </div>
        </div>
        <div className="clock-row">
          <div>
            <span className={match.clock.startedAt === null ? 'clock-dot paused' : 'clock-dot'} />
            <strong>
              {tr('Tiempo')} {match.clock.period}
            </strong>
            <span className="minute" role="timer" aria-label={tr('Reloj del partido')}>
              {String(Math.floor(elapsed(match.clock, now) / 60000)).padStart(2, '0')}:
              {String(Math.floor(elapsed(match.clock, now) / 1000) % 60).padStart(2, '0')}
            </span>
            {match.clock.startedAt === null && <small>{tr('Pausado')}</small>}
          </div>
          {match.status === 'active' && (
            <div className="clock-actions">
              <button
                disabled={a.busy}
                onClick={() =>
                  a.run(() =>
                    repo.clock(match.id, match.clock.startedAt === null ? 'resume' : 'pause'),
                  )
                }
              >
                {match.clock.startedAt === null ? <Play size={15} /> : <Pause size={15} />}{' '}
                {match.clock.startedAt === null ? tr('Reanudar') : tr('Parar')}
              </button>
              <button onClick={() => setConfirm('period')}>{tr('Nuevo tiempo')}</button>
            </div>
          )}
        </div>
        <ExclusionTimers match={match} data={data} now={now} onDialogChange={setCounterDialog} />
        <div className="tabs" role="tablist" aria-label={tr('Vista del partido')}>
          <button
            role="tab"
            aria-selected={tab === 'events'}
            className={tab === 'events' ? 'selected' : ''}
            onClick={() => setTab('events')}
          >
            {tr('Eventos')} <span>{events.length}</span>
          </button>
          <button
            role="tab"
            aria-selected={tab === 'stats'}
            className={tab === 'stats' ? 'selected' : ''}
            onClick={() => setTab('stats')}
          >
            {tr('Estadísticas')}
          </button>
        </div>
      </section>
      <ErrorMessage text={a.error} />
      {tab === 'stats' ? (
        <section className="panel">
          <Statistics data={data} matchId={match.id} />
        </section>
      ) : (
        <section className="event-feed">
          <div className="section-heading">
            <h2>{tr('Registro de eventos')}</h2>
            <button
              className={`filter-chip ${pendingOnly ? 'active' : ''}`}
              onClick={() => setPendingOnly(!pendingOnly)}
            >
              {pendingOnly ? tr('Ver todos') : tr('{count} pendientes', { count: pending })}
            </button>
          </div>
          {!events.filter((e) => !pendingOnly || eventState(e, match, data.players) === 'pending')
            .length && (
            <Empty
              title={
                pendingOnly ? tr('Sin eventos pendientes') : tr('Empieza con la primera jugada')
              }
            >
              <p>
                {pendingOnly
                  ? tr('Todos los eventos tienen sus datos obligatorios.')
                  : tr('Pulsa «Evento manual». Puedes completar los jugadores después.')}
              </p>
            </Empty>
          )}
          {events
            .filter((e) => !pendingOnly || eventState(e, match, data.players) === 'pending')
            .map((e) => {
              const state = eventState(e, match, data.players);
              const player = data.players.find((p) => p.id === e.primaryPlayerId);
              const incoming = data.players.find((p) => p.id === e.relatedPlayerId);
              return (
                <article
                  key={e.id}
                  className={`event-card ${e.teamId === match.visitorTeamId ? 'away' : 'home'} ${state}`}
                >
                  <div className="event-icon">{e.type ? definitions[e.type].icon : '?'}</div>
                  <div className="event-copy">
                    <div>
                      <strong>
                        {e.type ? tr(definitions[e.type].label) : tr('Evento sin indicar')}
                      </strong>
                      <time>
                        T{e.period} · {e.minute}′
                      </time>
                    </div>
                    <p>
                      {e.teamId ? teamName(data, e.teamId) : tr('Equipo pendiente')}
                      {e.type !== 'passive' && (
                        <>
                          {' '}
                          · {e.type === 'substitution' && `${tr('Sale')} `}
                          {player && !player.isUnknown
                            ? `#${player.dorsal}${player.name ? ' ' + player.name : ''}`
                            : tr('Desconocido')}
                          {e.type === 'substitution' && (
                            <>
                              {' '}
                              → {tr('Entra')}{' '}
                              {incoming && !incoming.isUnknown
                                ? `#${incoming.dorsal}${incoming.name ? ' ' + incoming.name : ''}`
                                : tr('Desconocido')}
                            </>
                          )}
                        </>
                      )}
                    </p>
                    <div className="event-bottom">
                      <span className="caption">
                        {state === 'pending'
                          ? tr('! Pendiente · no computa')
                          : state === 'unidentified'
                            ? tr('✓ Registrado · sin identificar')
                            : tr('✓ Registrado')}
                        {e.metadata.penalty ? ' · 7 m' : ''}
                        {e.metadata.infraction ? ' · ' + tr(e.metadata.infraction) : ''}
                      </span>
                      <button className="text-button" onClick={() => setEditing(e)}>
                        {tr('Editar')}
                      </button>
                      <button
                        className="icon-button delete-event"
                        aria-label={tr('Eliminar {event} del minuto {minute}', {
                          event: tr(e.type ? tr(definitions[e.type].label) : 'Evento'),
                          minute: e.minute,
                        })}
                        onClick={() => setConfirm(e)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
        </section>
      )}
      <div className="capture-bar">
        <button className="primary" onClick={() => setEditing('new')}>
          <Plus size={19} /> {tr('Evento manual')}
        </button>
        <VoiceCapture
          key={match.id}
          data={data}
          match={match}
          allowReview={!editing && !confirm && !counterDialog}
        />
      </div>
      <div className="match-footer">
        {match.status === 'active' && (
          <button className="text-button" onClick={() => setConfirm('finish')}>
            <Flag size={16} /> {tr('Finalizar partido')}
          </button>
        )}
        <button className="text-button danger-text" onClick={() => setConfirm('delete')}>
          <Trash2 size={15} /> {tr('Eliminar partido')}
        </button>
      </div>
      {editing && (
        <EventEditor
          key={editing === 'new' ? 'new' : editing.id}
          data={data}
          match={match}
          event={editing === 'new' ? undefined : editing}
          close={() => setEditing(null)}
        />
      )}{' '}
      {confirm && (
        <Confirm
          danger={confirm === 'delete' || typeof confirm === 'object'}
          title={
            confirm === 'period'
              ? tr('Iniciar tiempo {number}', { number: match.clock.period + 1 })
              : confirm === 'finish'
                ? tr('Finalizar partido')
                : confirm === 'delete'
                  ? tr('Eliminar partido')
                  : tr('Eliminar evento')
          }
          text={
            confirm === 'period'
              ? tr(
                  'El minuto vuelve a cero y comienza el siguiente tiempo. Los eventos anteriores se conservan.',
                )
              : confirm === 'finish'
                ? tr('Se detendrá el reloj. Podrás seguir corrigiendo los eventos del partido.')
                : confirm === 'delete'
                  ? tr(
                      'El partido y sus eventos dejarán de aparecer y de contar en las estadísticas.',
                    )
                  : tr('Se retirarán todas las estadísticas derivadas de esta acción.')
          }
          close={() => setConfirm(null)}
          confirm={async () => {
            if (typeof confirm === 'object') await repo.deleteEvent(confirm.id);
            else if (confirm === 'delete') {
              await repo.deleteMatch(match.id);
              navigate('/partidos');
            } else await repo.clock(match.id, confirm);
          }}
        />
      )}
    </>
  );
}
function SettingsView({ showWelcome }: { showWelcome: () => void }) {
  const a = useAction();
  const [backup, setBackup] = useState<Backup | null>(null);
  const [notice, setNotice] = useState('');
  return (
    <>
      <PageTitle
        title={tr('Tus datos')}
        subtitle={tr('Guardados en este dispositivo. Siempre a tu alcance.')}
      />
      <section className="panel settings-panel">
        <LanguagePicker />
        <VoicePreparation />
        <p className="caption">
          {tr(
            'Interfaz y voz pueden usar idiomas distintos. Los siete idiomas comparten el mismo modelo Whistle.',
          )}
        </p>
        <button onClick={showWelcome}>{tr('Ver bienvenida')}</button>
        <hr />
        <ShieldCheck size={30} />
        <h2>{tr('Una copia, por tranquilidad')}</h2>
        <p className="muted">
          {tr(
            'Exporta todos tus equipos, jugadores, partidos y eventos a un ZIP. Podrás restaurarlo en este u otro dispositivo.',
          )}
        </p>
        <button
          className="primary"
          disabled={a.busy}
          onClick={() =>
            a.run(async () => {
              const data = await repo.exportBackup();
              const bytes = await backupZip(data);
              const url = URL.createObjectURL(
                new Blob([new Uint8Array(bytes).buffer], { type: 'application/zip' }),
              );
              const el = document.createElement('a');
              el.href = url;
              el.download = `handball-stats-${today()}.zip`;
              el.click();
              setTimeout(() => URL.revokeObjectURL(url), 1000);
              setNotice(tr('Copia exportada. Guarda el archivo en un lugar seguro.'));
            })
          }
        >
          <Download size={18} /> {tr('Exportar copia ZIP')}
        </button>
        <hr />
        <h3>{tr('Restaurar una copia')}</h3>
        <p className="muted">
          {tr('Reemplaza los datos actuales. Primero te mostraremos un resumen para confirmar.')}
        </p>
        <label className="file-label">
          <Upload size={18} /> {tr('Elegir archivo ZIP o JSON')}
          <input
            disabled={a.busy}
            type="file"
            accept=".zip,.json,application/zip,application/x-zip-compressed,application/json"
            aria-label={tr('Importar copia')}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (file)
                a.run(async () => {
                  setBackup(await readBackupFile(file));
                });
            }}
          />
        </label>
        <ErrorMessage text={a.error} />
        {notice && (
          <p className="success" role="status">
            <Check size={16} />
            {notice}
          </p>
        )}
      </section>
      {backup && (
        <Confirm
          title={tr('Restaurar copia')}
          text={tr(
            'Se reemplazarán los datos locales por {teams} equipos, {matches} partidos y {events} eventos. Exporta antes una copia si necesitas conservar lo actual.',
            {
              teams: backup.teams.length,
              matches: backup.matches.length,
              events: backup.events.length,
            },
          )}
          danger
          close={() => setBackup(null)}
          confirm={async () => {
            await repo.importBackup(backup);
            setNotice(tr('Copia restaurada correctamente.'));
          }}
        />
      )}
    </>
  );
}
export default function App() {
  useEffect(() => {
    void refreshVoiceFiles();
  }, []);
  const language = useLanguage();
  const [welcome, setWelcome] = useState(() => !hasSeenWelcome());
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  const data = useLiveQuery(() => db.snapshot(), []);
  const route = useRoute();
  const parts = route.split('/').filter(Boolean);
  const [offline, setOffline] = useState(!navigator.onLine);
  useEffect(() => {
    const change = () => setOffline(!navigator.onLine);
    window.addEventListener('online', change);
    window.addEventListener('offline', change);
    return () => {
      window.removeEventListener('online', change);
      window.removeEventListener('offline', change);
    };
  }, []);
  const nav = [
    { path: '/', label: tr('Inicio'), icon: Home },
    { path: '/equipos', label: tr('Equipos'), icon: Users },
    { path: '/partidos', label: tr('Partidos'), icon: CalendarDays },
    { path: '/estadisticas', label: tr('Estadísticas'), icon: BarChart3 },
  ];
  let page;
  if (!data)
    page = (
      <div className="empty" role="status">
        {tr('Abriendo tus datos…')}
      </div>
    );
  else if (parts[0] === 'nuevo') page = <NewMatch data={data} />;
  else if (parts[0] === 'equipos')
    page = <Teams key={parts[1] ?? 'list'} data={data} id={parts[1]} />;
  else if (parts[0] === 'partidos' && parts[1]) {
    const m = data.matches.find((m) => m.id === parts[1] && !m.deletedAt);
    page = m ? (
      <MatchView key={m.id} data={data} match={m} />
    ) : (
      <Empty title={tr('Partido no encontrado')}>
        <button onClick={() => navigate('/partidos')}>{tr('Ver partidos')}</button>
      </Empty>
    );
  } else if (parts[0] === 'partidos') page = <Matches data={data} />;
  else if (parts[0] === 'estadisticas')
    page = (
      <>
        <PageTitle
          title={tr('Estadísticas')}
          subtitle={tr('Una vista clara de lo que ocurre en pista.')}
        />
        <section className="panel">
          <Statistics data={data} />
        </section>
      </>
    );
  else if (parts[0] === 'ajustes') page = <SettingsView showWelcome={() => setWelcome(true)} />;
  else page = <Dashboard data={data} />;
  return (
    <>
      <header className="app-header">
        <button className="brand" onClick={() => navigate('/')}>
          <span className="brand-mark">
            <Activity size={21} />
          </span>
          <span>
            handball<span className="brand-light">stats</span>
          </span>
        </button>
        <nav className="desktop-nav">
          {nav.map((n) => (
            <button
              key={n.path}
              className={
                (n.path === '/' ? route === '/' : route.startsWith(n.path)) ? 'current' : ''
              }
              onClick={() => navigate(n.path)}
            >
              {n.label}
            </button>
          ))}
        </nav>
        <div className="header-right">
          <span className={`local-status ${offline ? 'is-offline' : ''}`}>
            <span />
            {offline ? tr('Sin conexión') : tr('En este dispositivo')}
          </span>
          <button
            aria-label={tr('Ajustes y copias de seguridad')}
            className="icon-button"
            onClick={() => navigate('/ajustes')}
          >
            <Settings size={21} />
          </button>
        </div>
      </header>
      <main className="app-main">{page}</main>
      {welcome && <Welcome close={() => setWelcome(false)} />}
      <nav className="mobile-nav">
        {nav.map((n) => (
          <button
            key={n.path}
            className={(n.path === '/' ? route === '/' : route.startsWith(n.path)) ? 'current' : ''}
            onClick={() => navigate(n.path)}
          >
            <n.icon size={20} />
            <span>{n.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
