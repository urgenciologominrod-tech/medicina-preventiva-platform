import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { EmptyState, NotificationCard, PageHeader, SectionCard, StatCard } from '../components/ui';

const STATUS_PROGRESS = {
  pending: 0,
  in_progress: 55,
  completed: 100,
};

function formatProgress(status) {
  return STATUS_PROGRESS[status] ?? 0;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [certs, setCerts] = useState([]);
  const [events, setEvents] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const requests = [
      api.get('/courses'),
      api.get('/certificates/my'),
      api.get('/calendar', { params: { year: new Date().getFullYear(), month: new Date().getMonth() + 1 } }),
    ];

    if (user?.role === 'admin') {
      requests.push(api.get('/admin/stats'));
    }

    Promise.all(requests)
      .then(([coursesResp, certsResp, eventsResp, adminStatsResp]) => {
        setCourses(coursesResp.data || []);
        setCerts(certsResp.data || []);
        setEvents(eventsResp.data || []);
        setAdminStats(adminStatsResp?.data || null);
      })
      .finally(() => setLoading(false));
  }, [user?.role]);

  const dashboardData = useMemo(() => {
    const completed = courses.filter(course => course.progress_status === 'completed');
    const inProgress = courses.filter(course => course.progress_status === 'in_progress');
    const pending = courses.filter(course => course.progress_status === 'pending');

    const activeCourse = inProgress[0] || pending[0] || completed[0] || null;
    const activeCourseProgress = activeCourse ? formatProgress(activeCourse.progress_status) : 0;

    const certificateCourseIds = new Set(certs.map(cert => cert.course_id));
    const certificateReady = completed.filter(course => !certificateCourseIds.has(course.id));
    const evaluationCandidates = [...inProgress, ...completed.filter(course => !certificateCourseIds.has(course.id))].slice(0, 3);

    return {
      completed,
      inProgress,
      pending,
      activeCourse,
      activeCourseProgress,
      certificateReady,
      evaluationCandidates,
      pendingEvaluations: evaluationCandidates.length,
    };
  }, [courses, certs]);

  const notifications = useMemo(() => {
    const list = [
      {
        id: 'welcome',
        icon: '👋',
        title: 'Bienvenido a la plataforma de capacitación institucional.',
        description: 'Desde este inicio podrás continuar tu formación y revisar acciones prioritarias.',
        tone: 'sky',
      },
    ];

    if (dashboardData.pending.length > 0) {
      list.push({
        id: 'pending-courses',
        icon: '📚',
        title: 'Tienes cursos pendientes por completar.',
        description: `${dashboardData.pending.length} curso(s) esperan tu avance para completar tu plan institucional.`,
        actionLabel: 'Ir al curso',
        actionTo: dashboardData.activeCourse ? `/courses/${dashboardData.activeCourse.id}` : '/courses',
        tone: 'amber',
      });
    }

    if (dashboardData.pendingEvaluations > 0) {
      const target = dashboardData.evaluationCandidates[0];
      list.push({
        id: 'pending-eval',
        icon: '📝',
        title: 'Ya puedes presentar la evaluación de un curso completado.',
        description: 'Revisa tus cursos avanzados y presenta el examen correspondiente.',
        actionLabel: target ? 'Presentar examen' : undefined,
        actionTo: target ? `/courses/${target.id}/exam` : undefined,
        tone: 'violet',
      });
    }

    if (certs.length > 0) {
      list.push({
        id: 'certificates',
        icon: '🏅',
        title: 'Tienes constancias disponibles para descargar.',
        description: `Actualmente cuentas con ${certs.length} constancia(s) emitida(s).`,
        actionLabel: 'Ver constancias',
        actionTo: '/certificates',
        tone: 'emerald',
      });
    }

    if (dashboardData.inProgress.length > 0) {
      list.push({
        id: 'progress-update',
        icon: '📈',
        title: 'Tu progreso se ha actualizado correctamente.',
        description: `Llevas ${dashboardData.inProgress.length} curso(s) en progreso activo.`,
        tone: 'sky',
      });
    }

    return list;
  }, [certs.length, dashboardData]);

  const upcomingEvents = events.filter(event => new Date(event.scheduled_date) >= new Date()).slice(0, 4);
  const quickActions = [
    { id: 'continue', label: 'Continuar curso', to: dashboardData.activeCourse ? `/courses/${dashboardData.activeCourse.id}` : '/courses' },
    { id: 'exam', label: 'Presentar evaluación', to: dashboardData.evaluationCandidates[0] ? `/courses/${dashboardData.evaluationCandidates[0].id}/exam` : '/courses' },
    { id: 'cert', label: 'Descargar constancia', to: '/certificates' },
  ];

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500" /></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <PageHeader
        title={`Bienvenido/a, ${user?.name || 'Usuario'}`}
        subtitle="Tu capacitación institucional en un solo lugar"
        action={<Link to={user?.role === 'admin' ? '/admin' : '/courses'} className="btn-primary">{user?.role === 'admin' ? 'Ir al panel admin' : 'Explorar cursos'}</Link>}
      />

      {user?.role === 'admin' ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Usuarios activos" value={adminStats?.totalEmployees ?? 0} icon="👥" tone="sky" />
            <StatCard label="Cursos creados" value={adminStats?.totalCourses ?? courses.length} icon="📚" tone="violet" />
            <StatCard label="Constancias emitidas" value={adminStats?.totalCertificates ?? 0} icon="🏆" tone="emerald" />
            <StatCard label="Tasa de aprobación" value={`${adminStats?.examPassRate ?? 0}%`} icon="📊" tone="amber" />
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <SectionCard title="Accesos rápidos administrativos">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: 'Usuarios', to: '/admin' },
                  { label: 'Cursos', to: '/admin' },
                  { label: 'Exámenes', to: '/admin' },
                  { label: 'Progreso', to: '/admin' },
                ].map(action => (
                  <Link key={action.label} to={action.to} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:border-sky-300 hover:bg-sky-50 transition-colors">
                    {action.label}
                  </Link>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Mensajes internos">
              <div className="space-y-3">
                {notifications.map(notification => <NotificationCard key={notification.id} {...notification} />)}
              </div>
            </SectionCard>

            <SectionCard title="Próximos eventos">
              {upcomingEvents.length === 0 ? (
                <EmptyState title="Sin eventos próximos" description="Cuando existan eventos institucionales, aparecerán aquí." />
              ) : upcomingEvents.map(event => (
                <div key={event.id} className="flex items-start gap-3 py-2 border-b border-slate-100 last:border-0">
                  <div className="bg-sky-100 text-sky-700 rounded-lg p-2 text-center min-w-[52px]">
                    <div className="text-[10px] font-semibold uppercase">{new Date(`${event.scheduled_date}T00:00:00`).toLocaleDateString('es-MX', { month: 'short' })}</div>
                    <div className="text-lg font-bold leading-none">{new Date(`${event.scheduled_date}T00:00:00`).getDate()}</div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">{event.title || event.course_title}</p>
                    {event.is_mandatory && <span className="badge-mandatory">Obligatorio</span>}
                  </div>
                </div>
              ))}
            </SectionCard>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Cursos disponibles" value={courses.length} icon="📘" tone="sky" />
            <StatCard label="Cursos completados" value={dashboardData.completed.length} icon="✅" tone="emerald" />
            <StatCard label="Constancias obtenidas" value={certs.length} icon="🎓" tone="violet" />
            <StatCard label="Evaluaciones pendientes" value={dashboardData.pendingEvaluations} icon="📝" tone="amber" />
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 card-premium bg-gradient-to-br from-slate-900 via-sky-900 to-cyan-800 text-white border-slate-800 shadow-xl">
              <p className="text-xs uppercase tracking-[0.2em] text-sky-100/80 mb-2">Curso activo recomendado</p>
              <h2 className="text-2xl font-bold mb-2">{dashboardData.activeCourse?.title || 'Aún no tienes cursos asignados'}</h2>
              <p className="text-sm text-sky-100/80 mb-5">{dashboardData.activeCourse?.category || 'Inicia tu ruta y fortalece tus competencias institucionales.'}</p>

              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span>Avance del curso</span>
                  <span className="font-semibold">{dashboardData.activeCourseProgress}%</span>
                </div>
                <div className="bg-white/20 h-2 rounded-full overflow-hidden">
                  <div className="bg-cyan-300 h-full rounded-full" style={{ width: `${dashboardData.activeCourseProgress}%` }} />
                </div>
              </div>

              <Link
                to={dashboardData.activeCourse ? `/courses/${dashboardData.activeCourse.id}` : '/courses'}
                className="inline-flex rounded-xl bg-white text-sky-800 px-4 py-2.5 font-semibold text-sm hover:bg-sky-50 transition-colors"
              >
                Continuar curso
              </Link>
            </div>

            <SectionCard title="Próximas acciones">
              <div className="space-y-3">
                {quickActions.map(action => (
                  <Link key={action.id} to={action.to} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 hover:border-sky-300 hover:bg-sky-50 transition-colors">
                    <span>{action.label}</span>
                    <span className="text-sky-700">→</span>
                  </Link>
                ))}
              </div>
            </SectionCard>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <SectionCard title="Mensajes y notificaciones internas" action={<Link to="/courses" className="text-sky-700 text-sm hover:underline">Ver cursos</Link>}>
              {notifications.length === 0 ? (
                <EmptyState title="Todo al día. No tienes pendientes por ahora." description="Cuando se genere una novedad de capacitación, la verás en esta sección." />
              ) : (
                <div className="space-y-3">
                  {notifications.map(notification => <NotificationCard key={notification.id} {...notification} />)}
                </div>
              )}
            </SectionCard>

            <SectionCard title="Próximos eventos" action={<Link to="/calendar" className="text-sky-700 text-sm hover:underline">Ver calendario</Link>}>
              {upcomingEvents.length === 0 ? (
                <EmptyState title="Sin eventos próximos" description="Cuando existan eventos obligatorios, aparecerán aquí." />
              ) : upcomingEvents.map(event => (
                <div key={event.id} className="flex items-start gap-3 py-2 border-b border-slate-100 last:border-0">
                  <div className="bg-sky-100 text-sky-700 rounded-lg p-2 text-center min-w-[52px]">
                    <div className="text-[10px] font-semibold uppercase">{new Date(`${event.scheduled_date}T00:00:00`).toLocaleDateString('es-MX', { month: 'short' })}</div>
                    <div className="text-lg font-bold leading-none">{new Date(`${event.scheduled_date}T00:00:00`).getDate()}</div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">{event.title || event.course_title}</p>
                    {event.is_mandatory && <span className="badge-mandatory">Obligatorio</span>}
                  </div>
                </div>
              ))}
            </SectionCard>
          </div>
        </>
      )}
    </div>
  );
}
