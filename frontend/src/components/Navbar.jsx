import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navLinks = [
  { to: '/dashboard', label: 'Inicio', icon: 'Inicio' },
  { to: '/courses', label: 'Cursos', icon: 'Cursos' },
  { to: '/certificates', label: 'Constancias', icon: 'Logros' },
  { to: '/calendar', label: 'Calendario', icon: 'Agenda' },
  { to: '/competencias', label: 'Competencias', icon: 'Matriz' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav className="sticky top-0 z-40 border-b border-white/20 bg-slate-950/90 text-white backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <Link to="/dashboard" className="flex items-center gap-3 font-bold text-lg tracking-tight">
          <span className="h-9 w-9 grid place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-sky-600 shadow-lg shadow-cyan-900/30">🩺</span>
          <div className="hidden sm:block leading-tight">
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Medicina Preventiva</p>
            <p className="text-xs text-slate-300">Capacitación institucional</p>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-1 rounded-2xl border border-white/10 bg-white/5 p-1">
          {navLinks.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition ${location.pathname === l.to ? 'bg-cyan-400/20 text-cyan-100' : 'text-slate-200 hover:bg-white/10'}`}
            >
              {l.label}
            </Link>
          ))}
          {user?.role === 'admin' && (
            <Link
              to="/admin"
              className={`px-3 py-2 rounded-xl text-sm font-medium transition ${location.pathname === '/admin' ? 'bg-cyan-400/20 text-cyan-100' : 'text-slate-200 hover:bg-white/10'}`}
            >
              Admin
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden lg:block text-sm text-slate-300">{user?.name}</span>
          <button onClick={handleLogout} className="text-sm rounded-xl bg-white/10 hover:bg-white/20 px-3 py-2 transition">Salir</button>
          <button className="md:hidden text-sm rounded-xl bg-white/10 px-3 py-2" onClick={() => setOpen(!open)}>Menú</button>
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-slate-900 border-t border-white/10 px-4 pb-4 pt-2 flex flex-col gap-1">
          {navLinks.map(l => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="px-3 py-2 rounded-xl text-sm hover:bg-white/10 text-slate-200">
              {l.label}
            </Link>
          ))}
          {user?.role === 'admin' && <Link to="/admin" onClick={() => setOpen(false)} className="px-3 py-2 rounded-xl text-sm hover:bg-white/10 text-slate-200">Admin</Link>}
        </div>
      )}
    </nav>
  );
}
