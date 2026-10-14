import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { repository } from '../../lib/repository';
import { useEvents } from '../../context/EventContext';
import { Ticket, Service, Profile, Person } from '../../types/database';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  Users,
  Ticket as TicketIcon,
  Clock,
  Bell,
  UserCheck,
  CheckCircle2,
  XCircle,
  UserX,
  UserPlus,
  Tv,
  ArrowRight,
  RotateCcw
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { activeEvent } = useEvents();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      const [tkts, srvs, profs, ppl] = await Promise.all([
        repository.getTickets({ eventId: activeEvent?.id }),
        repository.getServices(),
        repository.getProfiles(),
        repository.getPeople(),
      ]);
      setTickets(tkts);
      setServices(srvs);
      setProfiles(profs);
      setPeople(ppl);
    } catch (e) {
      console.error('Error loading dashboard data:', e);
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
  }, [activeEvent?.id]);

  // General metrics calculations
  const totalPeople = people.length;
  const totalTickets = tickets.length;
  const pendingTickets = tickets.filter((t) => t.status === 'PENDIENTE').length;
  const calledTickets = tickets.filter((t) => t.status === 'LLAMADO').length;
  const inAttentionTickets = tickets.filter((t) => t.status === 'EN_ATENCION').length;
  const completedTickets = tickets.filter((t) => t.status === 'ATENDIDO').length;
  const canceledTickets = tickets.filter((t) => t.status === 'CANCELADO').length;
  const absentTickets = tickets.filter((t) => t.status === 'AUSENTE').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleResetToZero = async () => {
    if (window.confirm('¿Confirmas que deseas poner todos los turnos y contadores en cero?')) {
      await repository.resetAllTicketsToZero();
      await loadData();
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Panel de Control Central
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Supervisión integral en tiempo real del operativo social y sus 8 servicios.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleResetToZero}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs sm:text-sm font-semibold rounded-lg transition cursor-pointer"
            title="Poner todos los turnos y contadores en cero"
          >
            <RotateCcw className="w-4 h-4 text-rose-600" />
            <span>Turnos a Cero</span>
          </button>

          <Link
            to="/profesional"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition"
          >
            <Bell className="w-4 h-4" />
            <span>Puesto de Atención (Llamar)</span>
          </Link>

          <Link
            to="/pantalla"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold rounded-lg transition"
            title="Ver pantalla pública oficial de llamados"
          >
            <Tv className="w-4 h-4 text-indigo-600" />
            <span>Pantalla TV</span>
          </Link>
        </div>
      </div>

      {/* 8 Primary Operational Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase">
            <Users className="w-4 h-4 text-slate-400" />
            <span>Personas</span>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{totalPeople}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Registradas</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase">
            <TicketIcon className="w-4 h-4 text-indigo-500" />
            <span>Turnos</span>
          </div>
          <p className="mt-2 text-2xl font-black text-indigo-900">{totalTickets}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Generados</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/30 shadow-xs">
          <div className="flex items-center gap-2 text-amber-700 text-xs font-semibold uppercase">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>Pendientes</span>
          </div>
          <p className="mt-2 text-2xl font-black text-amber-900">{pendingTickets}</p>
          <p className="text-[11px] text-amber-600/80 mt-0.5">En cola de espera</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-blue-200 bg-blue-50/30 shadow-xs">
          <div className="flex items-center gap-2 text-blue-700 text-xs font-semibold uppercase">
            <Bell className="w-4 h-4 text-blue-500" />
            <span>Llamados</span>
          </div>
          <p className="mt-2 text-2xl font-black text-blue-900">{calledTickets}</p>
          <p className="text-[11px] text-blue-600/80 mt-0.5">Hacia módulo</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 shadow-xs">
          <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold uppercase">
            <UserCheck className="w-4 h-4 text-emerald-500" />
            <span>Atendiendo</span>
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-900">{inAttentionTickets}</p>
          <p className="text-[11px] text-emerald-600/80 mt-0.5">En box o consulta</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase">
            <CheckCircle2 className="w-4 h-4 text-slate-600" />
            <span>Atendidos</span>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-800">{completedTickets}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Finalizados</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/20 shadow-xs">
          <div className="flex items-center gap-2 text-rose-700 text-xs font-semibold uppercase">
            <UserX className="w-4 h-4 text-rose-500" />
            <span>Ausentes</span>
          </div>
          <p className="mt-2 text-2xl font-black text-rose-900">{absentTickets}</p>
          <p className="text-[11px] text-rose-600/80 mt-0.5">No presentados</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase">
            <XCircle className="w-4 h-4 text-slate-400" />
            <span>Cancelados</span>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-600">{canceledTickets}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Con motivo</p>
        </div>
      </div>

      {/* 8 Services Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Estado de los 8 Servicios Profesionales
            </h2>
            <p className="text-xs text-slate-500">
              Monitoreo de colas independientes, turnos actuales y profesionales asignados.
            </p>
          </div>
          <Link
            to="/admin/servicios"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition inline-flex items-center gap-1"
          >
            <span>Configurar servicios</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {services.map((srv) => {
            const srvTickets = tickets.filter((t) => t.service_id === srv.id);
            const pendingCount = srvTickets.filter((t) => t.status === 'PENDIENTE').length;
            const currentActive = srvTickets.find(
              (t) => t.status === 'LLAMADO' || t.status === 'EN_ATENCION'
            );
            const attendedCount = srvTickets.filter((t) => t.status === 'ATENDIDO').length;

            return (
              <div
                key={srv.id}
                className={`bg-white rounded-xl border p-5 transition hover:shadow-md flex flex-col justify-between ${
                  srv.active ? 'border-slate-200' : 'border-slate-200 bg-slate-50/50 opacity-60'
                }`}
              >
                <div>
                  {/* Service Code & Status */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-800 rounded-md">
                      {srv.code}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        srv.active ? 'text-emerald-600' : 'text-slate-400'
                      }`}
                    >
                      {srv.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>

                  {/* Service Name */}
                  <h3 className="font-bold text-slate-900 text-base mt-2">{srv.name}</h3>
                  <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                    {srv.description || 'Atención profesional comunitaria'}
                  </p>

                  {/* Active / Calling Ticket */}
                  <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-[10px] uppercase font-semibold text-slate-400">
                      Turno en atención / llamado:
                    </p>
                    {currentActive ? (
                      <div className="flex items-center justify-between mt-1">
                        <span className="font-mono text-lg font-black text-indigo-700">
                          {currentActive.ticket_code}
                        </span>
                        <StatusBadge status={currentActive.status} size="sm" />
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic mt-1">Ninguno en curso</p>
                    )}
                  </div>
                </div>

                {/* Queue Summary and Action */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="text-slate-600">
                    <span className="font-bold text-amber-700">{pendingCount}</span> en espera
                    <span className="text-slate-300 mx-1.5">·</span>
                    <span className="font-semibold text-slate-700">{attendedCount}</span> listos
                  </div>
                  <button
                    onClick={() => navigate(`/admin/turnos?service=${srv.id}`)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
                  >
                    Ver cola →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Recent Activity Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Últimos Turnos Gestionados</h2>
            <p className="text-xs text-slate-500">
              Monitoreo cronológico de los llamados y atenciones recientes.
            </p>
          </div>
          <Link
            to="/admin/turnos"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
          >
            Ver todos los turnos →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">Turno</th>
                <th className="px-4 py-3">Servicio</th>
                <th className="px-4 py-3">Persona</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Profesión</th>
                <th className="px-4 py-3">Hora Registro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {tickets.slice(0, 6).map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-4 py-3 font-mono font-bold text-indigo-900 text-sm">
                    {t.ticket_code}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {t.service?.name || 'Servicio'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-slate-900">
                      {t.person ? `${t.person.first_name} ${t.person.last_name}` : 'Asistente'}
                    </span>
                    {t.person?.rut && (
                      <span className="block text-[10px] text-slate-400 font-mono">
                        {t.person.rut}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={t.status} size="sm" />
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {t.assigned_professional?.full_name || 'Sin asignar'}
                  </td>
                  <td className="px-4 py-3 text-slate-400 font-mono">
                    {new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
              {tickets.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400 italic">
                    No hay turnos registrados en este operativo todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
