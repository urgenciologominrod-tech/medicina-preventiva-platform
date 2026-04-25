import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

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
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Catálogo de Cursos</h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input type="search" className="input sm:max-w-xs" placeholder="Buscar curso..."
          value={search} onChange={e => setSearch(e.target.value)} />
        <div className="flex gap-2 flex-wrap">
          {[['all','Todos'], ['pending','Pendientes'], ['in_progress','En progreso'], ['completed','Completados'], ['mandatory','Obligatorios']].map(([v,l]) => (
            <button key={v} onClick={() => setFilter(v)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${filter === v ? 'bg-sky-500 text-white border-sky-500' : 'bg-white text-slate-600 border-slate-300 hover:border-sky-400'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0
        ? <div className="text-center py-16 text-slate-400">No se encontraron cursos</div>
        : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(c => (
              <Link key={c.id} to={`/courses/${c.id}`}
                className="card hover:shadow-md transition-shadow flex flex-col group">
                {c.thumbnail_url
                  ? <img src={c.thumbnail_url} alt={c.title} className="w-full h-40 object-cover rounded-lg mb-4" />
                  : <div className="w-full h-40 bg-gradient-to-br from-sky-100 to-sky-200 rounded-lg mb-4 flex items-center justify-center text-5xl">📖</div>
                }
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-slate-800 group-hover:text-sky-600 transition-colors">{c.title}</h3>
                  {c.is_mandatory && <span className="badge-mandatory shrink-0">Obligatorio</span>}
                </div>
                {c.category && <p className="text-xs text-slate-400 mb-2">{c.category}</p>}
                <p className="text-sm text-slate-500 line-clamp-2 flex-1">{c.description}</p>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className={STATUS_CLASS[c.progress_status] || 'badge-optional'}>
                    {STATUS_LABEL[c.progress_status] || 'Pendiente'}
                  </span>
                  {c.progress_status === 'completed'
                    ? <span className="text-green-600 text-sm font-medium">✓ Completado</span>
                    : <span className="text-sky-600 text-sm font-medium">Ir al curso →</span>
                  }
                </div>
              </Link>
            ))}
          </div>
        )
      }
    </div>
  );
}
