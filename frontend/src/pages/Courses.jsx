import { useEffect, useState } from 'react';
import api from '../services/api';
import { CourseCard, EmptyState, PageHeader } from '../components/ui';

const STATUS_LABEL = { pending: 'Pendiente', in_progress: 'En progreso', completed: 'Completado' };
const STATUS_CLASS = { pending: 'badge-optional', in_progress: 'badge-pending', completed: 'badge-completed' };

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/courses').then(r => setCourses(r.data)).finally(() => setLoading(false));
  }, []);

  const filtered = courses.filter(c => {
    const matchStatus = filter === 'all' || c.progress_status === filter || (filter === 'mandatory' && c.is_mandatory);
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) || (c.category || '').toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500" /></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <PageHeader title="Catálogo de Cursos" subtitle="Programas institucionales de formación continua." />

      <div className="card-premium mb-6">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <input type="search" className="input sm:max-w-xs" placeholder="Buscar curso..." value={search} onChange={e => setSearch(e.target.value)} />
          <div className="flex gap-2 flex-wrap">
            {[['all','Todos'], ['pending','Pendientes'], ['in_progress','En progreso'], ['completed','Completados'], ['mandatory','Obligatorios']].map(([v,l]) => (
              <button key={v} onClick={() => setFilter(v)} className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors border ${filter === v ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-slate-600 border-slate-300 hover:border-sky-400'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? <EmptyState title="No se encontraron cursos" description="Intenta con otro término o filtro." /> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(c => <CourseCard key={c.id} course={c} statusClass={STATUS_CLASS} statusLabel={STATUS_LABEL} />)}
        </div>
      )}
    </div>
  );
}
