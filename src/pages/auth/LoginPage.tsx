import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { INITIAL_PROFILES } from '../../lib/storage-engine';
import { Lock, Mail, ArrowRight, Tv, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@operativo.cl');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (trimmedEmail.includes('admin') || trimmedEmail === 'admin@operativo.cl') {
      if (!password || password.trim() !== 'admin123') {
        setError('Contraseña incorrecta. Solo el Administrador General con la clave autorizada puede acceder al panel.');
        return;
      }
    }

    setIsLoading(true);
    const res = await login(email, password);
    setIsLoading(false);

    if (res.success) {
      if (email.toLowerCase().includes('admin')) {
        navigate('/admin');
      } else {
        navigate('/profesional');
      }
    } else {
      setError(res.error || 'Credenciales inválidas');
    }
  };

  const quickLogin = async (profEmail: string) => {
    setError(null);
    if (profEmail.toLowerCase().includes('admin')) {
      setEmail('admin@operativo.cl');
      setPassword('');
      setError('Para acceder como Administrador General debe ingresar la clave autorizada.');
      return;
    }

    setEmail(profEmail);
    setPassword('pro123');
    setIsLoading(true);
    const res = await login(profEmail, 'pro123');
    setIsLoading(false);
    if (res.success) {
      navigate('/profesional');
    } else {
      setError(res.error || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-extrabold text-2xl mx-auto shadow-md">
          TS
        </div>
        <h2 className="mt-4 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          TurnoSocial
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Sistema de Gestión y Atención de Turnos para Operativos Sociales
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl border border-slate-200 rounded-2xl space-y-6">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {user && user.role !== 'ADMIN' && (
            <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] text-indigo-700 font-medium">Puesto conectado en este equipo:</p>
                <p className="text-xs font-bold text-indigo-950">
                  {user.full_name} ({user.desk_number || 'Puesto Profesional'})
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/profesional')}
                className="shrink-0 px-3 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow-xs cursor-pointer"
              >
                Ir a mi puesto →
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Correo Electrónico
                </label>
                {email === 'admin@operativo.cl' && (
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                    Administrador General
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@operativo.cl"
                  className="w-full text-sm rounded-lg border border-slate-300 pl-10 pr-3.5 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-hidden transition"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Contraseña
                </label>
                {email === 'admin@operativo.cl' && (
                  <span className="text-[10px] font-medium text-slate-400">
                    Clave requerida para panel
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingrese contraseña de administrador..."
                  className="w-full text-sm rounded-lg border border-slate-300 pl-10 pr-3.5 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-hidden transition"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              <span>{isLoading ? 'Verificando...' : 'Acceder al Sistema'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Access for Professionals */}
          <div className="pt-4 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5 text-center">
              Puestos de Atención Profesional (Sin acceso a Administración)
            </p>
            
            <div className="grid grid-cols-2 gap-1.5">
              {INITIAL_PROFILES.filter((p) => p.role === 'PROFESSIONAL').map((prof) => (
                <button
                  key={prof.id}
                  type="button"
                  onClick={() => quickLogin(prof.email)}
                  className="p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 text-left transition cursor-pointer"
                >
                  <p className="text-[11px] font-bold text-slate-900 truncate">{prof.full_name}</p>
                  <p className="text-[9px] text-slate-500 font-mono truncate">{prof.desk_number || 'Puesto'}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Public screen link */}
          <div className="text-center pt-2">
            <Link
              to="/pantalla"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
            >
              <Tv className="w-4 h-4 text-indigo-600" />
              <span>Ver Pantalla Pública de Llamados (Sin inicio de sesión)</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
