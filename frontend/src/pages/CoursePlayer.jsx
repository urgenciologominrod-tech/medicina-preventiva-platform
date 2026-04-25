import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function CoursePlayer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [viewed, setViewed] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/courses/${id}`).then(r => {
      setCourse(r.data);
      api.post(`/courses/${id}/progress`, { status: 'in_progress' });
    }).finally(() => setLoading(false));
  }, [id]);

  const markViewed = idx => {
    setViewed(prev => new Set([...prev, idx]));
  };

  const allViewed = course && viewed.size >= course.contents.length;

  const goToExam = () => navigate(`/courses/${id}/exam`);

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500" /></div>;
  if (!course) return <div className="text-center py-16 text-slate-400">Curso no encontrado</div>;

  const current = course.contents[currentIdx];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-4">
        <button onClick={() => navigate('/courses')} className="text-sky-600 text-sm hover:underline">← Regresar a cursos</button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Contenido principal */}
        <div className="flex-1">
          <div className="card mb-4">
            <div className="flex items-start justify-between gap-4 mb-2">
              <h1 className="text-xl font-bold text-slate-800">{course.title}</h1>
              {course.is_mandatory && <span className="badge-mandatory shrink-0">Obligatorio</span>}
            </div>
            <p className="text-slate-500 text-sm">{course.description}</p>
          </div>

          {current ? (
            <div className="card">
              <h2 className="font-semibold text-slate-700 mb-4">{current.title || `Contenido ${currentIdx + 1}`}</h2>

              {current.type === 'video' ? (
                <div className="aspect-video bg-black rounded-xl overflow-hidden mb-4">
                  <video
                    key={current.url}
                    src={current.url}
                    controls
                    className="w-full h-full"
                    onPlay={() => markViewed(currentIdx)}
                    onEnded={() => markViewed(currentIdx)}
                  />
                </div>
              ) : (
                <div className="mb-4">
                  <img
                    src={current.url}
                    alt={current.title}
                    className="w-full rounded-xl border border-slate-200 cursor-zoom-in"
                    onLoad={() => markViewed(currentIdx)}
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <button
                  className="btn-secondary"
                  disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx(i => i - 1)}>
                  ← Anterior
                </button>
                <span className="text-sm text-slate-400">{currentIdx + 1} / {course.contents.length}</span>
                {currentIdx < course.contents.length - 1 ? (
                  <button className="btn-primary" onClick={() => { markViewed(currentIdx); setCurrentIdx(i => i + 1); }}>
                    Siguiente →
                  </button>
                ) : (
                  <button className="btn-primary" onClick={() => markViewed(currentIdx)}>
                    ✓ Marcar como visto
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="card text-center py-12 text-slate-400">Este curso no tiene contenido aún.</div>
          )}

          {/* Botón ir al examen */}
          {allViewed && (
            <div className="card mt-4 bg-green-50 border-green-200 text-center">
              <p className="text-green-700 font-semibold mb-3">¡Completaste todo el material! Ya puedes tomar el examen.</p>
              <button className="btn-primary bg-green-600 hover:bg-green-700" onClick={goToExam}>
                📝 Ir al examen →
              </button>
            </div>
          )}
        </div>

        {/* Índice de contenidos */}
        <div className="lg:w-72">
          <div className="card sticky top-20">
            <h3 className="font-semibold text-slate-700 mb-3">Contenido del curso</h3>
            <div className="space-y-1">
              {course.contents.map((item, idx) => (
                <button key={item.id} onClick={() => setCurrentIdx(idx)}
                  className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors
                    ${currentIdx === idx ? 'bg-sky-100 text-sky-700 font-medium' : 'hover:bg-slate-100 text-slate-600'}`}>
                  <span className="text-lg">{item.type === 'video' ? '🎬' : '🖼️'}</span>
                  <span className="flex-1 truncate">{item.title || `Contenido ${idx + 1}`}</span>
                  {viewed.has(idx) && <span className="text-green-500 text-xs font-bold">✓</span>}
                </button>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Progreso</span>
                <span>{viewed.size}/{course.contents.length}</span>
              </div>
              <div className="bg-slate-200 rounded-full h-2">
                <div className="bg-sky-500 h-2 rounded-full transition-all"
                  style={{ width: course.contents.length ? `${(viewed.size / course.contents.length) * 100}%` : '0%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
