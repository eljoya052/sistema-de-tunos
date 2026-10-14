import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useEvents } from '../../context/EventContext';
import {
  LogOut,
  Tv,
  Database,
  Radio,
  User,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { soundManager } from '../../lib/audio';
import { isSupabaseConfigured } from '../../lib/supabase';
import { SupabaseConfigModal } from '../common/SupabaseConfigModal';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, logout, switchUser } = useAuth();
  const { activeEvent } = useEvents();
  const navigate = useNavigate();
  const [showConfig, setShowConfig] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [soundActive, setSoundActive] = useState(soundManager.isEnabled());

  const handleToggleSound = () => {
    soundManager.enableAudio();
    soundManager.playChime();
    setSoundActive(true);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Brand + Active event */}
            <div className="flex items-center gap-4">
              {onToggleSidebar && (
                <button
                  type="button"
                  onClick={onToggleSidebar}
                  className="lg:hidden p-2 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                  aria-label="Abrir menú"
                >
                  <SlidersHorizontal className="w-5 h-5" />
                </button>
              )}

              <Link to="/" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold tracking-tight shadow-xs group-hover:bg-indigo-700 transition">
                  TS
                </div>
                <div>
                  <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg block leading-none">
                    TurnoSocial
                  </span>
                  <span className="text-[10px] text-slate-500 tracking-wider font-medium uppercase">
                    operativo social IBM 2026
                  </span>
                </div>
              </Link>

              {activeEvent && (
                <div className="hidden md:flex items-center gap-2 pl-4 border-l border-slate-200 text-xs text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-medium truncate max-w-xs text-slate-800" title={activeEvent.name}>
                    {activeEvent.name}
                  </span>
                  <span className="text-slate-400">({activeEvent.event_date})</span>
                </div>
              )}
            </div>

            {/* Right: Quick actions & user menu */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Public Display shortcut (In-app navigation to avoid browser tab storage partition) */}
              <Link
                to="/pantalla"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition shadow-xs"
                title="Ver pantalla pública oficial de llamados"
              >
                <Tv className="w-4 h-4 text-indigo-600" />
                <span>Pantalla TV</span>
              </Link>

              {/* Sound Test / Enable */}
              <button
                type="button"
                onClick={handleToggleSound}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition ${
                  soundActive
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 hover:bg-slate-100 text-slate-600'
                }`}
                title="Probar / Activar timbre de llamados"
              >
                <Radio className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{soundActive ? 'Audio Activo' : 'Activar Audio'}</span>
              </button>

              {/* Database status button */}
              <button
                type="button"
                onClick={() => setShowConfig(true)}
                className={`p-2 rounded-lg border transition text-xs font-medium flex items-center gap-1.5 ${
                  isSupabaseConfigured
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 hover:bg-slate-100 text-slate-600'
                }`}
                title="Configuración de Base de Datos y Supabase"
              >
                <Database className="w-4 h-4" />
                <span className="hidden xl:inline">
                  {isSupabaseConfigured ? 'Supabase' : 'BD Local'}
                </span>
              </button>

              {/* User Dropdown / Switcher */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
                  >
                    <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs">
                      {user.full_name.charAt(0)}
                    </div>
                    <div className="text-left hidden sm:block">
                      <p className="text-xs font-semibold text-slate-900 leading-none truncate max-w-[120px]">
                        {user.full_name}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {user.role === 'ADMIN' ? 'Administrador' : 'Profesional'}
                      </p>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {showUserDropdown && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-xs text-slate-500">Conectado como:</p>
                        <p className="text-sm font-bold text-slate-900 truncate">{user.full_name}</p>
                        <p className="text-xs text-slate-500 font-mono truncate">{user.email}</p>
                      </div>

                      {/* Fast Role Switcher for instant evaluator testing */}
                      <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/50">
                        <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                          Conmutar usuario de prueba:
                        </p>
                        <div className="space-y-1">
                          <button
                            onClick={() => { switchUser('user-admin-01'); setShowUserDropdown(false); navigate('/admin'); }}
                            className={`w-full text-left px-2 py-1 text-xs rounded-md transition ${user.id === 'user-admin-01' ? 'bg-indigo-100 text-indigo-900 font-semibold' : 'hover:bg-slate-200 text-slate-700'}`}
                          >
                            🛡️ Administrador General
                          </button>
                          <button
                            onClick={() => { switchUser('user-pro-psi'); setShowUserDropdown(false); navigate('/profesional'); }}
                            className={`w-full text-left px-2 py-1 text-xs rounded-md transition ${user.id === 'user-pro-psi' ? 'bg-indigo-100 text-indigo-900 font-semibold' : 'hover:bg-slate-200 text-slate-700'}`}
                          >
                            🧠 Psicología (Box 1)
                          </button>
                          <button
                            onClick={() => { switchUser('user-pro-enf'); setShowUserDropdown(false); navigate('/profesional'); }}
                            className={`w-full text-left px-2 py-1 text-xs rounded-md transition ${user.id === 'user-pro-enf' ? 'bg-indigo-100 text-indigo-900 font-semibold' : 'hover:bg-slate-200 text-slate-700'}`}
                          >
                            🩺 Enfermería (Box 2)
                          </button>
                          <button
                            onClick={() => { switchUser('user-pro-aso'); setShowUserDropdown(false); navigate('/profesional'); }}
                            className={`w-full text-left px-2 py-1 text-xs rounded-md transition ${user.id === 'user-pro-aso' ? 'bg-indigo-100 text-indigo-900 font-semibold' : 'hover:bg-slate-200 text-slate-700'}`}
                          >
                            📋 Asistente Social (Módulo A)
                          </button>
                          <button
                            onClick={() => { switchUser('user-pro-fon'); setShowUserDropdown(false); navigate('/profesional'); }}
                            className={`w-full text-left px-2 py-1 text-xs rounded-md transition ${user.id === 'user-pro-fon' ? 'bg-indigo-100 text-indigo-900 font-semibold' : 'hover:bg-slate-200 text-slate-700'}`}
                          >
                            🗣️ Fonoaudiología (Box 3)
                          </button>
                          <button
                            onClick={() => { switchUser('user-pro-jur'); setShowUserDropdown(false); navigate('/profesional'); }}
                            className={`w-full text-left px-2 py-1 text-xs rounded-md transition ${user.id === 'user-pro-jur' ? 'bg-indigo-100 text-indigo-900 font-semibold' : 'hover:bg-slate-200 text-slate-700'}`}
                          >
                            ⚖️ Asesoría Jurídica (Módulo B)
                          </button>
                          <button
                            onClick={() => { switchUser('user-pro-vet'); setShowUserDropdown(false); navigate('/profesional'); }}
                            className={`w-full text-left px-2 py-1 text-xs rounded-md transition ${user.id === 'user-pro-vet' ? 'bg-indigo-100 text-indigo-900 font-semibold' : 'hover:bg-slate-200 text-slate-700'}`}
                          >
                            🐾 Veterinaria (Área Canina)
                          </button>
                          <button
                            onClick={() => { switchUser('user-pro-kin'); setShowUserDropdown(false); navigate('/profesional'); }}
                            className={`w-full text-left px-2 py-1 text-xs rounded-md transition ${user.id === 'user-pro-kin' ? 'bg-indigo-100 text-indigo-900 font-semibold' : 'hover:bg-slate-200 text-slate-700'}`}
                          >
                            🏃 Kinesiología (Box 4)
                          </button>
                          <button
                            onClick={() => { switchUser('user-pro-bar'); setShowUserDropdown(false); navigate('/profesional'); }}
                            className={`w-full text-left px-2 py-1 text-xs rounded-md transition ${user.id === 'user-pro-bar' ? 'bg-indigo-100 text-indigo-900 font-semibold' : 'hover:bg-slate-200 text-slate-700'}`}
                          >
                            ✂️ Barbería (Sillón 1)
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-rose-600 hover:bg-rose-50 transition font-medium"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Iniciar Sesión</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <SupabaseConfigModal isOpen={showConfig} onClose={() => setShowConfig(false)} />
    </>
  );
};
