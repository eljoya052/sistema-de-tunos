import React, { useState } from 'react';
import { Database, Copy, Check, ExternalLink, X, RefreshCw, Key, ShieldCheck, Sparkles } from 'lucide-react';
import { supabaseUrl, supabaseAnonKey, isSupabaseConfigured, saveSupabaseConfig } from '../../lib/supabase';
import { repository } from '../../lib/repository';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({ isOpen, onClose }) => {
  const [url, setUrl] = useState(supabaseUrl);
  const [key, setKey] = useState(supabaseAnonKey);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<'config' | 'sql' | 'reset'>('config');

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig(url, key);
  };

  const copySqlMigration = () => {
    const sqlScript = `-- SQL DE MIGRACIÓN PARA SUPABASE
-- Ejecutar en Supabase Dashboard > SQL Editor:
-- Tablas: events, profiles, services, professional_services, people, tickets, ticket_events, service_counters, public_calls
-- Funciones con locks SKIP LOCKED: claim_next_ticket, generate_ticket`;
    navigator.clipboard.writeText(sqlScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResetData = () => {
    if (window.confirm('¿Deseas reiniciar la base de datos a los datos de prueba iniciales (8 servicios y turnos de ejemplo)?')) {
      repository.resetDatabase();
      onClose();
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Configuración de Base de Datos y Supabase</h3>
              <p className="text-xs text-slate-500">
                Estado: {isSupabaseConfigured ? (
                  <span className="text-emerald-600 font-semibold inline-flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Conectado a Supabase Cloud
                  </span>
                ) : (
                  <span className="text-indigo-600 font-semibold inline-flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Motor Transaccional Local (Stand-alone Reactivo)
                  </span>
                )}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-slate-200 px-5 pt-3 gap-4 text-sm font-medium">
          <button
            onClick={() => setTab('config')}
            className={`pb-2.5 transition-colors border-b-2 ${
              tab === 'config'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Credenciales Supabase
          </button>
          <button
            onClick={() => setTab('sql')}
            className={`pb-2.5 transition-colors border-b-2 ${
              tab === 'sql'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Guía de Migración SQL
          </button>
          <button
            onClick={() => setTab('reset')}
            className={`pb-2.5 transition-colors border-b-2 ${
              tab === 'reset'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Reiniciar Datos
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {tab === 'config' && (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-xs leading-relaxed">
                <strong>Modo Híbrido:</strong> El sistema opera inmediatamente sin requerir credenciales externas gracias al motor reactivo persistente en navegador (con canales de sincronización en tiempo real multi-pestaña y bloqueos atómicos). Si dispones de un proyecto en Supabase, ingresa tus credenciales a continuación.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  URL del Proyecto Supabase
                </label>
                <input
                  type="url"
                  placeholder="https://xyzcompany.supabase.co"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Supabase Anon Key (Clave Pública)
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    className="w-full text-sm rounded-lg border border-slate-300 p-2.5 pr-10 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 font-mono text-xs"
                  />
                  <Key className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                {url && (
                  <button
                    type="button"
                    onClick={() => { setUrl(''); setKey(''); saveSupabaseConfig('', ''); }}
                    className="text-xs text-rose-600 hover:underline"
                  >
                    Desconectar y volver a Motor Local
                  </button>
                )}
                <button
                  type="submit"
                  className="ml-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg transition shadow-xs"
                >
                  Guardar y Conectar
                </button>
              </div>
            </form>
          )}

          {tab === 'sql' && (
            <div className="space-y-4">
              <p className="text-slate-600 leading-relaxed text-xs">
                El archivo de migración oficial se encuentra en <code>supabase/migrations/20261013000000_operativo_turnos.sql</code>.
                Incluye tablas relacionales, RLS, índices, el contador transaccional y la función <code>claim_next_ticket</code> con <code>SELECT FOR UPDATE SKIP LOCKED</code>.
              </p>
              
              <div className="bg-slate-900 text-slate-200 p-4 rounded-lg font-mono text-xs max-h-60 overflow-y-auto space-y-1">
                <p className="text-emerald-400">-- 8 Servicios obligatorios y funciones atómicas listos</p>
                <p className="text-slate-400">-- Ejecute este archivo en Supabase SQL Editor:</p>
                <p>CREATE TABLE public.events (...);</p>
                <p>CREATE TABLE public.services (...);</p>
                <p>CREATE TABLE public.tickets (...);</p>
                <p>CREATE FUNCTION public.claim_next_ticket(...) ... FOR UPDATE SKIP LOCKED;</p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:underline font-medium"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Abrir Supabase Dashboard
                </a>
                <button
                  onClick={copySqlMigration}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copiado al portapapeles' : 'Copiar encabezado SQL'}
                </button>
              </div>
            </div>
          )}

          {tab === 'reset' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs leading-relaxed">
                <strong>¿Deseas reiniciar los datos de demostración?</strong>
                <p className="mt-1">
                  Esto restaurará los 8 servicios oficiales (FON, PSI, ASO, ENF, JUR, VET, KIN, BAR), las cuentas de prueba iniciales de profesionales y los turnos de ejemplo para pruebas en vivo.
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetData}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-xs transition"
              >
                <RefreshCw className="w-4 h-4" /> Restaurar Datos y Turnos Iniciales
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
