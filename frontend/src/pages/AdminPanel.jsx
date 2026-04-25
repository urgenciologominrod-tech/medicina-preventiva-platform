import { useEffect, useState } from 'react';
import api from '../services/api';

const TABS = ['Dashboard','Usuarios','Cursos','Exámenes','Calendario','Constancias','Progreso'];

export default function AdminPanel() {
  const [tab, setTab] = useState('Dashboard');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [certs, setCerts] = useState([]);
  const [progress, setProgress] = useState([]);
  const [calEvents, setCalEvents] = useState([]);

  useEffect(() => {
    api.get('/admin/stats').then(r => setStats(r.data));
  }, []);

  useEffect(() => {
    if (tab === 'Usuarios') api.get('/admin/users').then(r => setUsers(r.data));
    if (tab === 'Cursos') api.get('/courses').then(r => setCourses(r.data));
    if (tab === 'Constancias') api.get('/admin/certificates').then(r => setCerts(r.data));
    if (tab === 'Progreso') api.get('/admin/progress').then(r => setProgress(r.data));
    if (tab === 'Calendario') api.get('/calendar').then(r => setCalEvents(r.data));
  }, [tab]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">⚙️ Panel de Administración</h1>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap mb-6 border-b border-slate-200">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors -mb-px border-b-2
              ${tab === t ? 'border-sky-500 text-sky-600 bg-sky-50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Dashboard' && <AdminDashboard stats={stats} />}
      {tab === 'Usuarios' && <AdminUsers users={users} setUsers={setUsers} />}
      {tab === 'Cursos' && <AdminCourses courses={courses} setCourses={setCourses} />}
      {tab === 'Exámenes' && <AdminExams courses={courses.length ? courses : null} />}
      {tab === 'Calendario' && <AdminCalendar events={calEvents} setEvents={setCalEvents} courses={courses} />}
      {tab === 'Constancias' && <AdminCerts certs={certs} />}
      {tab === 'Progreso' && <AdminProgress progress={progress} />}
    </div>
  );
}

function AdminDashboard({ stats }) {
  if (!stats) return <div className="animate-pulse h-32 bg-slate-100 rounded-xl" />;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[
        { label: 'Empleados activos', value: stats.totalEmployees, icon: '👥', color: 'bg-sky-50' },
        { label: 'Cursos', value: stats.totalCourses, icon: '📚', color: 'bg-purple-50' },
        { label: 'Constancias emitidas', value: stats.totalCertificates, icon: '🏆', color: 'bg-green-50' },
        { label: 'Tasa de aprobación', value: `${stats.examPassRate}%`, icon: '📊', color: 'bg-yellow-50' },
      ].map(s => (
        <div key={s.label} className={`card ${s.color} text-center`}>
          <div className="text-3xl mb-2">{s.icon}</div>
          <div className="text-3xl font-black text-slate-800">{s.value}</div>
          <div className="text-xs text-slate-500 mt-1">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

function AdminUsers({ users, setUsers }) {
  const [form, setForm] = useState({ name:'', email:'', password:'', role:'employee', department:'' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const submit = async e => {
    e.preventDefault();
    setSaving(true); setMsg('');
    try {
      const { data } = await api.post('/auth/register', form);
      setUsers(prev => [data, ...prev]);
      setForm({ name:'', email:'', password:'', role:'employee', department:'' });
      setMsg('Usuario creado exitosamente');
    } catch (err) {
      setMsg(err.response?.data?.error || 'Error al crear usuario');
    } finally { setSaving(false); }
  };

  const toggle = async (id) => {
    const { data } = await api.patch(`/admin/users/${id}/toggle`);
    setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: data.is_active } : u));
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="card">
        <h2 className="font-semibold text-slate-700 mb-4">Registrar usuario</h2>
        <form onSubmit={submit} className="space-y-3">
          {[['name','Nombre completo','text'],['email','Correo electrónico','email'],['password','Contraseña','password'],['department','Departamento','text']].map(([f,l,t]) => (
            <div key={f}>
              <label className="label">{l}</label>
              <input type={t} className="input" required={f !== 'department'} value={form[f]}
                onChange={e => setForm(p => ({...p, [f]: e.target.value}))} />
            </div>
          ))}
          <div>
            <label className="label">Rol</label>
            <select className="input" value={form.role} onChange={e => setForm(p => ({...p, role: e.target.value}))}>
              <option value="employee">Empleado</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          {msg && <p className={`text-xs ${msg.includes('exitosamente') ? 'text-green-600' : 'text-red-600'}`}>{msg}</p>}
          <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? 'Guardando...' : 'Crear usuario'}</button>
        </form>
      </div>

      <div className="lg:col-span-2 card overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-slate-100 font-semibold text-slate-700">Usuarios ({users.length})</div>
        <div className="overflow-auto max-h-[500px]">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 sticky top-0">
              <tr>{['Nombre','Email','Rol','Dpto.','Estado',''].map(h => <th key={h} className="text-left px-4 py-2 text-xs font-semibold text-slate-500">{h}</th>)}</tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-2 font-medium">{u.name}</td>
                  <td className="px-4 py-2 text-slate-500">{u.email}</td>
                  <td className="px-4 py-2"><span className={`text-xs px-2 py-0.5 rounded-full ${u.role==='admin' ? 'bg-purple-100 text-purple-700' : 'bg-sky-100 text-sky-700'}`}>{u.role}</span></td>
                  <td className="px-4 py-2 text-slate-500">{u.department || '—'}</td>
                  <td className="px-4 py-2"><span className={`text-xs px-2 py-0.5 rounded-full ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{u.is_active ? 'Activo' : 'Inactivo'}</span></td>
                  <td className="px-4 py-2"><button onClick={() => toggle(u.id)} className="text-xs text-sky-600 hover:underline">{u.is_active ? 'Desactivar' : 'Activar'}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AdminCourses({ courses, setCourses }) {
  const [form, setForm] = useState({ title:'', description:'', category:'', is_mandatory: false, thumbnail_url:'' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const submit = async e => {
    e.preventDefault();
    setSaving(true); setMsg('');
    try {
      const { data } = await api.post('/courses', form);
      setCourses(prev => [data, ...prev]);
      setForm({ title:'', description:'', category:'', is_mandatory: false, thumbnail_url:'' });
      setMsg('Curso creado. Ahora puedes agregar contenido desde esta misma sección.');
    } catch (err) { setMsg(err.response?.data?.error || 'Error'); } finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!confirm('¿Eliminar este curso? Se eliminarán todos sus contenidos y exámenes.')) return;
    await api.delete(`/courses/${id}`);
    setCourses(prev => prev.filter(c => c.id !== id));
  };

  const [addContent, setAddContent] = useState(null);
  const [contentForm, setContentForm] = useState({ type:'youtube', title:'', url:'', order_index: 0 });
  const [resourceMode, setResourceMode] = useState('url');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [contentError, setContentError] = useState('');

  const submitContent = async e => {
    e.preventDefault();
    setContentError('');

    try {
      let finalUrl = contentForm.url;

      if (resourceMode === 'file') {
        if (!selectedFile) {
          setContentError('Selecciona un archivo para continuar.');
          return;
        }

        setUploadingFile(true);
        const formData = new FormData();
        formData.append('file', selectedFile);
        const uploadResponse = await api.post('/admin/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        finalUrl = uploadResponse.data.url;
      }

      if (!finalUrl) {
        setContentError('Debes proporcionar una URL o subir un archivo válido.');
        return;
      }

      await api.post(`/courses/${addContent}/content`, { ...contentForm, url: finalUrl });
      setAddContent(null);
      setSelectedFile(null);
      setContentForm({ type:'youtube', title:'', url:'', order_index: 0 });
      setResourceMode('url');
      setMsg('Contenido agregado correctamente');
    } catch (err) {
      setContentError(err.response?.data?.error || 'No se pudo agregar el contenido');
    } finally {
      setUploadingFile(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="font-semibold text-slate-700 mb-4">Crear curso</h2>
        <form onSubmit={submit} className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="label">Título</label>
            <input className="input" required value={form.title} onChange={e => setForm(p=>({...p,title:e.target.value}))} />
          </div>
          <div>
            <label className="label">Categoría</label>
            <input className="input" value={form.category} onChange={e => setForm(p=>({...p,category:e.target.value}))} />
          </div>
          <div className="md:col-span-2">
            <label className="label">Descripción</label>
            <textarea className="input h-20 resize-none" value={form.description} onChange={e => setForm(p=>({...p,description:e.target.value}))} />
          </div>
          <div>
            <label className="label">URL de miniatura (opcional)</label>
            <input className="input" type="url" value={form.thumbnail_url} onChange={e => setForm(p=>({...p,thumbnail_url:e.target.value}))} />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input type="checkbox" id="mandatory" checked={form.is_mandatory} onChange={e => setForm(p=>({...p,is_mandatory:e.target.checked}))} className="w-4 h-4 accent-sky-500" />
            <label htmlFor="mandatory" className="text-sm text-slate-700">Curso obligatorio</label>
          </div>
          <div className="md:col-span-2">
            {msg && <p className="text-xs text-green-600 mb-2">{msg}</p>}
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Guardando...' : 'Crear curso'}</button>
          </div>
        </form>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-slate-100 font-semibold text-slate-700">Cursos ({courses.length})</div>
        <div className="divide-y divide-slate-100">
          {courses.map(c => (
            <div key={c.id} className="px-6 py-4 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="font-medium text-slate-800">{c.title}</p>
                <p className="text-xs text-slate-400">{c.category} {c.is_mandatory && '• Obligatorio'}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setAddContent(c.id)} className="btn-secondary text-xs py-1.5">+ Contenido</button>
                <button onClick={() => del(c.id)} className="btn-danger text-xs py-1.5">Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {addContent && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="font-semibold text-slate-700 mb-4">Agregar contenido</h3>
            <form onSubmit={submitContent} className="space-y-3">
              <div>
                <label className="label">Tipo</label>
                <select className="input" value={contentForm.type} onChange={e => setContentForm(p=>({...p,type:e.target.value}))}>
                  <option value="youtube">YouTube</option>
                  <option value="video">Video directo (mp4/webm)</option>
                  <option value="image">Imagen</option>
                  <option value="infographic">Infografía</option>
                  <option value="pdf">PDF</option>
                  <option value="document">Documento</option>
                  <option value="link">Link</option>
                </select>
              </div>
              <div>
                <label className="label">Título</label>
                <input className="input" value={contentForm.title} onChange={e => setContentForm(p=>({...p,title:e.target.value}))} />
              </div>
              <div>
                <label className="label">Origen del recurso</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setResourceMode('url')}
                    className={`text-sm rounded-lg border px-3 py-2 ${resourceMode === 'url' ? 'border-sky-500 text-sky-600 bg-sky-50' : 'border-slate-200 text-slate-600'}`}
                  >
                    Pegar URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setResourceMode('file')}
                    className={`text-sm rounded-lg border px-3 py-2 ${resourceMode === 'file' ? 'border-sky-500 text-sky-600 bg-sky-50' : 'border-slate-200 text-slate-600'}`}
                  >
                    Subir archivo
                  </button>
                </div>
              </div>

              {resourceMode === 'url' ? (
                <div>
                  <label className="label">
                    URL del recurso
                    {contentForm.type === 'youtube' && ' (YouTube: watch, youtu.be, embed o shorts)'}
                    {contentForm.type === 'video' && ' (video directo: .mp4/.webm)'}
                  </label>
                  <input className="input" type="url" required value={contentForm.url} onChange={e => setContentForm(p=>({...p,url:e.target.value}))} />
                </div>
              ) : (
                <div>
                  <label className="label">Archivo desde escritorio</label>
                  <input
                    className="input"
                    type="file"
                    onChange={e => {
                      setSelectedFile(e.target.files?.[0] || null);
                      setContentError('');
                    }}
                    required
                  />
                </div>
              )}

              {(contentForm.type === 'youtube' || contentForm.type === 'link') && resourceMode === 'file' && (
                <p className="text-xs text-amber-600">Sugerencia: para contenidos de tipo {contentForm.type}, se recomienda usar “Pegar URL”.</p>
              )}

              {uploadingFile && <p className="text-xs text-sky-600">Subiendo archivo...</p>}
              {contentError && <p className="text-xs text-red-600">{contentError}</p>}
              <div>
                <label className="label">Orden</label>
                <input className="input" type="number" min="0" value={contentForm.order_index} onChange={e => setContentForm(p=>({...p,order_index:parseInt(e.target.value)}))} />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={uploadingFile} className="btn-primary flex-1 disabled:opacity-60">{uploadingFile ? 'Subiendo archivo...' : 'Agregar'}</button>
                <button type="button" onClick={() => { setAddContent(null); setContentError(''); setSelectedFile(null); setResourceMode('url'); }} className="btn-secondary flex-1">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminExams({ courses }) {
  const [selectedCourse, setSelectedCourse] = useState('');
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [qForm, setQForm] = useState({ question:'', option_a:'', option_b:'', option_c:'', option_d:'', correct_option:'a' });
  const [examForm, setExamForm] = useState({ passing_score: 70, time_limit_min: 30 });
  const [msg, setMsg] = useState('');

  const loadExam = async (courseId) => {
    setSelectedCourse(courseId);
    setExam(null); setQuestions([]);
    try {
      const { data } = await api.get(`/exams/course/${courseId}`);
      setExam(data);
      const qs = await api.get(`/exams/${data.id}/questions`);
      setQuestions(qs.data);
    } catch { setExam(null); }
  };

  const createExam = async () => {
    try {
      const { data } = await api.post(`/exams/course/${selectedCourse}`, examForm);
      setExam(data); setMsg('Examen creado');
    } catch (err) { setMsg(err.response?.data?.error || 'Error'); }
  };

  const addQuestion = async e => {
    e.preventDefault();
    const { data } = await api.post(`/exams/${exam.id}/questions`, qForm);
    setQuestions(prev => [...prev, data]);
    setQForm({ question:'', option_a:'', option_b:'', option_c:'', option_d:'', correct_option:'a' });
  };

  const delQuestion = async (id) => {
    await api.delete(`/exams/questions/${id}`);
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  if (!courses) return <div className="card"><p className="text-slate-400">Cargando cursos...</p></div>;

  return (
    <div className="space-y-6">
      <div className="card">
        <label className="label">Seleccionar curso</label>
        <select className="input max-w-sm" value={selectedCourse} onChange={e => loadExam(e.target.value)}>
          <option value="">— Selecciona un curso —</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </div>

      {selectedCourse && !exam && (
        <div className="card">
          <h3 className="font-semibold text-slate-700 mb-4">Crear examen para este curso</h3>
          <div className="flex gap-4 flex-wrap items-end">
            <div>
              <label className="label">Calificación aprobatoria (%)</label>
              <input type="number" className="input w-28" min="1" max="100" value={examForm.passing_score}
                onChange={e => setExamForm(p=>({...p, passing_score:parseInt(e.target.value)}))} />
            </div>
            <div>
              <label className="label">Tiempo límite (minutos)</label>
              <input type="number" className="input w-28" min="5" value={examForm.time_limit_min}
                onChange={e => setExamForm(p=>({...p, time_limit_min:parseInt(e.target.value)}))} />
            </div>
            <button onClick={createExam} className="btn-primary">Crear examen</button>
          </div>
          {msg && <p className="text-green-600 text-xs mt-2">{msg}</p>}
        </div>
      )}

      {exam && (
        <>
          <div className="card bg-sky-50 border-sky-200 flex flex-wrap gap-4 items-center">
            <div><span className="text-xs text-sky-600 font-semibold">Aprobatorio:</span> <span className="font-bold">{exam.passing_score}%</span></div>
            <div><span className="text-xs text-sky-600 font-semibold">Tiempo:</span> <span className="font-bold">{exam.time_limit_min} min</span></div>
            <div><span className="text-xs text-sky-600 font-semibold">Preguntas:</span> <span className="font-bold">{questions.length}</span></div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-slate-700 mb-4">Agregar pregunta</h3>
            <form onSubmit={addQuestion} className="space-y-3">
              <div>
                <label className="label">Pregunta</label>
                <textarea className="input h-16 resize-none" required value={qForm.question}
                  onChange={e => setQForm(p=>({...p,question:e.target.value}))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[['option_a','Opción A'],['option_b','Opción B'],['option_c','Opción C (opt.)'],['option_d','Opción D (opt.)']].map(([f,l]) => (
                  <div key={f}>
                    <label className="label">{l}</label>
                    <input className="input" required={f==='option_a'||f==='option_b'} value={qForm[f]}
                      onChange={e => setQForm(p=>({...p,[f]:e.target.value}))} />
                  </div>
                ))}
              </div>
              <div>
                <label className="label">Respuesta correcta</label>
                <select className="input w-32" value={qForm.correct_option}
                  onChange={e => setQForm(p=>({...p,correct_option:e.target.value}))}>
                  <option value="a">A</option>
                  <option value="b">B</option>
                  <option value="c">C</option>
                  <option value="d">D</option>
                </select>
              </div>
              <button type="submit" className="btn-primary">Agregar pregunta</button>
            </form>
          </div>

          <div className="card overflow-hidden p-0">
            <div className="px-6 py-4 border-b border-slate-100 font-semibold text-slate-700">Preguntas ({questions.length})</div>
            <div className="divide-y divide-slate-100">
              {questions.map((q, i) => (
                <div key={q.id} className="px-6 py-4 flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700"><span className="text-sky-500 mr-1">{i+1}.</span>{q.question}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {[['a',q.option_a],['b',q.option_b],['c',q.option_c],['d',q.option_d]].filter(([,v])=>v).map(([opt,text]) => (
                        <span key={opt} className={`text-xs px-2 py-0.5 rounded ${q.correct_option===opt ? 'bg-green-100 text-green-700 font-bold' : 'bg-slate-100 text-slate-500'}`}>
                          {opt.toUpperCase()}) {text}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => delQuestion(q.id)} className="text-red-400 hover:text-red-600 text-xs">Eliminar</button>
                </div>
              ))}
              {questions.length === 0 && <div className="px-6 py-8 text-center text-slate-400 text-sm">Sin preguntas aún</div>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function AdminCalendar({ events, setEvents, courses }) {
  const [form, setForm] = useState({ course_id:'', title:'', scheduled_date:'', recurrence:'once', is_mandatory:false, description:'' });
  const [saving, setSaving] = useState(false);

  const submit = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.post('/calendar', form);
      setEvents(prev => [...prev, data]);
      setForm({ course_id:'', title:'', scheduled_date:'', recurrence:'once', is_mandatory:false, description:'' });
    } catch (err) { alert(err.response?.data?.error || 'Error'); } finally { setSaving(false); }
  };

  const del = async (id) => {
    await api.delete(`/calendar/${id}`);
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="card">
        <h3 className="font-semibold text-slate-700 mb-4">Agregar evento</h3>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="label">Curso</label>
            <select className="input" required value={form.course_id} onChange={e => setForm(p=>({...p,course_id:e.target.value}))}>
              <option value="">— Selecciona —</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Título del evento</label>
            <input className="input" value={form.title} onChange={e => setForm(p=>({...p,title:e.target.value}))} />
          </div>
          <div>
            <label className="label">Fecha</label>
            <input type="date" className="input" required value={form.scheduled_date} onChange={e => setForm(p=>({...p,scheduled_date:e.target.value}))} />
          </div>
          <div>
            <label className="label">Recurrencia</label>
            <select className="input" value={form.recurrence} onChange={e => setForm(p=>({...p,recurrence:e.target.value}))}>
              <option value="once">Una vez</option>
              <option value="monthly">Mensual</option>
              <option value="annual">Anual</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="cal_mandatory" checked={form.is_mandatory} onChange={e => setForm(p=>({...p,is_mandatory:e.target.checked}))} className="accent-sky-500" />
            <label htmlFor="cal_mandatory" className="text-sm text-slate-700">Obligatorio</label>
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? 'Guardando...' : 'Agregar evento'}</button>
        </form>
      </div>

      <div className="lg:col-span-2 card overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-slate-100 font-semibold text-slate-700">Eventos ({events.length})</div>
        <div className="divide-y divide-slate-100 max-h-[500px] overflow-auto">
          {events.map(e => (
            <div key={e.id} className="px-6 py-4 flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-slate-800 text-sm">{e.title || e.course_title}</p>
                <p className="text-xs text-slate-400">{new Date(e.scheduled_date+'T00:00:00').toLocaleDateString('es-MX')} • {e.recurrence} {e.is_mandatory && '• Obligatorio'}</p>
              </div>
              <button onClick={() => del(e.id)} className="text-red-400 hover:text-red-600 text-xs">Eliminar</button>
            </div>
          ))}
          {events.length === 0 && <div className="px-6 py-8 text-center text-slate-400 text-sm">Sin eventos</div>}
        </div>
      </div>
    </div>
  );
}

function AdminCerts({ certs }) {
  return (
    <div className="card overflow-hidden p-0">
      <div className="px-6 py-4 border-b border-slate-100 font-semibold text-slate-700">Constancias emitidas ({certs.length})</div>
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>{['Empleado','Departamento','Curso','Folio','Fecha'].map(h => <th key={h} className="text-left px-4 py-2 text-xs font-semibold text-slate-500">{h}</th>)}</tr>
          </thead>
          <tbody>
            {certs.map(c => (
              <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2 font-medium">{c.user_name}</td>
                <td className="px-4 py-2 text-slate-500">{c.department || '—'}</td>
                <td className="px-4 py-2 text-slate-600">{c.course_title}</td>
                <td className="px-4 py-2 font-mono text-xs text-slate-500">{c.folio}</td>
                <td className="px-4 py-2 text-slate-500">{new Date(c.issued_at).toLocaleDateString('es-MX')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {certs.length === 0 && <div className="px-6 py-8 text-center text-slate-400 text-sm">Sin constancias</div>}
      </div>
    </div>
  );
}

function AdminProgress({ progress }) {
  const [search, setSearch] = useState('');
  const filtered = progress.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.course_title?.toLowerCase().includes(search.toLowerCase())
  );
  const STATUS_CLASS = { pending:'badge-optional', in_progress:'badge-pending', completed:'badge-completed' };
  const STATUS_LABEL = { pending:'Pendiente', in_progress:'En progreso', completed:'Completado' };

  return (
    <div className="card overflow-hidden p-0">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
        <span className="font-semibold text-slate-700">Progreso por empleado</span>
        <input className="input max-w-xs" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="overflow-auto max-h-[600px]">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 sticky top-0">
            <tr>{['Empleado','Departamento','Curso','Estado','Completado'].map(h => <th key={h} className="text-left px-4 py-2 text-xs font-semibold text-slate-500">{h}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => (
              <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2 font-medium">{p.name}</td>
                <td className="px-4 py-2 text-slate-500">{p.department || '—'}</td>
                <td className="px-4 py-2 text-slate-600">{p.course_title}</td>
                <td className="px-4 py-2"><span className={STATUS_CLASS[p.status]}>{STATUS_LABEL[p.status]}</span></td>
                <td className="px-4 py-2 text-slate-500 text-xs">{p.completed_at ? new Date(p.completed_at).toLocaleDateString('es-MX') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="px-6 py-8 text-center text-slate-400 text-sm">Sin datos</div>}
      </div>
    </div>
  );
}
