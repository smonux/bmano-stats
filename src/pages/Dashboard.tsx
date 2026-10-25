import { tr } from '../i18n';
import { ArrowRight, BarChart3, CalendarDays, Plus, ShieldCheck, Users } from 'lucide-react';
import { type Snapshot } from '../domain/model';
import { navigate } from '../components/ui';
import { MatchCard } from '../components/MatchCard';
function Dashboard({ data }: { data: Snapshot }) {
  const active = data.matches.filter((match) => !match.deletedAt && match.status === 'active');
  const total = data.matches.filter((match) => !match.deletedAt).length;
  return (
    <>
      <div className={`home-heading ${active.length ? 'has-active' : ''}`}>
        <span className="eyebrow">{tr('A PIE DE PISTA')}</span>
        <h1>{tr('Cada jugada cuenta.')}</h1>
        <p>
          {tr('Menos tiempo anotando.')}
          <br />
          {tr('Más atención en el partido.')}
        </p>
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
            {active.map((match) => (
              <MatchCard key={match.id} data={data} match={match} />
            ))}
          </div>
        </section>
      )}
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
            {data.teams.filter((team) => !team.deletedAt).length} {tr('equipos')}{' '}
            <ArrowRight size={17} />
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
export { Dashboard };
