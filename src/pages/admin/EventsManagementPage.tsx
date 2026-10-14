import React, { useState } from 'react';
import { useEvents } from '../../context/EventContext';
import { useAuth } from '../../context/AuthContext';
import { Event } from '../../types/database';
import { Calendar, Plus, CheckCircle, Lock, Radio, History, AlertTriangle } from 'lucide-react';

export const EventsManagementPage: React.FC = () => {
  const { activeEvent, events, setActiveEventId, createEvent, toggleEventStatus } = useEvents();
  const { user } = useAuth();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newDate) return;
    setIsSubmitting(true);
    try {
      await createEvent(newName, newDate, user?.id || 'admin');
      setShowCreateModal(false);
      setNewName('');
    } catch (err: unknown) {
      alert((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleClose = async (ev: Event) => {
    const nextStatus = ev.status === 'ACTIVO' ? 'FINALIZADO' : 'ACTIVO';
    const msg =
      nextStatus === 'FINALIZADO'
        ? `¿Deseas cerrar el operativo "${ev.name}"? No se podrán generar nuevos turnos mientras esté cerrado.`
        : `¿Deseas reabrir el operativo "${ev.name}"?`;

    if (window.confirm(msg)) {
      await toggleEventStatus(ev.id, nextStatus);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Gestión de Operativos Sociales
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Cada operativo cuenta con su propia fecha, estado y secuencias de numeración independientes.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Nuevo Operativo</span>
        </button>
      </div>

      {/* Active Event Banner */}
      {activeEvent && (
        <div className="p-5 bg-indigo-50/70 border border-indigo-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600 text-white rounded-xl">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                Operativo Actualmente Activo
              </span>
              <h2 className="text-lg font-bold text-slate-900">{activeEvent.name}</h2>
              <p className="text-xs text-slate-500">
                Fecha: {activeEvent.event_date} · Estado: {activeEvent.status}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleToggleClose(activeEvent)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                activeEvent.status === 'ACTIVO'
                  ? 'border-rose-300 bg-white text-rose-700 hover:bg-rose-50'
                  : 'border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              {activeEvent.status === 'ACTIVO' ? 'Cerrar Operativo' : 'Reabrir Operativo'}
            </button>
          </div>
        </div>
      )}

      {/* List of Operativos */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Historial de Operativos Registrados</h3>
          <span className="text-xs text-slate-500">{events.length} operativos</span>
        </div>

        <div className="divide-y divide-slate-100">
          {events.map((ev) => {
            const isSelected = ev.id === activeEvent?.id;
            return (
              <div
                key={ev.id}
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                  isSelected ? 'bg-indigo-50/30' : 'hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900">{ev.name}</h4>
                    {isSelected && (
                      <span className="px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-bold rounded-full">
                        ACTIVO EN PANELES
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        ev.status === 'ACTIVO'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {ev.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Fecha del operativo: <strong>{ev.event_date}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {!isSelected && (
                    <button
                      onClick={() => setActiveEventId(ev.id)}
                      className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg transition"
                    >
                      Seleccionar como Activo
                    </button>
                  )}
                  <button
                    onClick={() => handleToggleClose(ev)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg text-xs"
                    title={ev.status === 'ACTIVO' ? 'Cerrar operativo' : 'Reactivar'}
                  >
                    {ev.status === 'ACTIVO' ? <Lock className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Crear Nuevo Operativo Social</h3>
              <p className="text-xs text-slate-500">
                Se iniciará con una secuencia limpia desde el turno 001 para cada uno de los 8 servicios.
              </p>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Nombre del Operativo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Operativo Social Sede Vecinal San Juan"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Fecha del Operativo
                </label>
                <input
                  type="date"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-xs"
                >
                  {isSubmitting ? 'Creando...' : 'Crear y Activar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
