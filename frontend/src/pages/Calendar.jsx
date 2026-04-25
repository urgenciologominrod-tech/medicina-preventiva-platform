import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DAYS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

export default function Calendar() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [view, setView] = useState('month');
  const [events, setEvents] = useState([]);
  const [annualEvents, setAnnualEvents] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.get('/calendar', { params: { year, month: month + 1 } }).then(r => setEvents(r.data));
  }, [year, month]);

  useEffect(() => {
    api.get('/calendar/annual', { params: { year } }).then(r => setAnnualEvents(r.data));
  }, [year]);

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const eventsForDay = day => {
    if (!day) return [];
    const dateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    return events.filter(e => e.scheduled_date?.startsWith(dateStr));
  };

  const eventsForMonth = (m) => annualEvents.filter(e => {
    const d = new Date(e.scheduled_date + 'T00:00:00');
    return d.getMonth() === m;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-800">Calendario de Cursos</h1>
        <div className="flex gap-2">
          <button onClick={() => setView('month')} className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${view==='month' ? 'bg-sky-500 text-white border-sky-500' : 'bg-white text-slate-600 border-slate-300'}`}>Mensual</button>
          <button onClick={() => setView('annual')} className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${view==='annual' ? 'bg-sky-500 text-white border-sky-500' : 'bg-white text-slate-600 border-slate-300'}`}>Anual</button>
        </div>
      </div>

      {view === 'month' && (
        <>
          <div className="card mb-4">
            <div className="flex items-center justify-between mb-4">
              <button onClick={prevMonth} className="btn-secondary px-3 py-1.5">←</button>
              <h2 className="text-lg font-bold text-slate-700">{MONTHS[month]} {year}</h2>
              <button onClick={nextMonth} className="btn-secondary px-3 py-1.5">→</button>
            </div>

            <div className="grid grid-cols-7 mb-2">
              {DAYS.map(d => <div key={d} className="text-center text-xs font-semibold text-slate-400 py-1">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, i) => {
                const dayEvents = eventsForDay(day);
                const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                return (
                  <div key={i}
                    className={`min-h-[72px] p-1 rounded-lg border text-sm transition-colors cursor-pointer
                      ${!day ? 'border-transparent' : isToday ? 'border-sky-400 bg-sky-50' : 'border-slate-100 hover:border-sky-200'}`}
                    onClick={() => day && dayEvents.length && setSelected(dayEvents)}>
                    {day && (
                      <>
                        <div className={`text-xs font-semibold mb-1 ${isToday ? 'text-sky-600' : 'text-slate-600'}`}>{day}</div>
                        {dayEvents.slice(0,2).map(e => (
                          <div key={e.id} className={`text-xs truncate rounded px-1 py-0.5 mb-0.5 ${e.is_mandatory ? 'bg-red-100 text-red-700' : 'bg-sky-100 text-sky-700'}`}>
                            {e.title || e.course_title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && <div className="text-xs text-slate-400">+{dayEvents.length-2} más</div>}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {selected && (
            <div className="card bg-sky-50 border-sky-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sky-800">Eventos del día</h3>
                <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>
              {selected.map(e => (
                <div key={e.id} className="bg-white rounded-lg p-3 mb-2 last:mb-0 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800">{e.title || e.course_title}</p>
                    {e.description && <p className="text-xs text-slate-500 mt-0.5">{e.description}</p>}
                    <div className="flex gap-2 mt-1">
                      {e.is_mandatory && <span className="badge-mandatory">Obligatorio</span>}
                      <span className="text-xs text-slate-400 capitalize">{e.recurrence}</span>
                    </div>
                  </div>
                  {e.course_id && <Link to={`/courses/${e.course_id}`} className="btn-primary text-xs py-1.5">Ir al curso</Link>}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {view === 'annual' && (
        <>
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => setYear(y => y - 1)} className="btn-secondary">← {year-1}</button>
            <h2 className="text-xl font-bold text-slate-700">{year}</h2>
            <button onClick={() => setYear(y => y + 1)} className="btn-secondary">{year+1} →</button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {MONTHS.map((name, mi) => {
              const monthEvents = eventsForMonth(mi);
              return (
                <div key={mi} className={`card ${monthEvents.some(e => e.is_mandatory) ? 'border-red-200' : ''}`}>
                  <h3 className="font-semibold text-slate-700 mb-2">{name}</h3>
                  {monthEvents.length === 0
                    ? <p className="text-xs text-slate-300">Sin cursos programados</p>
                    : monthEvents.map(e => (
                      <div key={e.id} className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${e.is_mandatory ? 'bg-red-400' : 'bg-sky-400'}`} />
                        <span className="text-xs text-slate-600 truncate">{e.title || e.course_title}</span>
                      </div>
                    ))
                  }
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-4 text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-400 rounded-full" /> Obligatorio</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-sky-400 rounded-full" /> Opcional</span>
          </div>
        </>
      )}
    </div>
  );
}
