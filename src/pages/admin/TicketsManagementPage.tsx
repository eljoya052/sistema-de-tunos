import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { repository } from '../../lib/repository';
import { useAuth } from '../../context/AuthContext';
import { useEvents } from '../../context/EventContext';
import { Ticket, Service, Profile, TicketStatus, TicketEvent } from '../../types/database';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import {
  Search,
  Filter,
  XCircle,
  RotateCcw,
  Edit,
  History,
  ChevronLeft,
  ChevronRight,
  Eye,
  Check,
  X,
  FileText
} from 'lucide-react';

export const TicketsManagementPage: React.FC = () => {
  const { user } = useAuth();
  const { activeEvent, events } = useEvents();
  const [searchParams, setSearchParams] = useSearchParams();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    searchParams.get('service') || 'ALL'
  );
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>('ALL');
  const [selectedEventId, setSelectedEventId] = useState<string>(activeEvent?.id || 'ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals
  const [cancelModalTicket, setCancelModalTicket] = useState<Ticket | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [reopenModalTicket, setReopenModalTicket] = useState<Ticket | null>(null);
  const [reopenReason, setReopenReason] = useState('');

  // Edit Person modal
  const [editTicket, setEditTicket] = useState<Ticket | null>(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editRut, setEditRut] = useState('');
  const [editPhone, setEditPhone] = useState('');

  // Ticket history modal
  const [historyTicket, setHistoryTicket] = useState<Ticket | null>(null);
  const [historyEvents, setHistoryEvents] = useState<TicketEvent[]>([]);

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
      console.error('Error loading tickets:', e);
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
  }, [selectedEventId]);

  // Keep filter in sync with URL
  useEffect(() => {
    const srvParam = searchParams.get('service');
    if (srvParam) {
      setSelectedServiceId(srvParam);
    }
  }, [searchParams]);

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (selectedServiceId !== 'ALL' && t.service_id !== selectedServiceId) return false;
      if (selectedStatus !== 'ALL' && t.status !== selectedStatus) return false;
      if (
        selectedProfessionalId !== 'ALL' &&
        t.assigned_professional_id !== selectedProfessionalId
      ) {
        return false;
      }

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const codeMatch = t.ticket_code.toLowerCase().includes(query);
        const nameMatch =
          t.person &&
          `${t.person.first_name} ${t.person.last_name}`.toLowerCase().includes(query);
        const rutMatch = t.person?.rut && t.person.rut.toLowerCase().includes(query);
        return codeMatch || nameMatch || rutMatch;
      }

      return true;
    });
  }, [tickets, selectedServiceId, selectedStatus, selectedProfessionalId, searchTerm]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage) || 1;
  const paginatedTickets = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTickets.slice(start, start + itemsPerPage);
  }, [filteredTickets, currentPage]);

  const handleCancelConfirm = async () => {
    if (!cancelModalTicket || !cancelReason.trim()) return;
    try {
      await repository.cancelTicket({
        ticket_id: cancelModalTicket.id,
        actor_id: user?.id || 'admin',
        actor_name: user?.full_name || 'Administrador',
        reason: cancelReason,
      });
      setCancelModalTicket(null);
      setCancelReason('');
      await loadData();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleReopenConfirm = async () => {
    if (!reopenModalTicket || !reopenReason.trim()) return;
    try {
      await repository.reopenTicket({
        ticket_id: reopenModalTicket.id,
        actor_id: user?.id || 'admin',
        actor_name: user?.full_name || 'Administrador',
        reason: reopenReason,
      });
      setReopenModalTicket(null);
      setReopenReason('');
      await loadData();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const openEditModal = (t: Ticket) => {
    if (!t.person) return;
    setEditTicket(t);
    setEditFirstName(t.person.first_name);
    setEditLastName(t.person.last_name);
    setEditRut(t.person.rut || '');
    setEditPhone(t.person.phone || '');
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTicket || !editTicket.person) return;
    try {
      await repository.updatePerson({
        person_id: editTicket.person.id,
        first_name: editFirstName,
        last_name: editLastName,
        rut: editRut || undefined,
        phone: editPhone || undefined,
        actor_id: user?.id || 'admin',
        actor_name: user?.full_name || 'Administrador',
      });
      setEditTicket(null);
      await loadData();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const openHistoryModal = async (t: Ticket) => {
    setHistoryTicket(t);
    const events = await repository.getTicketEvents(t.id);
    setHistoryEvents(events);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Gestión Centralizada de Turnos
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Supervisa, busca, filtra, audita, cancela y reabre turnos con trazabilidad completa.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              if (window.confirm('¿Confirmas que deseas poner todos los turnos y contadores en cero?')) {
                await repository.resetAllTicketsToZero();
                await loadData();
              }
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs sm:text-sm font-semibold rounded-lg transition cursor-pointer"
            title="Poner todos los turnos y contadores en cero"
          >
            <RotateCcw className="w-4 h-4 text-rose-600" />
            <span>Turnos a Cero</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search by text */}
          <div className="relative lg:col-span-2">
            <input
              type="text"
              placeholder="Buscar por código (ej. PSI-001), nombre o RUT..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs sm:text-sm rounded-lg border border-slate-300 pl-9 pr-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-hidden"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          {/* Service filter */}
          <div>
            <select
              value={selectedServiceId}
              onChange={(e) => {
                setSelectedServiceId(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs sm:text-sm rounded-lg border border-slate-300 p-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            >
              <option value="ALL">Todos los servicios ({services.length})</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} - {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs sm:text-sm rounded-lg border border-slate-300 p-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            >
              <option value="ALL">Todos los estados</option>
              <option value="PENDIENTE">PENDIENTE</option>
              <option value="LLAMADO">LLAMADO</option>
              <option value="EN_ATENCION">EN ATENCIÓN</option>
              <option value="ATENDIDO">ATENDIDO</option>
              <option value="AUSENTE">AUSENTE</option>
              <option value="CANCELADO">CANCELADO</option>
            </select>
          </div>

          {/* Professional filter */}
          <div>
            <select
              value={selectedProfessionalId}
              onChange={(e) => {
                setSelectedProfessionalId(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs sm:text-sm rounded-lg border border-slate-300 p-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            >
              <option value="ALL">Cualquier profesión / puesto</option>
              {profiles
                .filter((p) => p.role === 'PROFESSIONAL')
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Results counter & active filters clear */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <span>
            Mostrando <strong>{filteredTickets.length}</strong> turno(s) encontrado(s)
          </span>
          {(searchTerm ||
            selectedServiceId !== 'ALL' ||
            selectedStatus !== 'ALL' ||
            selectedProfessionalId !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedServiceId('ALL');
                setSelectedStatus('ALL');
                setSelectedProfessionalId('ALL');
              }}
              className="text-indigo-600 hover:underline font-semibold"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Servicio</th>
                <th className="px-4 py-3">Persona / RUT</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Profesión / Puesto</th>
                <th className="px-4 py-3">Horas clave</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedTickets.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50 transition">
                  {/* Code */}
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm font-black text-indigo-950 block">
                      {t.ticket_code}
                    </span>
                    <span className="text-[10px] text-slate-400">#{t.ticket_number}</span>
                  </td>

                  {/* Service */}
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {t.service?.name || 'Servicio'}
                    {t.desk_info && (
                      <span className="block text-[10px] text-slate-400 font-normal">
                        {t.desk_info}
                      </span>
                    )}
                  </td>

                  {/* Person */}
                  <td className="px-4 py-3">
                    <span className="font-medium text-slate-900">
                      {t.person ? `${t.person.first_name} ${t.person.last_name}` : 'Sin datos'}
                    </span>
                    {t.person?.rut && (
                      <span className="block text-[10px] text-slate-400 font-mono">
                        {t.person.rut}
                      </span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <StatusBadge status={t.status} size="sm" />
                    {t.cancellation_reason && (
                      <span
                        className="block text-[10px] text-rose-600 truncate max-w-[140px] mt-0.5"
                        title={t.cancellation_reason}
                      >
                        Motivo: {t.cancellation_reason}
                      </span>
                    )}
                  </td>

                  {/* Professional */}
                  <td className="px-4 py-3 text-slate-600">
                    {t.assigned_professional?.full_name || (
                      <span className="text-slate-400 italic">No asignado</span>
                    )}
                  </td>

                  {/* Timestamps */}
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                    <div>Reg: {new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    {t.called_at && (
                      <div className="text-blue-600">
                        Llam: {new Date(t.called_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                    {t.completed_at && (
                      <div className="text-emerald-600">
                        Fin: {new Date(t.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </td>

                  {/* Action buttons */}
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      {/* View history */}
                      <button
                        onClick={() => openHistoryModal(t)}
                        title="Ver historial de auditoría del turno"
                        className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-md transition"
                      >
                        <History className="w-4 h-4" />
                      </button>

                      {/* Edit Person Data */}
                      <button
                        onClick={() => openEditModal(t)}
                        title="Editar datos de registro de la persona"
                        className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-md transition"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      {/* Cancel Ticket (if not attended or canceled) */}
                      {t.status !== 'ATENDIDO' && t.status !== 'CANCELADO' && (
                        <button
                          onClick={() => setCancelModalTicket(t)}
                          title="Cancelar turno con motivo obligatorio"
                          className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-md transition"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}

                      {/* Reopen Ticket (if absent or canceled) */}
                      {(t.status === 'AUSENTE' || t.status === 'CANCELADO') && (
                        <button
                          onClick={() => setReopenModalTicket(t)}
                          title="Reabrir / recuperar turno a la cola pendiente"
                          className="p-1.5 hover:bg-amber-50 text-amber-600 rounded-md transition"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {paginatedTickets.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    No se encontraron turnos con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>
              Página {currentPage} de {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Cancel Ticket Modal */}
      <ConfirmModal
        isOpen={cancelModalTicket !== null}
        title={`Cancelar Turno ${cancelModalTicket?.ticket_code}`}
        description="Esta acción cancelará el turno. Debe ingresar un motivo claro para el registro de auditoría."
        confirmText="Confirmar Cancelación"
        variant="danger"
        requireInput={true}
        inputLabel="Motivo de Cancelación (Obligatorio)"
        inputPlaceholder="Ej. Usuario se retiró del recinto, error en servicio..."
        inputValue={cancelReason}
        onInputChange={setCancelReason}
        onConfirm={handleCancelConfirm}
        onClose={() => {
          setCancelModalTicket(null);
          setCancelReason('');
        }}
      />

      {/* Reopen Ticket Modal */}
      <ConfirmModal
        isOpen={reopenModalTicket !== null}
        title={`Reabrir Turno ${reopenModalTicket?.ticket_code}`}
        description="El turno volverá al estado PENDIENTE en la cola del servicio para ser llamado por el profesional."
        confirmText="Reabrir Turno"
        variant="warning"
        requireInput={true}
        inputLabel="Motivo de Reapertura (Obligatorio)"
        inputPlaceholder="Ej. Asistente regresó de otro box, justificación administrativa..."
        inputValue={reopenReason}
        onInputChange={setReopenReason}
        onConfirm={handleReopenConfirm}
        onClose={() => {
          setReopenModalTicket(null);
          setReopenReason('');
        }}
      />

      {/* Edit Person Modal */}
      {editTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Editar Datos de Registro ({editTicket.ticket_code})
              </h3>
              <button
                onClick={() => setEditTicket(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSave} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  required
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Apellido
                </label>
                <input
                  type="text"
                  required
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  RUT
                </label>
                <input
                  type="text"
                  value={editRut}
                  onChange={(e) => setEditRut(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditTicket(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-xs"
                >
                  Guardar Cambios con Trazabilidad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ticket History Modal */}
      {historyTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Línea de Tiempo del Turno {historyTicket.ticket_code}
                </h3>
              </div>
              <button
                onClick={() => setHistoryTicket(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {historyEvents.length > 0 ? (
                <div className="relative border-l-2 border-slate-200 ml-3 space-y-5">
                  {historyEvents.map((ev) => (
                    <div key={ev.id} className="relative pl-6">
                      <span className="absolute -left-1.5 top-1 w-3 h-3 rounded-full bg-indigo-600 border-2 border-white" />
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">
                          {ev.event_type}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(ev.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-1">{ev.details || 'Evento registrado'}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Actor: <strong>{ev.actor_name || 'Sistema'}</strong>
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-center italic py-4">
                  No hay eventos registrados para este turno.
                </p>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 text-right">
              <button
                onClick={() => setHistoryTicket(null)}
                className="px-4 py-2 text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
