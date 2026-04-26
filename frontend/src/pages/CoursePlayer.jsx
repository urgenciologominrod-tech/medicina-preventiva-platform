import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const YOUTUBE_HOSTS = ['youtube.com', 'www.youtube.com', 'youtu.be', 'm.youtube.com'];

const normalizeType = (type, url) => {
  const safeType = String(type || '').trim().toLowerCase();
  if (safeType === 'youtube' || isYouTubeUrl(url)) return 'youtube';
  if (safeType === 'video') return 'video';
  if (['image', 'infographic'].includes(safeType)) return 'image';
  if (safeType === 'pdf') return 'pdf';
  if (safeType === 'document') return 'document';
  if (safeType === 'link') return 'link';
  return 'unknown';
};

const hasValidUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

const isYouTubeUrl = (url) => {
  if (!hasValidUrl(url)) return false;
  try {
    const parsed = new URL(url);
    return YOUTUBE_HOSTS.includes(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
};

const extractYouTubeId = (url) => {
  if (!isYouTubeUrl(url)) return null;

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    if (host === 'youtu.be') return parsed.pathname.split('/').filter(Boolean)[0] || null;

    if (parsed.pathname === '/watch') return parsed.searchParams.get('v');

    if (parsed.pathname.startsWith('/embed/')) return parsed.pathname.split('/')[2] || null;

    if (parsed.pathname.startsWith('/shorts/')) return parsed.pathname.split('/')[2] || null;

    return parsed.searchParams.get('v');
  } catch {
    return null;
  }
};

const getYouTubeEmbedUrl = (url) => {
  const id = extractYouTubeId(url);
  return id ? `https://www.youtube.com/embed/${id}` : null;
};

function ContentRenderer({ item, onViewed }) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [item?.url]);

  const url = item?.url;
  const normalizedType = normalizeType(item?.type, url);
  const validUrl = hasValidUrl(url);

  if (!validUrl) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-4">
        <p className="text-sm text-amber-800 font-medium">No se pudo cargar este recurso</p>
        <p className="text-xs text-amber-700 mt-1">La URL está vacía o no es válida.</p>
      </div>
    );
  }

  if (normalizedType === 'youtube') {
    const embedUrl = getYouTubeEmbedUrl(url);

    if (!embedUrl) {
      return (
        <ResourceCard
          title={item?.title}
          message="No se pudo cargar este recurso"
          url={url}
          onOpen={onViewed}
        />
      );
    }

    return (
      <div className="mb-4">
        <div className="aspect-video bg-black rounded-xl overflow-hidden">
          <iframe
            src={embedUrl}
            title={item?.title || 'Video de YouTube'}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            onLoad={onViewed}
          />
        </div>
        <div className="mt-3">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-sm inline-flex"
            onClick={onViewed}
          >
            Abrir recurso
          </a>
        </div>
      </div>
    );
  }

  if (normalizedType === 'video') {
    return (
      <div className="aspect-video bg-black rounded-xl overflow-hidden mb-4">
        <video
          key={url}
          src={url}
          controls
          className="w-full h-full"
          onPlay={onViewed}
          onEnded={onViewed}
        />
      </div>
    );
  }

  if (normalizedType === 'image') {
    return (
      <div className="mb-4">
        {!imageFailed ? (
          <img
            src={url}
            alt={item?.title || 'Imagen del contenido'}
            className="w-full rounded-xl border border-slate-200 cursor-zoom-in"
            onLoad={onViewed}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-800 font-medium">No se pudo cargar este recurso</p>
            <p className="text-xs text-amber-700 mt-1">La imagen o infografía no está disponible.</p>
          </div>
        )}

        <div className="mt-3">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-sm inline-flex"
            onClick={onViewed}
          >
            Abrir recurso
          </a>
        </div>
      </div>
    );
  }

  if (['pdf', 'document', 'link', 'unknown'].includes(normalizedType)) {
    return (
      <ResourceCard
        title={item?.title}
        message="Recurso disponible para abrir en una nueva pestaña"
        url={url}
        onOpen={onViewed}
      />
    );
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-4">
      <p className="text-sm text-amber-800 font-medium">No se pudo cargar este recurso</p>
      <a href={url} target="_blank" rel="noopener noreferrer" className="btn-secondary mt-3 inline-flex text-sm" onClick={onViewed}>
        Abrir recurso
      </a>
    </div>
  );
}

function ResourceCard({ title, message, url, onOpen }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 mb-4">
      <h4 className="font-medium text-slate-700">{title || 'Recurso'}</h4>
      <p className="text-sm text-slate-500 mt-1">{message}</p>
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary mt-3 inline-flex text-sm"
          onClick={onOpen}
        >
          Abrir recurso
        </a>
      )}
    </div>
  );
}

const getContentIcon = (item) => {
  const normalizedType = normalizeType(item?.type, item?.url);
  if (normalizedType === 'youtube' || normalizedType === 'video') return '🎬';
  if (normalizedType === 'image') return '🖼️';
  if (normalizedType === 'pdf') return '📄';
  if (normalizedType === 'document') return '📝';
  if (normalizedType === 'link') return '🔗';
  return '📦';
};

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
        <button onClick={() => navigate('/courses')} className="text-sky-700 text-sm hover:underline font-medium">← Regresar a cursos</button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Contenido principal */}
        <div className="flex-1">
          <div className="card-premium mb-4">
            <div className="flex items-start justify-between gap-4 mb-2">
              <h1 className="text-xl font-bold text-slate-800">{course.title}</h1>
              {course.is_mandatory && <span className="badge-mandatory shrink-0">Obligatorio</span>}
            </div>
            <p className="text-slate-500 text-sm">{course.description}</p>
          </div>

          {current ? (
            <div className="card-premium">
              <h2 className="font-semibold text-slate-700 mb-4">{current.title || `Contenido ${currentIdx + 1}`}</h2>

              <ContentRenderer item={current} onViewed={() => markViewed(currentIdx)} />

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
            <div className="card-premium text-center py-12 text-slate-400">Este curso no tiene contenido aún.</div>
          )}

          {/* Botón ir al examen */}
          {allViewed && (
            <div className="card-premium mt-4 bg-green-50 border-green-200 text-center">
              <p className="text-green-700 font-semibold mb-3">¡Completaste todo el material! Ya puedes tomar el examen.</p>
              <button className="btn-primary bg-green-600 hover:bg-green-700" onClick={goToExam}>
                📝 Ir al examen →
              </button>
            </div>
          )}
        </div>

        {/* Índice de contenidos */}
        <div className="lg:w-80">
          <div className="card-premium sticky top-20">
            <h3 className="font-semibold text-slate-700 mb-3">Contenido del curso</h3>
            <div className="space-y-1">
              {course.contents.map((item, idx) => (
                <button key={item.id} onClick={() => setCurrentIdx(idx)}
                  className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors
                    ${currentIdx === idx ? 'bg-gradient-to-r from-cyan-100 to-sky-100 text-sky-700 font-medium' : 'hover:bg-slate-100 text-slate-600'}`}>
                  <span className="text-lg">{getContentIcon(item)}</span>
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
