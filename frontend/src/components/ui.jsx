import { Link } from 'react-router-dom';

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-8 rounded-3xl border border-white/60 bg-white/75 backdrop-blur-sm p-6 shadow-premium-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
          {subtitle && <p className="text-sm text-slate-600 mt-1">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
}

export function StatCard({ label, value, icon, tone = 'sky' }) {
  const tones = {
    sky: 'from-sky-50 to-cyan-50 border-sky-100 text-sky-900',
    emerald: 'from-emerald-50 to-green-50 border-emerald-100 text-emerald-900',
    amber: 'from-amber-50 to-yellow-50 border-amber-100 text-amber-900',
    violet: 'from-violet-50 to-indigo-50 border-violet-100 text-violet-900',
  };

  return (
    <div className={`rounded-2xl border bg-gradient-to-b p-5 shadow-premium-sm ${tones[tone] || tones.sky}`}>
      <div className="text-2xl mb-3">{icon}</div>
      <p className="text-3xl font-bold leading-none">{value}</p>
      <p className="text-xs uppercase tracking-wide opacity-70 mt-2">{label}</p>
    </div>
  );
}

export function SectionCard({ title, action, children }) {
  return (
    <div className="card-premium">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-semibold text-slate-800">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

export function EmptyState({ title, description, actionLabel, actionTo }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-10 text-center">
      <p className="text-lg font-semibold text-slate-700">{title}</p>
      {description && <p className="text-sm text-slate-500 mt-2">{description}</p>}
      {actionLabel && actionTo && (
        <Link to={actionTo} className="btn-secondary mt-5 inline-flex">{actionLabel}</Link>
      )}
    </div>
  );
}

export function CourseCard({ course, statusClass, statusLabel }) {
  return (
    <Link
      to={`/courses/${course.id}`}
      className="group card-premium p-0 overflow-hidden hover:-translate-y-0.5 transition-all duration-300"
    >
      {course.thumbnail_url
        ? <img src={course.thumbnail_url} alt={course.title} className="w-full h-44 object-cover" />
        : <div className="w-full h-44 bg-gradient-to-br from-slate-800 via-sky-900 to-cyan-800 flex items-center justify-center text-5xl">🩺</div>}
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-slate-800 group-hover:text-sky-700 transition-colors">{course.title}</h3>
          {course.is_mandatory && <span className="badge-mandatory shrink-0">Obligatorio</span>}
        </div>
        {course.category && <p className="text-xs text-slate-500 mb-3">{course.category}</p>}
        <p className="text-sm text-slate-600 line-clamp-2 min-h-10">{course.description}</p>
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className={statusClass[course.progress_status] || 'badge-optional'}>
            {statusLabel[course.progress_status] || 'Pendiente'}
          </span>
          <span className="text-sky-700 text-sm font-medium">Abrir →</span>
        </div>
      </div>
    </Link>
  );
}
