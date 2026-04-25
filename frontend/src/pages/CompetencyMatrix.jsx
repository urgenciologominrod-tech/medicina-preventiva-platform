import { useEffect, useState } from 'react';
import api from '../services/api';

const LEVEL_LABELS = ['Sin iniciar', 'Básico', 'Elemental', 'Intermedio', 'Avanzado', 'Experto'];
const LEVEL_COLORS = ['bg-slate-100 text-slate-400', 'bg-red-100 text-red-600', 'bg-orange-100 text-orange-600', 'bg-yellow-100 text-yellow-600', 'bg-sky-100 text-sky-700', 'bg-green-100 text-green-700'];

export default function CompetencyMatrix() {
  const [matrix, setMatrix] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/competency-matrix/my').then(r => setMatrix(r.data)).finally(() => setLoading(false));
  }, []);

  const totalAreas = matrix.length;
  const avgLevel = totalAreas ? Math.round(matrix.reduce((sum, m) => sum + m.level, 0) / totalAreas * 10) / 10 : 0;
  const experts = matrix.filter(m => m.level === 5).length;

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500" /></div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Matriz de Competencias</h1>
      <p className="text-slate-500 text-sm mb-6">Tu perfil de competencias digitales en medicina preventiva</p>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card text-center">
          <div className="text-3xl font-bold text-sky-600">{avgLevel}</div>
          <div className="text-xs text-slate-500 mt-1">Nivel promedio<br />(escala 1-5)</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-green-600">{experts}</div>
          <div className="text-xs text-slate-500 mt-1">Áreas en nivel<br />Experto</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-slate-700">{totalAreas}</div>
          <div className="text-xs text-slate-500 mt-1">Áreas de<br />competencia</div>
        </div>
      </div>

      {/* Tabla de competencias */}
      <div className="card overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-700">Áreas de competencia</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Área</th>
                {LEVEL_LABELS.slice(1).map((l, i) => (
                  <th key={i} className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase">{l}</th>
                ))}
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Estado</th>
              </tr>
            </thead>
            <tbody>
              {matrix.map((item, idx) => (
                <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                  <td className="px-6 py-4 text-sm font-medium text-slate-700 min-w-[180px]">{item.competency_area}</td>
                  {[1,2,3,4,5].map(lvl => (
                    <td key={lvl} className="text-center px-3 py-4">
                      <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-sm font-bold transition-all
                        ${item.level >= lvl ? LEVEL_COLORS[lvl] : 'bg-slate-100 text-slate-300'}`}>
                        {item.level >= lvl ? '●' : '○'}
                      </div>
                    </td>
                  ))}
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${LEVEL_COLORS[item.level]}`}>
                      {LEVEL_LABELS[item.level]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leyenda */}
      <div className="mt-4 flex flex-wrap gap-3">
        {LEVEL_LABELS.slice(1).map((l, i) => (
          <span key={i} className={`text-xs font-semibold px-2 py-1 rounded-full ${LEVEL_COLORS[i+1]}`}>
            {i+1} — {l}
          </span>
        ))}
      </div>
    </div>
  );
}
