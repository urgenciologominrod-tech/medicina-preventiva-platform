import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 relative overflow-hidden flex items-center justify-center">
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="absolute -bottom-40 -right-20 h-[28rem] w-[28rem] rounded-full bg-sky-700/30 blur-3xl" />

      <div className="w-full max-w-5xl grid lg:grid-cols-2 rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-sky-950/40 bg-white/5 backdrop-blur">
        <div className="hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-cyan-700/30 to-slate-950/40">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-200">Plataforma institucional</p>
            <h1 className="mt-4 text-4xl font-bold leading-tight">Educación continua en salud con estándar premium.</h1>
          </div>
          <p className="text-sm text-slate-200">Capacitación, evaluación y trazabilidad para talento clínico y administrativo.</p>
        </div>

        <div className="bg-white p-8 sm:p-10 text-slate-800">
          <div className="text-center mb-8">
            <div className="mx-auto mb-3 h-14 w-14 rounded-2xl grid place-items-center bg-gradient-to-br from-cyan-500 to-sky-700 text-2xl text-white">🩺</div>
            <h2 className="text-2xl font-bold">Medicina Preventiva</h2>
            <p className="text-slate-500 text-sm mt-1">Acceso seguro para personal autorizado</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Correo electrónico</label>
              <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} required autoFocus placeholder="usuario@hospital.com" />
            </div>
            <div>
              <label className="label">Contraseña</label>
              <input type="password" className="input" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}

            <button type="submit" className="btn-primary w-full text-base py-3" disabled={loading}>{loading ? 'Ingresando...' : 'Iniciar sesión'}</button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-6">¿Problemas para acceder? Contacta al administrador del sistema.</p>
        </div>
      </div>
    </div>
  );
}
