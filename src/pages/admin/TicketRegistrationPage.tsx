import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { repository } from '../../lib/repository';
import { useAuth } from '../../context/AuthContext';
import { useEvents } from '../../context/EventContext';
import { Service, Person, Ticket } from '../../types/database';
import {
  UserPlus,
  CheckCircle2,
  AlertTriangle,
  Search,
  Sparkles,
  Ticket as TicketIcon,
  ShieldCheck,
  Check
} from 'lucide-react';

export const TicketRegistrationPage: React.FC = () => {
  const { user } = useAuth();
  const { activeEvent } = useEvents();
  const navigate = useNavigate();

  const [services, setServices] = useState<Service[]>([]);
  const [existingPeople, setExistingPeople] = useState<Person[]>([]);

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [rut, setRut] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  // Duplicate detection state
  const [duplicateWarning, setDuplicateWarning] = useState<Person | null>(null);
  const [reusingExistingPersonId, setReusingExistingPersonId] = useState<string | null>(null);

  // Submission result
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdResult, setCreatedResult] = useState<{ person: Person; tickets: Ticket[] } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const [srvs, ppl] = await Promise.all([
        repository.getServices(true),
        repository.getPeople(),
      ]);
      setServices(srvs);
      setExistingPeople(ppl);
    };
    loadData();
  }, []);

  // Check duplicate candidates whenever RUT or Names change
  useEffect(() => {
    if (reusingExistingPersonId) return;

    const trimmedRut = rut.trim().toLowerCase();
    const trimmedFirst = firstName.trim().toLowerCase();
    const trimmedLast = lastName.trim().toLowerCase();

    if (trimmedRut.length >= 7) {
      const matchRut = existingPeople.find(
        (p) => p.rut && p.rut.trim().toLowerCase() === trimmedRut
      );
      if (matchRut) {
        setDuplicateWarning(matchRut);
        return;
      }
    }

    if (trimmedFirst.length >= 3 && trimmedLast.length >= 3) {
      const matchName = existingPeople.find(
        (p) =>
          p.first_name.trim().toLowerCase() === trimmedFirst &&
          p.last_name.trim().toLowerCase() === trimmedLast
      );
      if (matchName) {
        setDuplicateWarning(matchName);
        return;
      }
    }

    setDuplicateWarning(null);
  }, [rut, firstName, lastName, existingPeople, reusingExistingPersonId]);

  const toggleService = (id: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllServices = () => {
    if (selectedServiceIds.length === services.length) {
      setSelectedServiceIds([]);
    } else {
      setSelectedServiceIds(services.map((s) => s.id));
    }
  };

  const handleUseExistingPerson = (p: Person) => {
    setFirstName(p.first_name);
    setLastName(p.last_name);
    setRut(p.rut || '');
    setPhone(p.phone || '');
    setReusingExistingPersonId(p.id);
    setDuplicateWarning(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!activeEvent) {
      setErrorMessage('No hay un operativo activo seleccionado.');
      return;
    }
    if (activeEvent.status === 'FINALIZADO') {
      setErrorMessage('El operativo activo se encuentra cerrado. Seleccione o cree uno activo.');
      return;
    }
    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage('El nombre y el apellido son obligatorios.');
      return;
    }
    if (selectedServiceIds.length === 0) {
      setErrorMessage('Debe seleccionar al menos un servicio para asignar turno.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await repository.createPersonWithTickets({
        first_name: firstName,
        last_name: lastName,
        rut: rut || undefined,
        phone: phone || undefined,
        service_ids: selectedServiceIds,
        actor_id: user?.id || 'admin',
        actor_name: user?.full_name || 'Administrador',
        notes: notes || undefined,
      });

      setCreatedResult(result);
      // Reset form
      setFirstName('');
      setLastName('');
      setRut('');
      setPhone('');
      setNotes('');
      setSelectedServiceIds([]);
      setReusingExistingPersonId(null);
      setDuplicateWarning(null);

      // Refresh existing people list
      const freshPeople = await repository.getPeople();
      setExistingPeople(freshPeople);
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || 'Error al generar turnos');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Registro de Personas y Emisión de Turnos
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Inscribe a un asistente y asígnale uno o varios servicios simultáneos con secuencias numéricas independientes.
        </p>
      </div>

      {/* Confirmation of recently created tickets */}
      {createdResult && (
        <div className="p-6 bg-emerald-50 border-2 border-emerald-300 rounded-2xl shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600 text-white rounded-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-emerald-950">
                ¡Turnos asignados exitosamente!
              </h3>
              <p className="text-xs text-emerald-800">
                Asistente: {createdResult.person.first_name} {createdResult.person.last_name}
                {createdResult.person.rut && ` · RUT: ${createdResult.person.rut}`}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {createdResult.tickets.map((t) => (
              <div
                key={t.id}
                className="bg-white border border-emerald-200 rounded-xl p-3 text-center shadow-xs"
              >
                <span className="font-mono text-2xl font-black text-emerald-900 block">
                  {t.ticket_code}
                </span>
                <span className="text-xs font-semibold text-emerald-700 block truncate mt-1">
                  {t.service?.name}
                </span>
                <span className="text-[10px] text-emerald-600 block">
                  Secuencia #{t.ticket_number}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-end gap-3">
            <button
              onClick={() => setCreatedResult(null)}
              className="px-4 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 rounded-lg transition"
            >
              Registrar otra persona
            </button>
            <button
              onClick={() => navigate('/admin/turnos')}
              className="px-4 py-2 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg shadow-xs transition"
            >
              Ver en gestión de turnos →
            </button>
          </div>
        </div>
      )}

      {/* Error notification */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-sm text-rose-800">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Personal Data */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <UserPlus className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">
              1. Datos del Asistente
            </h2>
          </div>

          {/* Duplicate candidate warning */}
          {duplicateWarning && !reusingExistingPersonId && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Posible duplicado detectado en el operativo:</p>
                  <p>
                    Existe un registro para <strong>{duplicateWarning.first_name} {duplicateWarning.last_name}</strong>
                    {duplicateWarning.rut && ` (RUT: ${duplicateWarning.rut})`}.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleUseExistingPerson(duplicateWarning)}
                  className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white font-semibold rounded-lg transition"
                >
                  Asignar a esta persona
                </button>
                <button
                  type="button"
                  onClick={() => setDuplicateWarning(null)}
                  className="px-2.5 py-1.5 text-amber-800 hover:bg-amber-100 rounded-lg"
                >
                  Continuar como nueva
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Nombre <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ej. María"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Apellido <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ej. González"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                RUT (Opcional)
              </label>
              <input
                type="text"
                placeholder="12.345.678-9"
                value={rut}
                onChange={(e) => setRut(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-hidden font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Teléfono de Contacto (Opcional)
              </label>
              <input
                type="tel"
                placeholder="+56 9 1234 5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Observaciones Administrativas Generales (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ej. Asiste en silla de ruedas, prioridad adulto mayor (no incluir datos clínicos sensibles)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-hidden"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Privacidad estricta: No registre diagnósticos médicos ni antecedentes legales.
            </p>
          </div>
        </div>

        {/* Step 2: Multi-Service Selection */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <TicketIcon className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">
                2. Selección de Servicios a Asignar
              </h2>
            </div>
            <button
              type="button"
              onClick={handleSelectAllServices}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              {selectedServiceIds.length === services.length
                ? 'Desmarcar todos'
                : 'Seleccionar todos los 8 servicios'}
            </button>
          </div>

          <p className="text-xs text-slate-500">
            Cada servicio seleccionado creará un turno independiente con su respectiva cola y prefijo (ej. FON-001, PSI-001):
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {services.map((srv) => {
              const isSelected = selectedServiceIds.includes(srv.id);
              return (
                <button
                  type="button"
                  key={srv.id}
                  onClick={() => toggleService(srv.id)}
                  className={`p-4 rounded-xl border text-left transition relative flex flex-col justify-between ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span
                      className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {srv.code}
                    </span>
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>

                  <div className="mt-3">
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">
                      {srv.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {srv.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600 flex items-center justify-between">
            <span>
              Servicios seleccionados: <strong>{selectedServiceIds.length}</strong> de {services.length}
            </span>
            {selectedServiceIds.length > 0 && (
              <span className="text-indigo-600 font-semibold">
                Se generarán {selectedServiceIds.length} turnos simultáneos
              </span>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting || selectedServiceIds.length === 0}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {isSubmitting
                ? 'Generando turnos con secuencia única...'
                : `Registrar y Emitir ${selectedServiceIds.length} Turno(s)`}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};
