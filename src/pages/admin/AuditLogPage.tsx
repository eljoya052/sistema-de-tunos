import React, { useState, useEffect } from 'react';
import { repository } from '../../lib/repository';
import { TicketEvent } from '../../types/database';
import { History, Search, ShieldCheck, Filter, User } from 'lucide-react';

export const AuditLogPage: React.FC = () => {
  const [events, setEvents] = useState<TicketEvent[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      const log = await repository.getTicketEvents();
      setEvents(log);
    } catch (e) {
      console.error('Error loading audit log:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = repository.subscribeRealtime(() => {
      loadData();
    });
    return unsubscribe;
  }, []);

  const filteredEvents = events.filter((ev) => {
    if (selectedType !== 'ALL' && ev.event_type !== selectedType) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const detailsMatch = ev.details && ev.details.toLowerCase().includes(q);
      const actorMatch = ev.actor_name && ev.actor_name.toLowerCase().includes(q);
      const typeMatch = ev.event_type.toLowerCase().includes(q);
      return detailsMatch || actorMatch || typeMatch;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Registro de Auditoría y Trazabilidad
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Historial inmutable de todas las acciones operativas, llamadas, cancelaciones y modificaciones.
          </p>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar por detalle, actor o turno..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs sm:text-sm rounded-lg border border-slate-300 pl-9 pr-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-hidden"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="text-xs sm:text-sm rounded-lg border border-slate-300 p-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
        >
          <option value="ALL">Todos los tipos de acción</option>
          <option value="CREATED">CREATED (Creación de turno)</option>
          <option value="CALLED">CALLED (Llamado a módulo)</option>
          <option value="RECALLED">RECALLED (Re-llamado)</option>
          <option value="STARTED">STARTED (Inicio de atención)</option>
          <option value="COMPLETED">COMPLETED (Atención finalizada)</option>
          <option value="ABSENT">ABSENT (Marcado ausente)</option>
          <option value="CANCELED">CANCELED (Turno cancelado)</option>
          <option value="REOPENED">REOPENED (Reapertura de turno)</option>
          <option value="EDITED">EDITED (Datos modificados)</option>
        </select>
      </div>

      {/* Events table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
            <tr>
              <th className="px-4 py-3">Fecha y Hora</th>
              <th className="px-4 py-3">Acción</th>
              <th className="px-4 py-3">Transición de Estado</th>
              <th className="px-4 py-3">Detalle / Motivo</th>
              <th className="px-4 py-3">Actor / Usuario</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
            {filteredEvents.map((ev) => (
              <tr key={ev.id} className="hover:bg-slate-50/50 transition">
                <td className="px-4 py-3 text-slate-500 text-[11px]">
                  {new Date(ev.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                      ev.event_type === 'CANCELED'
                        ? 'bg-rose-100 text-rose-800'
                        : ev.event_type === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : ev.event_type === 'CALLED' || ev.event_type === 'RECALLED'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {ev.event_type}
                  </span>
                </td>
                <td className="px-4 py-3 font-sans text-xs">
                  {ev.previous_status ? (
                    <span className="text-slate-500">
                      {ev.previous_status} → <strong className="text-slate-900">{ev.new_status}</strong>
                    </span>
                  ) : (
                    <span className="text-slate-900 font-semibold">{ev.new_status || '-'}</span>
                  )}
                </td>
                <td className="px-4 py-3 font-sans text-xs text-slate-800">
                  {ev.details || 'Sin detalle'}
                </td>
                <td className="px-4 py-3 font-sans text-xs font-semibold text-slate-700">
                  {ev.actor_name || 'Sistema'}
                </td>
              </tr>
            ))}

            {filteredEvents.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-slate-400 font-sans italic">
                  No hay registros de auditoría que coincidan con la búsqueda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
