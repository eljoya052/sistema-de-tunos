import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { INITIAL_PROFILES } from '../../lib/storage-engine';
import { Lock, Mail, ArrowRight, Tv, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@operativo.cl');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
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
    setEmail(profEmail);
    setPassword('pro123');
    setIsLoading(true);
    const res = await login(profEmail, 'pro123');
    setIsLoading(false);
    if (res.success) {
      if (profEmail.toLowerCase().includes('admin')) {
        navigate('/admin');
      } else {
        navigate('/profesional');
      }
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@operativo.cl"
                  className="w-full text-sm rounded-lg border border-slate-300 pl-10 pr-3.5 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-hidden transition"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-sm rounded-lg border border-slate-300 pl-10 pr-3.5 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-hidden transition"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md transition disabled:opacity-50"
            >
              <span>{isLoading ? 'Verificando...' : 'Acceder al Sistema'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick 1-click test logins */}
          <div className="pt-4 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5 text-center">
              Acceso Rápido para Pruebas y Evaluación
            </p>
            
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => quickLogin('admin@operativo.cl')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-left transition group"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-700" />
                  <div>
                    <p className="text-xs font-bold text-indigo-950">Administrador General</p>
                    <p className="text-[10px] text-indigo-700">admin@operativo.cl</p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-indigo-600 group-hover:underline">Entrar →</span>
              </button>

              <div className="grid grid-cols-2 gap-1.5 pt-1">
                {INITIAL_PROFILES.filter((p) => p.role === 'PROFESSIONAL').map((prof) => (
                  <button
                    key={prof.id}
                    type="button"
                    onClick={() => quickLogin(prof.email)}
                    className="p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 text-left transition"
                  >
                    <p className="text-[11px] font-bold text-slate-900 truncate">{prof.full_name}</p>
                    <p className="text-[9px] text-slate-500 font-mono truncate">{prof.desk_number || 'Puesto'}</p>
                  </button>
                ))}
              </div>
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
