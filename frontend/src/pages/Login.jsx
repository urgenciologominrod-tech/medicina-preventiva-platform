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
    <div className="min-h-screen bg-gradient-to-br from-sky-700 to-sky-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🩺</div>
          <h1 className="text-2xl font-bold text-slate-800">Medicina Preventiva</h1>
          <p className="text-slate-500 text-sm mt-1">Plataforma de Capacitación y Competencias</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Correo electrónico</label>
            <input type="email" className="input" value={email}
              onChange={e => setEmail(e.target.value)} required autoFocus
              placeholder="usuario@hospital.com" />
          </div>
          <div>
            <label className="label">Contraseña</label>
            <input type="password" className="input" value={password}
              onChange={e => setPassword(e.target.value)} required
              placeholder="••••••••" />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary w-full text-base py-3" disabled={loading}>
            {loading ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          ¿Problemas para acceder? Contacta al administrador del sistema.
        </p>
      </div>
    </div>
  );
}
