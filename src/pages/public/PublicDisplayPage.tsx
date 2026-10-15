import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { repository } from '../../lib/repository';
import { PublicCall, Service, Event } from '../../types/database';
import { soundManager } from '../../lib/audio';
import {
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Radio,
  Clock,
  Bell,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Layers,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

export const PublicDisplayPage: React.FC = () => {
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  const [publicCalls, setPublicCalls] = useState<PublicCall[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('ALL');
  const [soundEnabled, setSoundEnabled] = useState(soundManager.isEnabled());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isPulsing, setIsPulsing] = useState<boolean>(false);

  // Quick testing & professional call control bar
  const [showCallToolbar, setShowCallToolbar] = useState<boolean>(true);
  const [quickServiceId, setQuickServiceId] = useState<string>('srv-fon');
  const [quickDesk, setQuickDesk] = useState<string>('Box 3');
  const [isCalling, setIsCalling] = useState<boolean>(false);
  const [quickSuccessMsg, setQuickSuccessMsg] = useState<string | null>(null);

  const lastAnnouncedIdRef = useRef<string | null>(null);
  const isFirstLoadRef = useRef<boolean>(true);
  const pulseTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Live Digital Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const ev = await repository.getActiveEvent();
      const calls = await repository.getPublicCalls();
      const srvs = await repository.getServices(true);
      setActiveEvent(ev);
      setPublicCalls(calls);
      setServices(srvs);

      // Auto-select initial service for quick toolbar if not set
      if (srvs.length > 0 && !quickServiceId) {
        setQuickServiceId(srvs[0].id);
      }

      // Check if a professional triggered a call
      if (calls.length > 0) {
        const topCall = calls[0];

        if (lastAnnouncedIdRef.current !== topCall.id) {
          const wasFirstLoad = isFirstLoadRef.current;
          lastAnnouncedIdRef.current = topCall.id;
          isFirstLoadRef.current = false;

          // Pulse & play audio chime
          if (!wasFirstLoad) {
            setIsPulsing(true);
            if (soundManager.isEnabled()) {
              soundManager.playChime();
            }
            if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
            pulseTimerRef.current = setTimeout(() => setIsPulsing(false), 5000);
          }
        }
      } else {
        isFirstLoadRef.current = false;
      }
    } catch (e) {
      console.error('Error loading public screen data:', e);
    }
  };

  // Real-time multi-channel listeners: CustomEvent + storage + reactive repo + 300ms polling
  useEffect(() => {
    loadData();

    // 1. Reactive engine callback
    const unsubscribe = repository.subscribeRealtime(() => {
      loadData();
    });

    // 2. Intra-window custom event (immediate dispatch on same tab/window)
    const handleCustomCall = () => {
      loadData();
    };
    window.addEventListener('turno_social_call', handleCustomCall);

    // 3. Storage event listener (multi-tab / multi-window instant propagation)
    const handleStorageEvent = (e: StorageEvent) => {
      if (!e.key || e.key.startsWith('turno_social')) {
        loadData();
      }
    };
    window.addEventListener('storage', handleStorageEvent);

    // 4. Polling every 300ms guarantees instantaneous synchronization under any browser condition
    const pollInterval = setInterval(() => {
      loadData();
    }, 300);

    const unsubSound = soundManager.subscribe((enabled) => {
      setSoundEnabled(enabled);
    });

    return () => {
      unsubscribe();
      unsubSound();
      window.removeEventListener('turno_social_call', handleCustomCall);
      window.removeEventListener('storage', handleStorageEvent);
      clearInterval(pollInterval);
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
    };
  }, []);

  const toggleSound = () => {
    const active = soundManager.toggleAudio();
    setSoundEnabled(active);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Quick call from public screen test bar
  const handleQuickCallNext = async () => {
    if (isCalling) return;
    setIsCalling(true);
    setQuickSuccessMsg(null);

    try {
      const selectedSrv = services.find((s) => s.id === quickServiceId) || services[0];
      const srvId = selectedSrv ? selectedSrv.id : quickServiceId;
      const profId = 'user-pro-' + (selectedSrv ? selectedSrv.code.toLowerCase() : 'fon');

      const ticket = await repository.callNextNumber({
        service_id: srvId,
        professional_id: profId,
        desk_info: quickDesk,
      });

      await loadData();
      setIsPulsing(true);
      if (soundManager.isEnabled()) {
        soundManager.playChime();
      }
      setQuickSuccessMsg(`Llamado emitido: ${ticket.ticket_code} (${selectedSrv?.name}) en ${quickDesk}`);
      setTimeout(() => setQuickSuccessMsg(null), 4000);
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
      pulseTimerRef.current = setTimeout(() => setIsPulsing(false), 5000);
    } catch (err: unknown) {
      alert((err as Error).message || 'Error al emitir llamado');
    } finally {
      setIsCalling(false);
    }
  };

  // Re-call current ticket with chime
  const handleQuickRecall = async () => {
    if (!currentCall || isCalling) return;
    setIsCalling(true);
    try {
      const selectedSrv = services.find((s) => s.code === currentCall.service_code);
      const profId = 'user-pro-' + (selectedSrv ? selectedSrv.code.toLowerCase() : 'fon');

      await repository.recallTicket({
        ticket_id: currentCall.ticket_id,
        professional_id: profId,
        desk_info: currentCall.desk_info,
      });

      await loadData();
      setIsPulsing(true);
      if (soundManager.isEnabled()) {
        soundManager.playChime();
      }
      setQuickSuccessMsg(`Re-llamado anunciado: ${currentCall.ticket_code} con campanilla`);
      setTimeout(() => setQuickSuccessMsg(null), 4000);
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
      pulseTimerRef.current = setTimeout(() => setIsPulsing(false), 5000);
    } catch (err: unknown) {
      alert((err as Error).message || 'Error al re-anunciar turno');
    } finally {
      setIsCalling(false);
    }
  };

  const handleQuickResetToZero = async () => {
    try {
      setIsCalling(true);
      await repository.resetAllTicketsToZero();
      await loadData();
      setQuickSuccessMsg('Turnos y contadores reiniciados a cero');
      setTimeout(() => setQuickSuccessMsg(null), 3000);
    } catch (err: unknown) {
      alert((err as Error).message || 'Error al reiniciar turnos');
    } finally {
      setIsCalling(false);
    }
  };

  const filteredCalls = selectedServiceId === 'ALL'
    ? publicCalls
    : publicCalls.filter((c) => {
        const srv = services.find((s) => s.id === selectedServiceId);
        return srv ? c.service_code === srv.code : true;
      });

  const currentCall = filteredCalls[0] || null;
  const recentCalls = filteredCalls.slice(1, 7);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between selection:bg-indigo-600 font-sans">
      {/* Top Testing & Professional Quick Call Bar */}
      {showCallToolbar ? (
        <div className="bg-indigo-950 border-b border-indigo-800/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-md">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-black text-indigo-200 uppercase tracking-wide">
              Puesto Profesional:
            </span>

            {/* Profession selector */}
            <select
              value={quickServiceId}
              onChange={(e) => setQuickServiceId(e.target.value)}
              className="bg-indigo-900 border border-indigo-700 text-white font-bold rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-400 cursor-pointer"
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>

            {/* Desk input */}
            <input
              type="text"
              value={quickDesk}
              onChange={(e) => setQuickDesk(e.target.value)}
              placeholder="Box 1"
              title="Puesto o Box de atención"
              className="bg-indigo-900 border border-indigo-700 text-white font-bold rounded-lg px-2.5 py-1.5 w-24 text-center focus:outline-hidden focus:ring-2 focus:ring-indigo-400"
            />

            {/* PRIMARY CALL NEXT BUTTON */}
            <button
              onClick={handleQuickCallNext}
              disabled={isCalling}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-lg shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Bell className="w-3.5 h-3.5 animate-bounce" />
              <span>{isCalling ? 'Llamando...' : 'LLAMAR SIGUIENTE NÚMERO'}</span>
            </button>

            {/* RE-CALL BUTTON */}
            {currentCall && (
              <button
                onClick={handleQuickRecall}
                disabled={isCalling}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-200 border border-indigo-700/60 font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Repetir timbre y llamado del número en pantalla"
              >
                <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Volver a Llamar</span>
              </button>
            )}

            {/* RESET TICKETS TO ZERO BUTTON */}
            <button
              onClick={handleQuickResetToZero}
              disabled={isCalling}
              className="px-2.5 py-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-700/80 text-rose-300 font-bold rounded-lg transition flex items-center gap-1 cursor-pointer disabled:opacity-50 text-[11px]"
              title="Poner todos los turnos y contadores en cero"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Turnos a Cero</span>
            </button>

            {quickSuccessMsg && (
              <span className="text-emerald-400 font-semibold px-2 py-0.5 bg-emerald-950/80 border border-emerald-800 rounded animate-in fade-in">
                ✓ {quickSuccessMsg}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/profesional"
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold rounded-lg border border-slate-700 transition flex items-center gap-1"
            >
              <span>Estación Completa</span>
            </Link>

            <Link
              to="/admin"
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold rounded-lg border border-slate-700 transition"
            >
              <span>Admin</span>
            </Link>

            <button
              onClick={() => setShowCallToolbar(false)}
              className="p-1 text-slate-400 hover:text-white rounded"
              title="Ocultar barra de control"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/60 border-b border-slate-800 px-4 py-1 flex justify-between items-center text-xs">
          <span className="text-slate-400 text-[11px]">
            Pantalla en modo presentación completa
          </span>
          <button
            onClick={() => setShowCallToolbar(true)}
            className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 text-[11px]"
          >
            <span>Mostrar barra de llamado</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
        {/* Top Header Bar */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center font-extrabold text-white text-xl tracking-wider shadow-lg shadow-indigo-600/30">
              TS
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">
                  {activeEvent ? activeEvent.name : 'operativo social IBM 2026'}
                </h1>
              </div>
              <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-400 font-medium mt-0.5">
                <span>Llamado Oficial de Turnos</span>
                <span>·</span>
                <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                  <Radio className="w-3.5 h-3.5 animate-pulse" /> Conectado en Tiempo Real (No cambia sola, espera orden del profesional)
                </span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Service Filter */}
            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs sm:text-sm rounded-lg px-3 py-2 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">Todos los servicios ({services.length})</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} - {s.name}
                </option>
              ))}
            </select>

            {/* Sound toggle button */}
            <button
              onClick={toggleSound}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg border transition cursor-pointer ${
                soundEnabled
                  ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300 hover:bg-emerald-900 shadow-xs'
                  : 'bg-slate-800/90 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
              title={soundEnabled ? 'Desactivar sonido (Silenciar campanilla)' : 'Activar sonido de campanilla'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
              <span>{soundEnabled ? 'Desactivar Sonido' : 'Activar Sonido'}</span>
            </button>

            {/* Fullscreen toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg transition cursor-pointer"
              title="Pantalla Completa"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Clock */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 font-mono text-sm">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>{currentTime}</span>
            </div>
          </div>
        </header>

        {/* Main Display Area: GIANT TICKET CALL */}
        <main className="flex-1 my-6 flex flex-col justify-center">
          {currentCall ? (
            <div
              className={`relative rounded-3xl p-6 sm:p-10 lg:p-14 text-center transition-all duration-300 ${
                isPulsing
                  ? 'bg-indigo-900/80 border-4 border-indigo-400 shadow-2xl shadow-indigo-500/60 scale-[1.01]'
                  : 'bg-slate-900 border-2 border-slate-800 shadow-2xl'
              }`}
            >
              {/* Call State Tag */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="inline-flex items-center gap-2 px-6 py-2 rounded-full text-sm sm:text-base font-black uppercase tracking-wider bg-indigo-500/25 text-indigo-200 border border-indigo-400/50 shadow-md">
                  <Bell className="w-5 h-5 text-indigo-300 animate-bounce" />
                  TURNO LLAMADO AHORA
                </span>
              </div>

              {/* Giant Ticket Code */}
              <div className="my-2 sm:my-4">
                <span className="font-mono font-black text-7xl sm:text-9xl lg:text-[13rem] tracking-tight text-white drop-shadow-[0_16px_32px_rgba(0,0,0,0.95)] leading-none select-all">
                  {currentCall.ticket_code}
                </span>
              </div>

              {/* Service / Profession Name (ONLY profession name, NO personal names) */}
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-indigo-300 tracking-wide uppercase mt-4">
                {currentCall.service_name}
              </h2>

              {/* Desk / Module location */}
              <div className="mt-8 inline-block bg-white text-slate-950 font-black text-2xl sm:text-4xl lg:text-5xl px-10 py-4 rounded-2xl shadow-2xl uppercase tracking-wider">
                {currentCall.desk_info || 'MÓDULO DE ATENCIÓN'}
              </div>

              {/* Timestamp of call */}
              <p className="text-xs sm:text-sm text-slate-400 font-mono mt-5">
                Llamado a las {new Date(currentCall.called_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
            </div>
          ) : (
            <div className="rounded-3xl bg-slate-900/80 border-2 border-slate-800 p-10 sm:p-16 text-center max-w-2xl mx-auto space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400">
                <Radio className="w-8 h-8 animate-pulse" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                En Espera de Llamados
              </h2>

              <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-md mx-auto">
                La pantalla está conectada en tiempo real. Tan pronto como un profesional presione el botón <strong className="text-indigo-400">"LLAMAR SIGUIENTE NÚMERO"</strong>, el turno se anunciará automáticamente aquí.
              </p>

              <div className="pt-2 flex items-center justify-center gap-2 text-xs text-slate-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Sincronización activa con los 8 servicios profesionales</span>
              </div>
            </div>
          )}
        </main>

        {/* Bottom Bar: Recent Calls List */}
        <footer className="pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-slate-400">
              Últimos Turnos Llamados
            </span>
            <span className="text-xs text-slate-500">
              Privacidad garantizada · Sin datos personales en pantalla · Solo profesión y box
            </span>
          </div>

          {recentCalls.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {recentCalls.map((call) => (
                <div
                  key={call.id}
                  className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-center transition hover:border-slate-700"
                >
                  <div className="font-mono text-2xl sm:text-3xl font-extrabold text-white">
                    {call.ticket_code}
                  </div>
                  <div className="text-[11px] font-bold text-indigo-400 uppercase truncate mt-0.5">
                    {call.service_name}
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold truncate mt-0.5">
                    {call.desk_info || 'Módulo'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-2 text-xs text-slate-600">
              Aún no hay llamados anteriores en este operativo.
            </div>
          )}
        </footer>
      </div>
    </div>
  );
};
