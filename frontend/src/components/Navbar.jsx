import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navLinks = [
  { to: '/dashboard', label: 'Inicio', icon: '🏠' },
  { to: '/courses', label: 'Cursos', icon: '📚' },
  { to: '/certificates', label: 'Constancias', icon: '🏆' },
  { to: '/calendar', label: 'Calendario', icon: '📅' },
  { to: '/competencias', label: 'Competencias', icon: '📊' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav className="bg-sky-700 text-white shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        <Link to="/dashboard" className="flex items-center gap-2 font-bold text-lg">
          <span className="text-2xl">🩺</span>
          <span className="hidden sm:block">Medicina Preventiva</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(l => (
            <Link key={l.to} to={l.to}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${location.pathname === l.to ? 'bg-white/20' : 'hover:bg-white/10'}`}>
              {l.icon} {l.label}
            </Link>
          ))}
          {user?.role === 'admin' && (
            <Link to="/admin"
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/admin' ? 'bg-white/20' : 'hover:bg-white/10'}`}>
              ⚙️ Admin
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-sm opacity-80">{user?.name}</span>
          <button onClick={handleLogout} className="text-sm bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors">
            Salir
          </button>
          <button className="md:hidden" onClick={() => setOpen(!open)}>☰</button>
        </div>
      </div>

      {/* Mobile */}
      {open && (
        <div className="md:hidden bg-sky-800 px-4 pb-4 flex flex-col gap-1">
          {navLinks.map(l => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-white/10">
              {l.icon} {l.label}
            </Link>
          ))}
          {user?.role === 'admin' && (
            <Link to="/admin" onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-white/10">
              ⚙️ Admin
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
