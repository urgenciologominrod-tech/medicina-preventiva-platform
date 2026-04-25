import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

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
  const pending = courses.filter(c => c.progress_status === 'pending').length;
  const pct = courses.length ? Math.round((completed / courses.length) * 100) : 0;

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500" /></div>;

  const upcomingEvents = events
    .filter(e => new Date(e.scheduled_date) >= new Date())
    .slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Bienvenido, {user?.name} 👋</h1>
        <p className="text-slate-500 text-sm mt-1">{user?.department}</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total cursos', value: courses.length, icon: '📚', color: 'bg-sky-50 border-sky-200' },
          { label: 'Completados', value: completed, icon: '✅', color: 'bg-green-50 border-green-200' },
          { label: 'En progreso', value: inProgress, icon: '⏳', color: 'bg-yellow-50 border-yellow-200' },
          { label: 'Constancias', value: certs.length, icon: '🏆', color: 'bg-purple-50 border-purple-200' },
        ].map(s => (
          <div key={s.label} className={`card ${s.color} text-center`}>
            <div className="text-3xl mb-1">{s.icon}</div>
            <div className="text-2xl font-bold text-slate-800">{s.value}</div>
            <div className="text-xs text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Progreso general */}
      <div className="card mb-6">
        <h2 className="font-semibold text-slate-700 mb-3">Progreso general</h2>
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-slate-200 rounded-full h-4 overflow-hidden">
            <div className="bg-sky-500 h-4 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-lg font-bold text-sky-600 w-12">{pct}%</span>
        </div>
        <p className="text-xs text-slate-400 mt-2">{completed} de {courses.length} cursos completados</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Cursos pendientes */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-700">Cursos pendientes</h2>
            <Link to="/courses" className="text-sky-600 text-sm hover:underline">Ver todos →</Link>
          </div>
          {courses.filter(c => c.progress_status !== 'completed').slice(0, 4).length === 0
            ? <p className="text-slate-400 text-sm text-center py-4">¡Todos los cursos completados! 🎉</p>
            : courses.filter(c => c.progress_status !== 'completed').slice(0, 4).map(c => (
              <Link key={c.id} to={`/courses/${c.id}`}
                className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0 hover:bg-slate-50 -mx-2 px-2 rounded transition-colors">
                <div>
                  <p className="text-sm font-medium text-slate-700">{c.title}</p>
                  <p className="text-xs text-slate-400">{c.category}</p>
                </div>
                <div className="flex items-center gap-2">
                  {c.is_mandatory && <span className="badge-mandatory">Obligatorio</span>}
                  <span className={c.progress_status === 'in_progress' ? 'badge-pending' : 'badge-optional'}>
                    {c.progress_status === 'in_progress' ? 'En progreso' : 'Pendiente'}
                  </span>
                </div>
              </Link>
            ))
          }
        </div>

        {/* Próximos eventos */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-700">Próximos eventos</h2>
            <Link to="/calendar" className="text-sky-600 text-sm hover:underline">Ver calendario →</Link>
          </div>
          {upcomingEvents.length === 0
            ? <p className="text-slate-400 text-sm text-center py-4">Sin eventos próximos</p>
            : upcomingEvents.map(e => (
              <div key={e.id} className="flex items-start gap-3 py-2 border-b border-slate-100 last:border-0">
                <div className="bg-sky-100 text-sky-700 rounded-lg p-2 text-center min-w-[44px]">
                  <div className="text-xs font-semibold">{new Date(e.scheduled_date + 'T00:00:00').toLocaleDateString('es-MX', { month:'short' }).toUpperCase()}</div>
                  <div className="text-lg font-bold leading-none">{new Date(e.scheduled_date + 'T00:00:00').getDate()}</div>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">{e.title || e.course_title}</p>
                  {e.is_mandatory && <span className="badge-mandatory">Obligatorio</span>}
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}
