import React, { useState, useEffect } from 'react';
import { repository } from '../../lib/repository';
import { Service, Ticket, Profile } from '../../types/database';
import { Stethoscope, CheckCircle, XCircle, Users, Ticket as TicketIcon, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ServicesManagementPage: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      const [srvs, tkts, profs] = await Promise.all([
        repository.getServices(),
        repository.getTickets(),
        repository.getProfiles(),
      ]);
      setServices(srvs);
      setTickets(tkts);
      setProfiles(profs);
    } catch (e) {
      console.error('Error loading services:', e);
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

  const handleToggleActive = async (service: Service) => {
    const action = service.active ? 'desactivar' : 'activar';
    if (
      window.confirm(
        `¿Confirmas que deseas ${action} el servicio de ${service.name}? ${
          service.active ? 'No se podrán emitir nuevos turnos mientras esté inactivo.' : ''
        }`
      )
    ) {
      await repository.toggleService(service.id, !service.active);
      await loadData();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Servicios del Operativo Social
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Configuración y estado de los ocho servicios obligatorios con sus códigos de prefijo único.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((srv) => {
          const srvTickets = tickets.filter((t) => t.service_id === srv.id);
          const pending = srvTickets.filter((t) => t.status === 'PENDIENTE').length;
          const attending = srvTickets.filter((t) => t.status === 'EN_ATENCION' || t.status === 'LLAMADO').length;
          const completed = srvTickets.filter((t) => t.status === 'ATENDIDO').length;
          const absent = srvTickets.filter((t) => t.status === 'AUSENTE').length;

          return (
            <div
              key={srv.id}
              className={`bg-white rounded-xl border p-5 transition flex flex-col justify-between ${
                srv.active ? 'border-slate-200 shadow-xs' : 'border-slate-200 bg-slate-50/70 opacity-70'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-sm font-black px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg">
                      {srv.code}
                    </span>
                    <h3 className="text-base font-bold text-slate-900">{srv.name}</h3>
                  </div>

                  <button
                    onClick={() => handleToggleActive(srv)}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-md border transition ${
                      srv.active
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                        : 'border-slate-300 bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {srv.active ? 'Activo' : 'Inactivo'}
                  </button>
                </div>

                <p className="text-xs text-slate-500 mt-2">
                  {srv.description || 'Atención profesional comunitaria'}
                </p>

                {/* Service Stats Bar */}
                <div className="grid grid-cols-4 gap-2 mt-4 p-3 bg-slate-50 rounded-lg text-center text-xs">
                  <div>
                    <span className="block font-black text-amber-800 text-base">{pending}</span>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">En Cola</span>
                  </div>
                  <div>
                    <span className="block font-black text-blue-800 text-base">{attending}</span>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Atendiendo</span>
                  </div>
                  <div>
                    <span className="block font-black text-emerald-800 text-base">{completed}</span>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Atendidos</span>
                  </div>
                  <div>
                    <span className="block font-black text-rose-800 text-base">{absent}</span>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Ausentes</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  Total acumulado: <strong>{srvTickets.length}</strong> turnos
                </span>
                <Link
                  to={`/admin/turnos?service=${srv.id}`}
                  className="font-semibold text-indigo-600 hover:text-indigo-800 transition"
                >
                  Gestionar cola de {srv.code} →
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
