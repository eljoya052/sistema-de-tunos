import React, { useState, useEffect, useMemo } from 'react';
import { repository } from '../../lib/repository';
import { useEvents } from '../../context/EventContext';
import { Ticket, Service, Profile } from '../../types/database';
import {
  BarChart3,
  Clock,
  CheckCircle2,
  Users,
  Timer,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { activeEvent, events } = useEvents();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(activeEvent?.id || 'ALL');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      const [tkts, srvs, profs] = await Promise.all([
        repository.getTickets({
          eventId: selectedEventId === 'ALL' ? undefined : selectedEventId,
        }),
        repository.getServices(),
        repository.getProfiles(),
      ]);
      setTickets(tkts);
      setServices(srvs);
      setProfiles(profs);
    } catch (e) {
      console.error('Error loading reports data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedEventId]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (selectedServiceId !== 'ALL' && t.service_id !== selectedServiceId) return false;
      return true;
    });
  }, [tickets, selectedServiceId]);

  // Real calculations
  const totalTickets = filteredTickets.length;
  const attendedTickets = filteredTickets.filter((t) => t.status === 'ATENDIDO');
  const absentTickets = filteredTickets.filter((t) => t.status === 'AUSENTE').length;
  const canceledTickets = filteredTickets.filter((t) => t.status === 'CANCELADO').length;
  const pendingTickets = filteredTickets.filter((t) => t.status === 'PENDIENTE').length;

  // Average Attention Time (only valid tickets with both started_at and completed_at)
  const validAttentionDurations = attendedTickets
    .filter((t) => t.started_at && t.completed_at)
    .map((t) => {
      const start = new Date(t.started_at!).getTime();
      const end = new Date(t.completed_at!).getTime();
      return Math.max(0, (end - start) / 60000); // in minutes
    });

  const avgAttentionMinutes =
    validAttentionDurations.length > 0
      ? Math.round(
          validAttentionDurations.reduce((a, b) => a + b, 0) / validAttentionDurations.length
        )
      : 0;

  // Average Wait Time (from created_at to called_at)
  const validWaitDurations = filteredTickets
    .filter((t) => t.created_at && t.called_at)
    .map((t) => {
      const created = new Date(t.created_at).getTime();
      const called = new Date(t.called_at!).getTime();
      return Math.max(0, (called - created) / 60000); // in minutes
    });

  const avgWaitMinutes =
    validWaitDurations.length > 0
      ? Math.round(validWaitDurations.reduce((a, b) => a + b, 0) / validWaitDurations.length)
      : 0;

  // Breakdown by Service
  const serviceStats = useMemo(() => {
    return services.map((srv) => {
      const srvTickets = tickets.filter((t) => t.service_id === srv.id);
      const attended = srvTickets.filter((t) => t.status === 'ATENDIDO').length;
      const pending = srvTickets.filter((t) => t.status === 'PENDIENTE').length;
      const absent = srvTickets.filter((t) => t.status === 'AUSENTE').length;
      const canceled = srvTickets.filter((t) => t.status === 'CANCELADO').length;
      return {
        service: srv,
        total: srvTickets.length,
        attended,
        pending,
        absent,
        canceled,
        completionRate: srvTickets.length > 0 ? Math.round((attended / srvTickets.length) * 100) : 0,
      };
    });
  }, [services, tickets]);

  // Breakdown by Professional
  const professionalStats = useMemo(() => {
    return profiles
      .filter((p) => p.role === 'PROFESSIONAL')
      .map((prof) => {
        const profTickets = tickets.filter((t) => t.assigned_professional_id === prof.id);
        const attended = profTickets.filter((t) => t.status === 'ATENDIDO').length;
        const absent = profTickets.filter((t) => t.status === 'AUSENTE').length;
        return {
          professional: prof,
          total: profTickets.length,
          attended,
          absent,
        };
      });
  }, [profiles, tickets]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Estadísticas y Reportes de Rendimiento
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Métricas calculadas exclusivamente con registros válidos del operativo.
          </p>
        </div>

        {/* Global Filter by Event */}
        <div className="flex items-center gap-3">
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="text-xs sm:text-sm rounded-lg border border-slate-300 p-2 bg-white font-medium"
          >
            <option value="ALL">Todos los operativos registrados</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.name} ({ev.event_date})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase">
            <Timer className="w-4 h-4 text-indigo-600" />
            <span>Tiempo Promedio de Atención</span>
          </div>
          <p className="mt-2 text-3xl font-black text-slate-900">
            {avgAttentionMinutes > 0 ? `${avgAttentionMinutes} min` : 'N/A'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Basado en {validAttentionDurations.length} atenciones concluidas
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>Tiempo Promedio de Espera</span>
          </div>
          <p className="mt-2 text-3xl font-black text-slate-900">
            {avgWaitMinutes > 0 ? `${avgWaitMinutes} min` : 'N/A'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Desde emisión hasta el primer llamado
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Tasa de Efectividad</span>
          </div>
          <p className="mt-2 text-3xl font-black text-slate-900">
            {totalTickets > 0 ? `${Math.round((attendedTickets.length / totalTickets) * 100)}%` : '0%'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {attendedTickets.length} de {totalTickets} turnos atendidos
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>Tasa de Ausentismo</span>
          </div>
          <p className="mt-2 text-3xl font-black text-slate-900">
            {totalTickets > 0 ? `${Math.round((absentTickets / totalTickets) * 100)}%` : '0%'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {absentTickets} personas no se presentaron
          </p>
        </div>
      </div>

      {/* Breakdown by Service Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Rendimiento por Servicio</h2>
          <span className="text-xs text-slate-500">8 servicios monitoreados</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Servicio</th>
                <th className="px-4 py-3 text-center">Total Turnos</th>
                <th className="px-4 py-3 text-center">Atendidos</th>
                <th className="px-4 py-3 text-center">En Espera</th>
                <th className="px-4 py-3 text-center">Ausentes</th>
                <th className="px-4 py-3 text-center">Cancelados</th>
                <th className="px-4 py-3 text-right">% Completado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {serviceStats.map((item) => (
                <tr key={item.service.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-4 py-3 font-mono font-bold text-indigo-900">
                    {item.service.code}
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-900">
                    {item.service.name}
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-slate-800">
                    {item.total}
                  </td>
                  <td className="px-4 py-3 text-center font-semibold text-emerald-700">
                    {item.attended}
                  </td>
                  <td className="px-4 py-3 text-center font-semibold text-amber-700">
                    {item.pending}
                  </td>
                  <td className="px-4 py-3 text-center text-rose-700">
                    {item.absent}
                  </td>
                  <td className="px-4 py-3 text-center text-slate-500">
                    {item.canceled}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-block font-black text-slate-900">
                      {item.completionRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Breakdown by Professional Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">
            Rendimiento por Profesión / Puesto de Atención
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">Profesión / Puesto</th>
                <th className="px-4 py-3">Módulo</th>
                <th className="px-4 py-3 text-center">Total Turnos Tomados</th>
                <th className="px-4 py-3 text-center">Atenciones Finalizadas</th>
                <th className="px-4 py-3 text-center">Ausentes Registrados</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {professionalStats.map((item) => (
                <tr key={item.professional.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-4 py-3 font-bold text-slate-900">
                    {item.professional.full_name}
                    <span className="block text-[10px] text-slate-400 font-mono font-normal">
                      {item.professional.email}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {item.professional.desk_number || 'General'}
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-slate-800">
                    {item.total}
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-emerald-700">
                    {item.attended}
                  </td>
                  <td className="px-4 py-3 text-center text-rose-700">
                    {item.absent}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
