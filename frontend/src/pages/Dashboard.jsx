import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { EmptyState, PageHeader, SectionCard, StatCard } from '../components/ui';

export default function Dashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [certs, setCerts] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/courses'),
      api.get('/certificates/my'),
      api.get('/calendar', { params: { year: new Date().getFullYear(), month: new Date().getMonth() + 1 } })
    ]).then(([c, cert, ev]) => {
      setCourses(c.data);
      setCerts(cert.data);
      setEvents(ev.data);
    }).finally(() => setLoading(false));
  }, []);

  const completed = courses.filter(c => c.progress_status === 'completed').length;
  const inProgress = courses.filter(c => c.progress_status === 'in_progress').length;
  const pct = courses.length ? Math.round((completed / courses.length) * 100) : 0;

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500" /></div>;

  const upcomingEvents = events.filter(e => new Date(e.scheduled_date) >= new Date()).slice(0, 4);
  const pendingCourses = courses.filter(c => c.progress_status !== 'completed').slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <PageHeader title={`Bienvenido, ${user?.name}`} subtitle={`${user?.department || 'Sin departamento'} · Continúa tu ruta de formación`} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total cursos" value={courses.length} icon="📚" tone="sky" />
        <StatCard label="Completados" value={completed} icon="✅" tone="emerald" />
        <StatCard label="En progreso" value={inProgress} icon="⏳" tone="amber" />
        <StatCard label="Constancias" value={certs.length} icon="🏆" tone="violet" />
      </div>

      <div className="card-premium mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-800">Progreso general</h2>
          <span className="text-xl font-bold text-sky-700">{pct}%</span>
        </div>
        <div className="bg-slate-200 rounded-full h-3 overflow-hidden">
          <div className="bg-gradient-to-r from-cyan-500 to-sky-600 h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-slate-500 mt-2">{completed} de {courses.length} cursos completados</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <SectionCard title="Cursos pendientes" action={<Link to="/courses" className="text-sky-700 text-sm hover:underline">Ver todos</Link>}>
          {pendingCourses.length === 0 ? (
            <EmptyState title="¡Excelente trabajo!" description="No tienes cursos pendientes por ahora." />
          ) : pendingCourses.map(c => (
            <Link key={c.id} to={`/courses/${c.id}`} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 -mx-2 px-2 rounded-xl transition-colors">
              <div>
                <p className="text-sm font-medium text-slate-700">{c.title}</p>
                <p className="text-xs text-slate-400">{c.category}</p>
              </div>
              <div className="flex items-center gap-2">
                {c.is_mandatory && <span className="badge-mandatory">Obligatorio</span>}
                <span className={c.progress_status === 'in_progress' ? 'badge-pending' : 'badge-optional'}>{c.progress_status === 'in_progress' ? 'En progreso' : 'Pendiente'}</span>
              </div>
            </Link>
          ))}
        </SectionCard>

        <SectionCard title="Próximos eventos" action={<Link to="/calendar" className="text-sky-700 text-sm hover:underline">Ver calendario</Link>}>
          {upcomingEvents.length === 0 ? (
            <EmptyState title="Sin eventos próximos" description="Cuando existan eventos obligatorios, aparecerán aquí." />
          ) : upcomingEvents.map(e => (
            <div key={e.id} className="flex items-start gap-3 py-2 border-b border-slate-100 last:border-0">
              <div className="bg-sky-100 text-sky-700 rounded-lg p-2 text-center min-w-[48px]">
                <div className="text-[10px] font-semibold">{new Date(e.scheduled_date + 'T00:00:00').toLocaleDateString('es-MX', { month:'short' }).toUpperCase()}</div>
                <div className="text-lg font-bold leading-none">{new Date(e.scheduled_date + 'T00:00:00').getDate()}</div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">{e.title || e.course_title}</p>
                {e.is_mandatory && <span className="badge-mandatory">Obligatorio</span>}
              </div>
            </div>
          ))}
        </SectionCard>
      </div>
    </div>
  );
}
