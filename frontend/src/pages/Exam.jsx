import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

export default function Exam() {
  const { id: courseId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    api.get(`/exams/course/${courseId}`)
      .then(r => {
        setExam(r.data);
        setTimeLeft(r.data.time_limit_min * 60);
      })
      .catch(() => navigate(`/courses/${courseId}`))
      .finally(() => setLoading(false));
  }, [courseId]);

  useEffect(() => {
    if (timeLeft === null || result) return;
    if (timeLeft <= 0) { handleSubmit(); return; }
    timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [timeLeft, result]);

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    clearTimeout(timerRef.current);
    try {
      const { data } = await api.post(`/exams/course/${courseId}/submit`, { answers });
      setResult(data);
    } catch (err) {
      alert(err.response?.data?.error || 'Error al enviar examen');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = s => `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;
  const answered = Object.keys(answers).length;
  const total = exam?.questions?.length || 0;

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500" /></div>;

  if (result) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16">
        <div className={`card text-center ${result.passed ? 'border-green-300 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <div className="text-6xl mb-4">{result.passed ? '🎉' : '😟'}</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            {result.passed ? '¡Examen aprobado!' : 'Examen reprobado'}
          </h2>
          <div className={`text-5xl font-black mb-2 ${result.passed ? 'text-green-600' : 'text-red-500'}`}>
            {result.score}%
          </div>
          <p className="text-slate-600 text-sm mb-1">
            {result.correct} de {result.total} respuestas correctas
          </p>
          <p className="text-slate-500 text-xs mb-6">Calificación mínima aprobatoria: {result.passingScore}%</p>

          {result.passed && result.certificate && (
            <div className="bg-white rounded-xl border border-green-200 p-4 mb-6">
              <p className="text-green-700 font-semibold text-sm mb-1">✅ Constancia generada</p>
              <p className="text-xs text-slate-500">Folio: {result.certificate.folio}</p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {result.passed
              ? <Link to="/certificates" className="btn-primary text-center">🏆 Ver mis constancias</Link>
              : <button className="btn-primary" onClick={() => { setResult(null); setAnswers({}); setTimeLeft(exam.time_limit_min * 60); }}>
                  🔄 Intentar de nuevo
                </button>
            }
            <Link to={`/courses/${courseId}`} className="btn-secondary text-center">← Volver al curso</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="card mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Examen de evaluación</h1>
            <p className="text-sm text-slate-400 mt-0.5">{answered}/{total} preguntas respondidas</p>
          </div>
          <div className={`text-2xl font-mono font-bold px-4 py-2 rounded-xl ${timeLeft <= 60 ? 'bg-red-100 text-red-600' : 'bg-sky-100 text-sky-700'}`}>
            ⏱ {formatTime(timeLeft)}
          </div>
        </div>
        <div className="mt-3 bg-slate-200 rounded-full h-2">
          <div className="bg-sky-500 h-2 rounded-full transition-all" style={{ width: `${total ? (answered / total) * 100 : 0}%` }} />
        </div>
      </div>

      <div className="space-y-5 mb-8">
        {exam?.questions?.map((q, qi) => (
          <div key={q.id} className="card">
            <p className="font-medium text-slate-700 mb-4">
              <span className="text-sky-600 font-bold mr-2">{qi + 1}.</span>{q.question}
            </p>
            <div className="space-y-2">
              {[['a', q.option_a], ['b', q.option_b], ['c', q.option_c], ['d', q.option_d]].filter(([, v]) => v).map(([opt, text]) => (
                <label key={opt}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                    ${answers[q.id] === opt ? 'bg-sky-50 border-sky-400' : 'border-slate-200 hover:border-sky-300'}`}>
                  <input type="radio" name={q.id} value={opt}
                    checked={answers[q.id] === opt}
                    onChange={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                    className="accent-sky-500" />
                  <span className="text-sm text-slate-700">
                    <span className="font-bold text-sky-600 uppercase mr-1">{opt})</span> {text}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <button onClick={() => navigate(`/courses/${courseId}`)} className="btn-secondary">Cancelar</button>
        <button
          onClick={handleSubmit}
          disabled={answered < total || submitting}
          className="btn-primary px-8">
          {submitting ? 'Calificando...' : 'Enviar examen'}
        </button>
      </div>
      {answered < total && (
        <p className="text-center text-xs text-slate-400 mt-2">Responde todas las preguntas para enviar</p>
      )}
    </div>
  );
}
