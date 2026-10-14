import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useEvents } from '../../context/EventContext';
import { repository } from '../../lib/repository';
import { Ticket, Service, PublicCall } from '../../types/database';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { soundManager } from '../../lib/audio';
import {
  Bell,
  Volume2,
  CheckCircle,
  UserX,
  Clock,
  Radio,
  LogOut,
  AlertCircle,
  Tv,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Sparkles
} from 'lucide-react';

export const ProfessionalDashboard: React.FC = () => {
  const { user, assignedServices, activeService, setActiveService, deskNumber, setDeskNumber, logout } = useAuth();
  const { activeEvent } = useEvents();
  const navigate = useNavigate();

  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null);
  const [historyList, setHistoryList] = useState<Ticket[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Live Public Screen monitor data
  const [latestPublicCalls, setLatestPublicCalls] = useState<PublicCall[]>([]);
  const [screenPulsing, setScreenPulsing] = useState(false);

  // Absent modal
  const [showAbsentModal, setShowAbsentModal] = useState(false);
  const [absentReason, setAbsentReason] = useState('');

  // Sound enabled
  const [soundEnabled, setSoundEnabled] = useState(soundManager.isEnabled());
  const [allServices, setAllServices] = useState<Service[]>([]);

  // Load workstation tickets and public calls
  const loadWorkstationData = async () => {
    if (!activeService) return;
    try {
      const [tickets, publicCalls] = await Promise.all([
        repository.getTickets({
          eventId: activeEvent?.id,
          serviceId: activeService.id,
        }),
        repository.getPublicCalls(),
      ]);

      setLatestPublicCalls(publicCalls);

      // Find if this profession currently has an active ticket in LLAMADO or EN_ATENCION
      const myActive = tickets.find(
        (t) =>
          (t.assigned_professional_id === user?.id || t.service_id === activeService.id) &&
          (t.status === 'LLAMADO' || t.status === 'EN_ATENCION')
      );
      setCurrentTicket(myActive || null);

      // Service history for this session
      const history = tickets
        .filter((t) => t.status === 'ATENDIDO' || t.status === 'AUSENTE' || t.status === 'LLAMADO')
        .slice(-8)
        .reverse();
      setHistoryList(history);
    } catch (e) {
      console.error('Error loading professional tickets:', e);
    }
  };

  useEffect(() => {
    repository.getServices(true).then((srvs) => {
      setAllServices(srvs);
      if (!activeService && srvs.length > 0) {
        setActiveService(srvs[0]);
      }
    });

    loadWorkstationData();
    const unsubscribe = repository.subscribeRealtime(() => {
      loadWorkstationData();
    });

    const handleCustomCall = () => {
      loadWorkstationData();
    };
    window.addEventListener('turno_social_call', handleCustomCall);

    const handleStorage = (e: StorageEvent) => {
      if (e.key?.startsWith('turno_social')) {
        loadWorkstationData();
      }
    };
    window.addEventListener('storage', handleStorage);

    const interval = setInterval(() => {
      loadWorkstationData();
    }, 1000);

    return () => {
      unsubscribe();
      window.removeEventListener('turno_social_call', handleCustomCall);
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, [activeService?.id, activeEvent?.id, user?.id]);

  // 1. LLAMAR AL SIGUIENTE NÚMERO (Does not require patient registration)
  const handleCallNext = async () => {
    if (!user || !activeService || isProcessing) return;
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsProcessing(true);

    try {
      const ticket = await repository.callNextNumber({
        service_id: activeService.id,
        professional_id: user.id,
        desk_info: deskNumber,
      });

      setCurrentTicket(ticket);
      setSuccessMessage(`Turno ${ticket.ticket_code} llamado con éxito. Transmitido en tiempo real a la pantalla pública.`);
      
      // Trigger screen pulse in mini monitor
      setScreenPulsing(true);
      setTimeout(() => setScreenPulsing(false), 4000);

      if (soundManager.isEnabled()) {
        soundManager.playChime();
      }
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || 'Error al llamar siguiente turno');
    } finally {
      setIsProcessing(false);
      await loadWorkstationData();
    }
  };

  // 2. VOLVER A LLAMAR
  const handleRecall = async () => {
    if (!currentTicket || !user || isProcessing) return;
    setErrorMessage(null);
    setIsProcessing(true);

    try {
      const updated = await repository.recallTicket({
        ticket_id: currentTicket.id,
        professional_id: user.id,
        desk_info: deskNumber,
      });
      setCurrentTicket(updated);
      setSuccessMessage(`Turno ${updated.ticket_code} re-anunciado en pantalla con campanilla sonora.`);
      
      // Trigger screen pulse in mini monitor
      setScreenPulsing(true);
      setTimeout(() => setScreenPulsing(false), 4000);

      if (soundManager.isEnabled()) {
        soundManager.playChime();
      }
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || 'Error al re-llamar');
    } finally {
      setIsProcessing(false);
      await loadWorkstationData();
    }
  };


  // 4. FINALIZAR ATENCIÓN
  const handleCompleteAttention = async () => {
    if (!currentTicket || !user || isProcessing) return;
    setErrorMessage(null);
    setIsProcessing(true);

    try {
      await repository.completeAttention({
        ticket_id: currentTicket.id,
        professional_id: user.id,
      });
      setSuccessMessage(`Atención del turno ${currentTicket.ticket_code} finalizada.`);
      setCurrentTicket(null);
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || 'Error al finalizar atención');
    } finally {
      setIsProcessing(false);
      await loadWorkstationData();
    }
  };

  // 5. MARCAR AUSENTE
  const handleConfirmAbsent = async () => {
    if (!currentTicket || !user || isProcessing) return;
    setIsProcessing(true);

    try {
      await repository.markAbsent({
        ticket_id: currentTicket.id,
        professional_id: user.id,
        reason: absentReason,
      });
      setShowAbsentModal(false);
      setAbsentReason('');
      setCurrentTicket(null);
      setSuccessMessage('El número ha sido registrado como ausente.');
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || 'Error al marcar ausencia');
    } finally {
      setIsProcessing(false);
      await loadWorkstationData();
    }
  };

  const handleToggleSound = () => {
    const enabled = soundManager.enableAudio();
    if (enabled) {
      soundManager.playChime();
      setSoundEnabled(true);
    } else {
      setSoundEnabled(false);
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  const professionTitle = activeService ? activeService.name : 'Profesión';
  const topScreenCall = latestPublicCalls[0] || null;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Station Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Profession identity (NO personal name, ONLY profession) */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-white text-base shadow-sm">
              {activeService ? activeService.code : 'PRO'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h1 className="text-base sm:text-lg font-black text-white leading-tight uppercase tracking-tight">
                  {professionTitle}
                </h1>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Puesto de Atención: <strong className="text-white">{deskNumber}</strong>
              </p>
            </div>
          </div>

          {/* Service Switcher & Controls */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Profession / Service selector */}
            <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-xs">
              <span className="text-slate-400 font-medium">Profesión:</span>
              <select
                value={activeService?.id || ''}
                onChange={(e) => {
                  const pool = allServices.length > 0 ? allServices : assignedServices;
                  const found = pool.find((s) => s.id === e.target.value);
                  if (found) {
                    setActiveService(found);
                    if (found.code === 'ENF') setDeskNumber('Box 2');
                    else if (found.code === 'PSI') setDeskNumber('Box 1');
                    else if (found.code === 'FON') setDeskNumber('Box 3');
                    else if (found.code === 'KIN') setDeskNumber('Box 4');
                    else if (found.code === 'ASO') setDeskNumber('Módulo A');
                    else if (found.code === 'JUR') setDeskNumber('Módulo B');
                    else if (found.code === 'VET') setDeskNumber('Área Canina');
                    else if (found.code === 'BAR') setDeskNumber('Sillón 1');
                  }
                }}
                className="bg-transparent font-bold text-white outline-hidden cursor-pointer"
              >
                {(allServices.length > 0 ? allServices : assignedServices).map((s) => (
                  <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                    {s.code} - {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Desk / Box configuration */}
            <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 px-2.5 py-1.5 rounded-lg text-xs">
              <span className="text-slate-400">Puesto:</span>
              <input
                type="text"
                value={deskNumber}
                onChange={(e) => setDeskNumber(e.target.value)}
                placeholder="Box 1"
                title="Puesto visible en pantalla pública"
                className="bg-transparent text-white w-20 text-center font-bold outline-hidden focus:text-indigo-400"
              />
            </div>

            {/* Sound Toggle */}
            <button
              onClick={handleToggleSound}
              className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition ${
                soundEnabled
                  ? 'border-emerald-600 bg-emerald-950/80 text-emerald-400'
                  : 'border-slate-700 bg-slate-800 text-slate-300'
              }`}
              title="Activar o probar sonido de campanilla"
            >
              <Volume2 className="w-4 h-4" />
              <span className="hidden md:inline">{soundEnabled ? 'Sonido OK' : 'Sonido'}</span>
            </button>

            {/* Open Standalone Public Screen */}
            <Link
              to="/pantalla"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-indigo-700/60 bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 text-xs font-bold transition"
              title="Ver Pantalla Pública TV oficial de llamados"
            >
              <Tv className="w-4 h-4 text-indigo-400" />
              <span>Ver Pantalla TV</span>
            </Link>

            {/* Logout */}
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="p-2 rounded-lg border border-rose-900/50 bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 transition"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Workstation Container */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-1 space-y-6">
        {/* Alerts */}
        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-sm text-rose-800 animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-500 hover:text-rose-700 font-bold text-xs"
            >
              Descartar
            </button>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs font-semibold text-emerald-800 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-600 hover:text-emerald-800 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Top Grid: Workstation Controls + Live Public Screen Monitor */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Workstation Controls (8 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border-2 border-slate-200 shadow-md p-6 sm:p-8 text-center relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black px-2 py-0.5 bg-indigo-100 text-indigo-900 rounded">
                  {activeService?.code || 'SRV'}
                </span>
                <span className="text-xs font-bold text-slate-800 uppercase">
                  {professionTitle} · {deskNumber}
                </span>
              </div>

              {currentTicket ? (
                <StatusBadge status={currentTicket.status} size="md" />
              ) : (
                <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  Listo para Llamar
                </span>
              )}
            </div>

            {/* Ticket hero display */}
            {currentTicket ? (
              <div className="py-6 space-y-3">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400 block">
                  Número Actual en Llamado
                </span>
                <div className="font-mono font-black text-6xl sm:text-8xl text-indigo-950 tracking-tight leading-none drop-shadow-xs">
                  {currentTicket.ticket_code}
                </div>

                <div className="text-sm font-bold text-indigo-700 uppercase tracking-wide">
                  {professionTitle}
                </div>

                {currentTicket.called_at && (
                  <p className="text-xs text-blue-600 font-medium">
                    Llamado emitido a las{' '}
                    {new Date(currentTicket.called_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </p>
                )}
              </div>
            ) : (
              <div className="py-10 space-y-2">
                <span className="font-mono text-5xl font-black text-slate-300 block">
                  ---
                </span>
                <p className="text-base font-extrabold text-slate-800">
                  Puesto Listo para Llamar
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Presiona el botón <strong className="text-indigo-600">"LLAMAR AL SIGUIENTE NÚMERO"</strong>. No se requiere agregar usuarios ni datos personales. El número se llamará en secuencia e impactará en tiempo real la pantalla pública.
                </p>
              </div>
            )}

            {/* Primary Action Buttons Bar */}
            <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-center gap-3">
              {/* PRIMARY CALL NEXT BUTTON (Always available and enabled!) */}
              <button
                type="button"
                onClick={handleCallNext}
                disabled={isProcessing}
                className="w-full sm:w-auto px-7 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm sm:text-base rounded-xl shadow-lg shadow-indigo-600/30 transition transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <Bell className="w-5 h-5 animate-pulse" />
                <span>
                  {isProcessing
                    ? 'Llamando...'
                    : currentTicket
                    ? 'LLAMAR SIGUIENTE NÚMERO'
                    : 'LLAMAR AL SIGUIENTE NÚMERO'}
                </span>
              </button>

              {currentTicket && (
                <>
                  <button
                    type="button"
                    onClick={handleRecall}
                    disabled={isProcessing}
                    className="px-5 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
                    title="Repetir llamado con campanilla en pantalla"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>VOLVER A LLAMAR</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCompleteAttention}
                    disabled={isProcessing}
                    className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
                    title="Finalizar atención del turno actual"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>FINALIZAR ATENCIÓN</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowAbsentModal(true)}
                    disabled={isProcessing}
                    className="px-4 py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-sm rounded-xl transition flex items-center gap-2 cursor-pointer"
                  >
                    <UserX className="w-4 h-4" />
                    <span>MARCAR AUSENTE</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Right Column: Live TV Monitor Preview (5 cols) */}
          <div className="lg:col-span-5 bg-slate-950 text-white rounded-2xl border-2 border-slate-800 shadow-xl p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                  <Tv className="w-3.5 h-3.5 text-indigo-400" /> Monitor Pantalla TV en Vivo
                </span>
              </div>
              <Link
                to="/pantalla"
                className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <span>Pantalla Completa</span>
              </Link>
            </div>

            {/* Live TV Screen Viewport */}
            <div className="my-4">
              {topScreenCall ? (
                <div
                  className={`rounded-xl p-5 text-center transition-all duration-300 ${
                    screenPulsing
                      ? 'bg-indigo-900/90 border-2 border-indigo-400 shadow-xl shadow-indigo-500/40 scale-[1.02]'
                      : 'bg-slate-900 border border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                    TURNO TRANSMITIDO AHORA
                  </div>

                  <div className="font-mono font-black text-5xl sm:text-6xl text-white tracking-tight my-1">
                    {topScreenCall.ticket_code}
                  </div>

                  <div className="text-lg font-black text-indigo-300 uppercase tracking-wide">
                    {topScreenCall.service_name}
                  </div>

                  <div className="mt-3 inline-block bg-white text-slate-950 text-xs sm:text-sm font-black px-4 py-1.5 rounded-lg uppercase tracking-wider">
                    {topScreenCall.desk_info || 'MÓDULO'}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-8 text-center space-y-2">
                  <Radio className="w-8 h-8 text-indigo-400 animate-pulse mx-auto" />
                  <p className="text-sm font-bold text-white">Pantalla en Espera</p>
                  <p className="text-xs text-slate-400">
                    Presiona "LLAMAR AL SIGUIENTE NÚMERO" para transmitir el primer llamado en vivo.
                  </p>
                </div>
              )}
            </div>

            {/* Recent calls on screen */}
            <div className="pt-3 border-t border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">
                Últimos llamados registrados en pantalla:
              </span>
              <div className="grid grid-cols-3 gap-2">
                {latestPublicCalls.slice(0, 3).map((call) => (
                  <div
                    key={call.id}
                    className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-center"
                  >
                    <div className="font-mono text-sm font-black text-white">
                      {call.ticket_code}
                    </div>
                    <div className="text-[10px] text-indigo-400 font-bold truncate">
                      {call.service_name}
                    </div>
                  </div>
                ))}
                {latestPublicCalls.length === 0 && (
                  <div className="col-span-3 text-center text-[11px] text-slate-600 py-1">
                    Sin llamados previos aún.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Attention History */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-sm">
                Historial de Números de {professionTitle}
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Llamados y atenciones de este puesto</span>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold">
                  <th className="py-2 px-3">Turno</th>
                  <th className="py-2 px-3">Profesión</th>
                  <th className="py-2 px-3">Puesto</th>
                  <th className="py-2 px-3">Estado</th>
                  <th className="py-2 px-3">Hora Llamado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historyList.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900 text-sm">
                      {t.ticket_code}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-700">
                      {professionTitle}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 font-medium">
                      {t.desk_info || deskNumber}
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={t.status} size="sm" />
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono">
                      {t.called_at
                        ? new Date(t.called_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                        : '-'}
                    </td>
                  </tr>
                ))}
                {historyList.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-xs text-slate-400 italic">
                      Aún no se han emitido turnos en esta sesión. Presiona "LLAMAR AL SIGUIENTE NÚMERO" para comenzar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Absent Confirmation Modal */}
      <ConfirmModal
        isOpen={showAbsentModal}
        title={`Marcar Ausente a ${currentTicket?.ticket_code}`}
        description="El turno quedará registrado como ausente y el puesto quedará libre para llamar al siguiente número."
        confirmText="Confirmar Ausencia"
        variant="danger"
        requireInput={false}
        onConfirm={handleConfirmAbsent}
        onClose={() => setShowAbsentModal(false)}
        isLoading={isProcessing}
      />
    </div>
  );
};
