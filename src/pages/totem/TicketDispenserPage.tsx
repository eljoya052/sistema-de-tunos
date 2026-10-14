import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { repository } from '../../lib/repository';
import { useEvents } from '../../context/EventContext';
import { Service, Ticket } from '../../types/database';
import {
  Ticket as TicketIcon,
  CheckCircle2,
  Tv,
  Printer,
  Sparkles,
  Clock,
  ArrowRight
} from 'lucide-react';

export const TicketDispenserPage: React.FC<{ isEmbedded?: boolean }> = ({ isEmbedded = false }) => {
  const { activeEvent } = useEvents();
  const [services, setServices] = useState<Service[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [issuedTicket, setIssuedTicket] = useState<Ticket | null>(null);
  const [isDispensing, setIsDispensing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [srvs, tkts] = await Promise.all([
        repository.getServices(true),
        repository.getTickets(),
      ]);
      setServices(srvs);
      setTickets(tkts);
    } catch (e) {
      console.error('Error loading dispenser data:', e);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = repository.subscribeRealtime(() => {
      loadData();
    });
    return unsubscribe;
  }, []);

  const handleIssueTicket = async (service: Service) => {
    if (isDispensing) return;
    setErrorMessage(null);
    setIsDispensing(true);

    try {
      const t = await repository.issueTicketForService({
        service_id: service.id,
      });
      setIssuedTicket(t);
      await loadData();
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || 'Error al emitir turno');
    } finally {
      setIsDispensing(false);
    }
  };

  return (
    <div className={isEmbedded ? 'space-y-6' : 'min-h-screen bg-slate-100 flex flex-col p-4 sm:p-8'}>
      {/* Top Header if not embedded */}
      {!isEmbedded && (
        <header className="max-w-5xl mx-auto w-full flex items-center justify-between pb-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-extrabold text-lg shadow-sm">
              TS
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-tight">
                Dispensador de Turnos · Tótem de Atención
              </h1>
              <p className="text-xs text-slate-500">
                {activeEvent?.name || 'operativo social IBM 2026'} · Selecciona el servicio que requieres
              </p>
            </div>
          </div>

          <Link
            to="/pantalla"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs transition"
          >
            <Tv className="w-4 h-4 text-indigo-600" />
            <span>Ver Pantalla TV</span>
          </Link>
        </header>
      )}

      {/* Embedded Title */}
      {isEmbedded && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Dispensador Rápido de Turnos
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Emisión directa de turnos por servicio con numeración secuencial atómica (sin formulario de paciente).
            </p>
          </div>
          <Link
            to="/pantalla"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition"
          >
            <Tv className="w-4 h-4 text-indigo-600" />
            <span>Abrir Pantalla TV</span>
          </Link>
        </div>
      )}

      {/* Main Content */}
      <div className={isEmbedded ? 'space-y-6' : 'max-w-5xl mx-auto w-full my-auto py-8'}>
        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-xl mb-6">
            {errorMessage}
          </div>
        )}

        {/* Success Ticket Modal / Banner */}
        {issuedTicket && (
          <div className="mb-8 p-6 sm:p-8 bg-emerald-50 border-2 border-emerald-400 rounded-3xl shadow-xl text-center max-w-lg mx-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-md">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              ¡Turno emitido con éxito!
            </p>

            <div className="my-3 py-3 px-6 bg-white rounded-2xl border border-emerald-200 shadow-sm inline-block">
              <span className="font-mono text-6xl sm:text-7xl font-black text-slate-900 tracking-tight block">
                {issuedTicket.ticket_code}
              </span>
              <span className="text-sm font-extrabold text-indigo-700 uppercase block mt-1">
                {issuedTicket.service?.name}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 max-w-xs mx-auto leading-relaxed mt-2">
              Por favor toma asiento y espera a que tu número sea anunciado en la pantalla pública de llamados.
            </p>

            <button
              onClick={() => setIssuedTicket(null)}
              className="mt-5 w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-md transition"
            >
              Listo / Emitir Siguiente Turno
            </button>
          </div>
        )}

        {/* 8 Services Grid */}
        <div className="space-y-4">
          <div className="text-center sm:text-left">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Presiona el servicio para obtener tu número de atención:
            </h2>
            <p className="text-xs text-slate-500">
              Cada botón emite inmediatamente el turno correspondiente en la cola del profesional.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {services.map((srv) => {
              const pendingCount = tickets.filter(
                (t) => t.service_id === srv.id && t.status === 'PENDIENTE'
              ).length;

              return (
                <button
                  key={srv.id}
                  type="button"
                  onClick={() => handleIssueTicket(srv)}
                  disabled={isDispensing || !srv.active}
                  className="bg-white hover:bg-indigo-50/60 border-2 border-slate-200 hover:border-indigo-500 rounded-2xl p-5 text-left transition transform active:scale-98 shadow-sm flex flex-col justify-between group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-xs font-black px-2.5 py-1 bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white text-slate-800 rounded-lg transition">
                        {srv.code}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        <Clock className="w-3 h-3" />
                        <span>{pendingCount} en espera</span>
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-slate-900 group-hover:text-indigo-900 leading-snug">
                      {srv.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {srv.description || 'Atención en operativo social'}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-600 group-hover:text-indigo-800">
                      Obtener Turno →
                    </span>
                    <TicketIcon className="w-4 h-4 text-indigo-400 group-hover:text-indigo-600" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
