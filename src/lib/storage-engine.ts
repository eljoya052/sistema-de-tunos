import {
  Event,
  Profile,
  Service,
  ProfessionalService,
  Person,
  Ticket,
  TicketEvent,
  ServiceCounter,
  PublicCall,
  TicketStatus
} from '../types/database';

const STORAGE_KEY = 'turno_social_db_v5';
const BROADCAST_CHANNEL_NAME = 'turno_social_realtime_bus';

export interface DatabaseState {
  events: Event[];
  activeEventId: string;
  profiles: Profile[];
  services: Service[];
  professionalServices: ProfessionalService[];
  people: Person[];
  tickets: Ticket[];
  ticketEvents: TicketEvent[];
  serviceCounters: ServiceCounter[];
  publicCalls: PublicCall[];
}

export const INITIAL_SERVICES: Omit<Service, 'id' | 'created_at'>[] = [
  { code: 'FON', name: 'Fonoaudiología', active: true, description: 'Evaluación y terapia vocal, auditiva y del habla' },
  { code: 'PSI', name: 'Psicología', active: true, description: 'Contención emocional, orientación y salud mental' },
  { code: 'ASO', name: 'Asistente social', active: true, description: 'Orientación en beneficios estatales, ficha social y subsidios' },
  { code: 'ENF', name: 'Enfermería', active: true, description: 'Toma de presión, glicemia, curaciones y triage preventivo' },
  { code: 'JUR', name: 'Asesoría jurídica', active: true, description: 'Orientación legal familiar, laboral y civil' },
  { code: 'VET', name: 'Veterinaria', active: true, description: 'Atención primaria de mascotas, vacunación y desparasitación' },
  { code: 'KIN', name: 'Kinesiología', active: true, description: 'Evaluación musculoesquelética, ergonomía y movilidad' },
  { code: 'BAR', name: 'Barbería', active: true, description: 'Cortes de cabello y cuidado personal comunitario' },
];

export const INITIAL_PROFILES: Profile[] = [
  {
    id: 'user-admin-01',
    email: 'admin@operativo.cl',
    full_name: 'Administración General',
    role: 'ADMIN',
    active: true,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'user-pro-psi',
    email: 'psicologia@operativo.cl',
    full_name: 'Psicología',
    role: 'PROFESSIONAL',
    active: true,
    desk_number: 'Box 1',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'user-pro-enf',
    email: 'enfermeria@operativo.cl',
    full_name: 'Enfermería',
    role: 'PROFESSIONAL',
    active: true,
    desk_number: 'Box 2',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'user-pro-aso',
    email: 'social@operativo.cl',
    full_name: 'Asistente Social',
    role: 'PROFESSIONAL',
    active: true,
    desk_number: 'Módulo A',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'user-pro-fon',
    email: 'fono@operativo.cl',
    full_name: 'Fonoaudiología',
    role: 'PROFESSIONAL',
    active: true,
    desk_number: 'Box 3',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'user-pro-jur',
    email: 'juridico@operativo.cl',
    full_name: 'Asesoría Jurídica',
    role: 'PROFESSIONAL',
    active: true,
    desk_number: 'Módulo B',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'user-pro-vet',
    email: 'veterinaria@operativo.cl',
    full_name: 'Veterinaria',
    role: 'PROFESSIONAL',
    active: true,
    desk_number: 'Área Canina',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'user-pro-kin',
    email: 'kine@operativo.cl',
    full_name: 'Kinesiología',
    role: 'PROFESSIONAL',
    active: true,
    desk_number: 'Box 4',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'user-pro-bar',
    email: 'barberia@operativo.cl',
    full_name: 'Barbería',
    role: 'PROFESSIONAL',
    active: true,
    desk_number: 'Sillón 1',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

export function generateInitialSeedState(): DatabaseState {
  const eventId = 'ev-central-2026';
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const events: Event[] = [
    {
      id: eventId,
      name: 'operativo social IBM 2026',
      event_date: todayStr,
      status: 'ACTIVO',
      created_at: new Date(now.getTime() - 3600000 * 5).toISOString(),
      created_by: 'user-admin-01',
    },
    {
      id: 'ev-previo-2026',
      name: 'Operativo Solidario Población El Roble',
      event_date: new Date(now.getTime() - 86400000 * 7).toISOString().split('T')[0],
      status: 'FINALIZADO',
      created_at: new Date(now.getTime() - 86400000 * 8).toISOString(),
      created_by: 'user-admin-01',
    }
  ];

  const services: Service[] = INITIAL_SERVICES.map((s, idx) => ({
    id: `srv-${s.code.toLowerCase()}`,
    name: s.name,
    code: s.code,
    active: s.active,
    description: s.description,
    created_at: new Date(now.getTime() - 86400000 * 4 + idx * 1000).toISOString(),
  }));

  const professionalServices: ProfessionalService[] = [
    { id: 'ps-psi', professional_id: 'user-pro-psi', service_id: 'srv-psi', active: true, created_at: now.toISOString() },
    { id: 'ps-enf', professional_id: 'user-pro-enf', service_id: 'srv-enf', active: true, created_at: now.toISOString() },
    { id: 'ps-aso', professional_id: 'user-pro-aso', service_id: 'srv-aso', active: true, created_at: now.toISOString() },
    { id: 'ps-fon', professional_id: 'user-pro-fon', service_id: 'srv-fon', active: true, created_at: now.toISOString() },
    { id: 'ps-jur', professional_id: 'user-pro-jur', service_id: 'srv-jur', active: true, created_at: now.toISOString() },
    { id: 'ps-vet', professional_id: 'user-pro-vet', service_id: 'srv-vet', active: true, created_at: now.toISOString() },
    { id: 'ps-kin', professional_id: 'user-pro-kin', service_id: 'srv-kin', active: true, created_at: now.toISOString() },
    { id: 'ps-bar', professional_id: 'user-pro-bar', service_id: 'srv-bar', active: true, created_at: now.toISOString() },
  ];

  const people: Person[] = [
    {
      id: 'per-001',
      first_name: 'María',
      last_name: 'González',
      rut: '14.283.912-4',
      phone: '+56 9 8765 4321',
      created_at: new Date(now.getTime() - 3600000 * 2).toISOString(),
      updated_at: new Date(now.getTime() - 3600000 * 2).toISOString(),
      created_by: 'user-admin-01',
    },
    {
      id: 'per-002',
      first_name: 'Carlos',
      last_name: 'Muñoz',
      rut: '16.529.102-K',
      phone: '+56 9 7654 3210',
      created_at: new Date(now.getTime() - 3600000 * 1.5).toISOString(),
      updated_at: new Date(now.getTime() - 3600000 * 1.5).toISOString(),
      created_by: 'user-admin-01',
    },
    {
      id: 'per-003',
      first_name: 'Elena',
      last_name: 'Sepúlveda',
      rut: '11.839.201-3',
      phone: '+56 9 6543 2109',
      created_at: new Date(now.getTime() - 3600000 * 1).toISOString(),
      updated_at: new Date(now.getTime() - 3600000 * 1).toISOString(),
      created_by: 'user-admin-01',
    },
  ];

  // Tickets initialized completely at zero (fresh state)
  const tickets: Ticket[] = [];

  // Service counters all initialized at zero
  const serviceCounters: ServiceCounter[] = [
    { id: 'sc-psi', event_id: eventId, service_id: 'srv-psi', last_number: 0, updated_at: now.toISOString() },
    { id: 'sc-enf', event_id: eventId, service_id: 'srv-enf', last_number: 0, updated_at: now.toISOString() },
    { id: 'sc-vet', event_id: eventId, service_id: 'srv-vet', last_number: 0, updated_at: now.toISOString() },
    { id: 'sc-aso', event_id: eventId, service_id: 'srv-aso', last_number: 0, updated_at: now.toISOString() },
    { id: 'sc-kin', event_id: eventId, service_id: 'srv-kin', last_number: 0, updated_at: now.toISOString() },
    { id: 'sc-fon', event_id: eventId, service_id: 'srv-fon', last_number: 0, updated_at: now.toISOString() },
    { id: 'sc-jur', event_id: eventId, service_id: 'srv-jur', last_number: 0, updated_at: now.toISOString() },
    { id: 'sc-bar', event_id: eventId, service_id: 'srv-bar', last_number: 0, updated_at: now.toISOString() },
  ];

  // Screen initializes with 0 calls - waiting for professional calls
  const publicCalls: PublicCall[] = [];

  const ticketEvents: TicketEvent[] = [];

  return {
    events,
    activeEventId: eventId,
    profiles: INITIAL_PROFILES,
    services,
    professionalServices,
    people,
    tickets,
    ticketEvents,
    serviceCounters,
    publicCalls,
  };
}

export class ReactiveStorageEngine {
  private state: DatabaseState;
  private channel: BroadcastChannel | null = null;
  private listeners: Set<(event: { type: string; payload?: unknown }) => void> = new Set();
  private lockPromise: Promise<void> = Promise.resolve();
  private serverVersion = 0;
  private isSyncingWithServer = false;

  constructor() {
    this.state = this.loadState();
    if (typeof window !== 'undefined') {
      if ('BroadcastChannel' in window) {
        try {
          this.channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
          this.channel.onmessage = (msg) => {
            if (msg.data && msg.data.type) {
              this.state = this.loadState();
              this.notifyListeners(msg.data.type, msg.data.payload);
            }
          };
        } catch (err) {
          console.warn('BroadcastChannel error:', err);
        }
      }

      // Cross-tab and cross-window storage event fallback
      window.addEventListener('storage', (event) => {
        if (event.key === STORAGE_KEY || event.key === 'turno_social_ping') {
          this.state = this.loadState();
          this.notifyListeners('STORAGE_SYNC');
        }
      });

      // Centralized multi-device real-time sync with server
      this.initServerSync();
    }
  }

  public setState(newState: DatabaseState): void {
    this.state = newState;
    if (typeof window !== 'undefined') {
      this.saveStateToStorage(newState);
      this.notifyListeners('STORAGE_SYNC');
    }
  }

  private initServerSync(): void {
    if (typeof window === 'undefined') return;

    // 1. Initial State fetch from server
    fetch('/api/state')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.state) {
          this.serverVersion = data.version || 1;
          this.state = data.state;
          this.saveStateToStorage(data.state);
          this.notifyListeners('SERVER_INIT');
          window.dispatchEvent(new CustomEvent('turno_social_call', { detail: { type: 'SERVER_INIT' } }));
        }
      })
      .catch((err) => {
        console.warn('[Sync] Could not reach /api/state on startup, using local storage cache:', err);
      });

    // 2. Real-time Live SSE stream connecting mobile phones and TV waiting screen
    const connectSSE = () => {
      try {
        const es = new EventSource('/api/stream');
        es.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data && data.state) {
              this.serverVersion = data.version || this.serverVersion + 1;
              this.state = data.state;
              this.saveStateToStorage(data.state);
              this.notifyListeners(data.type || 'SERVER_UPDATE', data.payload);
              window.dispatchEvent(
                new CustomEvent('turno_social_call', {
                  detail: { type: data.type || 'SERVER_UPDATE', payload: data.payload },
                })
              );
            }
          } catch (err) {
            console.error('[Sync] SSE parse error:', err);
          }
        };

        es.onerror = () => {
          es.close();
          // Auto-reconnect after 2.5 seconds
          setTimeout(connectSSE, 2500);
        };
      } catch (err) {
        console.warn('[Sync] EventSource initialization failed:', err);
      }
    };

    connectSSE();

    // 3. Fallback Heartbeat Poller (guarantees sync across phones even if tab was backgrounded)
    setInterval(() => {
      if (this.isSyncingWithServer) return;
      this.isSyncingWithServer = true;
      fetch('/api/version')
        .then((res) => res.json())
        .then((v) => {
          if (v && typeof v.version === 'number' && v.version !== this.serverVersion) {
            return fetch('/api/state')
              .then((r) => r.json())
              .then((data) => {
                if (data && data.state) {
                  this.serverVersion = data.version;
                  this.state = data.state;
                  this.saveStateToStorage(data.state);
                  this.notifyListeners('SERVER_HEARTBEAT_SYNC');
                  window.dispatchEvent(
                    new CustomEvent('turno_social_call', { detail: { type: 'SERVER_HEARTBEAT_SYNC' } })
                  );
                }
              });
          }
        })
        .catch(() => {})
        .finally(() => {
          this.isSyncingWithServer = false;
        });
    }, 1200);

    // 4. Mobile screen unlock / tab visibility change instant catch-up
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        fetch('/api/state')
          .then((r) => r.json())
          .then((data) => {
            if (data && data.state) {
              this.serverVersion = data.version;
              this.state = data.state;
              this.saveStateToStorage(data.state);
              this.notifyListeners('VISIBILITY_SYNC');
              window.dispatchEvent(
                new CustomEvent('turno_social_call', { detail: { type: 'VISIBILITY_SYNC' } })
              );
            }
          })
          .catch(() => {});
      }
    });
  }

  private async dispatchAction<T>(action: string, params: any, localFn: () => Promise<T> | T): Promise<T> {
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, params }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json && json.state) {
            this.serverVersion = json.version || this.serverVersion + 1;
            this.state = json.state;
            this.saveStateToStorage(json.state);
            this.notifyListeners(action, json.result);
            window.dispatchEvent(
              new CustomEvent('turno_social_call', { detail: { type: action, payload: json.result } })
            );
            if (this.channel) {
              this.channel.postMessage({ type: action, payload: json.result });
            }
            return json.result as T;
          }
        }
      } catch (err) {
        console.warn(`[Sync] /api/action ${action} network failure, falling back locally:`, err);
      }
    }
    return await localFn();
  }

  private loadState(): DatabaseState {
    if (typeof window === 'undefined') {
      return generateInitialSeedState();
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.events && parsed.services && parsed.tickets) {
          if (!Array.isArray(parsed.publicCalls)) {
            parsed.publicCalls = [];
          }
          parsed.events = parsed.events.map((ev: Event) => {
            if (ev.name && (ev.name.includes('Plaza Central') || ev.name.includes('Operativo Social Comunitario 2026'))) {
              return { ...ev, name: 'operativo social IBM 2026' };
            }
            return ev;
          });
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse localStorage database, resetting to seed:', e);
    }
    const fresh = generateInitialSeedState();
    this.saveStateToStorage(fresh);
    return fresh;
  }

  private saveStateToStorage(state: DatabaseState): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to persist state to localStorage:', e);
    }
  }

  private mutate<T>(operation: (draft: DatabaseState) => T, eventType: string, payload?: unknown): T {
    // Synchronous state mutation with disk persistence & multi-tab broadcast
    const result = operation(this.state);
    this.saveStateToStorage(this.state);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('turno_social_ping', Date.now().toString());
        window.dispatchEvent(new CustomEvent('turno_social_call', { detail: { type: eventType, payload } }));
      } catch (e) {
        // ignore
      }
    }

    this.notifyListeners(eventType, payload);
    if (this.channel) {
      try {
        this.channel.postMessage({ type: eventType, payload });
      } catch (e) {
        console.warn('Channel postMessage failed:', e);
      }
    }
    return result;
  }

  // Mutex wrapper to prevent race conditions during concurrent actions in the same tab
  private async withLock<T>(fn: () => Promise<T> | T): Promise<T> {
    const nextLock = this.lockPromise.then(async () => {
      return await fn();
    });
    this.lockPromise = nextLock.then(() => {}, () => {});
    return nextLock;
  }

  public subscribe(listener: (event: { type: string; payload?: unknown }) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(type: string, payload?: unknown): void {
    this.listeners.forEach((l) => {
      try {
        l({ type, payload });
      } catch (e) {
        console.error('Listener callback error:', e);
      }
    });
  }

  public ensureSyncedState(): DatabaseState {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && Array.isArray(parsed.tickets)) {
            if (!Array.isArray(parsed.publicCalls)) {
              parsed.publicCalls = [];
            }
            if (Array.isArray(parsed.events)) {
              parsed.events = parsed.events.map((ev: Event) => {
                if (ev.name && (ev.name.includes('Plaza Central') || ev.name.includes('Operativo Social Comunitario 2026'))) {
                  return { ...ev, name: 'operativo social IBM 2026' };
                }
                return ev;
              });
            }
            this.state = parsed;
          }
        }
      } catch (e) {
        // ignore
      }
    }
    return this.state;
  }

  // -------------------------------------------------------------
  // Queries
  // -------------------------------------------------------------

  public getState(): DatabaseState {
    this.ensureSyncedState();
    return this.state;
  }

  public getActiveEvent(): Event | null {
    this.ensureSyncedState();
    return this.state.events.find((e) => e.id === this.state.activeEventId) || this.state.events[0] || null;
  }

  public getEvents(): Event[] {
    this.ensureSyncedState();
    return [...this.state.events].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getServices(onlyActive = false): Service[] {
    this.ensureSyncedState();
    return this.state.services.filter((s) => !onlyActive || s.active);
  }

  public getProfiles(): Profile[] {
    this.ensureSyncedState();
    return [...this.state.profiles];
  }

  public getProfileById(id: string): Profile | undefined {
    this.ensureSyncedState();
    return this.state.profiles.find((p) => p.id === id);
  }

  public getProfileByEmail(email: string): Profile | undefined {
    this.ensureSyncedState();
    return this.state.profiles.find((p) => p.email.toLowerCase() === email.toLowerCase());
  }

  public getProfessionalServices(professionalId: string): Service[] {
    this.ensureSyncedState();
    const assignments = this.state.professionalServices.filter((ps) => ps.professional_id === professionalId && ps.active);
    const serviceIds = new Set(assignments.map((ps) => ps.service_id));
    return this.state.services.filter((s) => serviceIds.has(s.id));
  }

  public getPeople(): Person[] {
    this.ensureSyncedState();
    return [...this.state.people].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getPersonById(id: string): Person | undefined {
    this.ensureSyncedState();
    return this.state.people.find((p) => p.id === id);
  }

  public getTickets(filter?: {
    eventId?: string;
    serviceId?: string;
    status?: TicketStatus | 'ALL';
    professionalId?: string;
  }): Ticket[] {
    this.ensureSyncedState();
    const eventId = filter?.eventId || this.state.activeEventId;
    return this.state.tickets
      .filter((t) => {
        if (eventId && t.event_id !== eventId) return false;
        if (filter?.serviceId && t.service_id !== filter.serviceId) return false;
        if (filter?.status && filter.status !== 'ALL' && t.status !== filter.status) return false;
        if (filter?.professionalId && t.assigned_professional_id !== filter.professionalId) return false;
        return true;
      })
      .map((t) => this.hydrateTicket(t))
      .sort((a, b) => a.ticket_number - b.ticket_number);
  }

  public getTicketById(id: string): Ticket | null {
    this.ensureSyncedState();
    const t = this.state.tickets.find((t) => t.id === id);
    return t ? this.hydrateTicket(t) : null;
  }

  public getPublicCalls(): PublicCall[] {
    this.ensureSyncedState();

    if (this.state.publicCalls && this.state.publicCalls.length > 0) {
      return [...this.state.publicCalls].sort(
        (a, b) => new Date(b.called_at).getTime() - new Date(a.called_at).getTime()
      );
    }

    // Derive directly from all tickets that have called_at, ensuring sync
    const ticketCalls: PublicCall[] = this.state.tickets
      .filter((t) => t.called_at && (t.status === 'LLAMADO' || t.status === 'EN_ATENCION' || t.status === 'ATENDIDO'))
      .map((t) => {
        const srv = this.state.services.find((s) => s.id === t.service_id);
        return {
          id: 'pc-' + t.id + '-' + new Date(t.called_at!).getTime(),
          ticket_id: t.id,
          ticket_code: t.ticket_code,
          service_name: srv?.name || 'Servicio',
          service_code: srv?.code || 'SRV',
          desk_info: t.desk_info || 'Módulo Principal',
          called_at: t.called_at!,
          status: t.status,
        };
      });

    return ticketCalls.sort(
      (a, b) => new Date(b.called_at).getTime() - new Date(a.called_at).getTime()
    );
  }

  public getTicketEvents(ticketId?: string): TicketEvent[] {
    this.ensureSyncedState();
    if (ticketId) {
      return this.state.ticketEvents
        .filter((e) => e.ticket_id === ticketId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return [...this.state.ticketEvents].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  private hydrateTicket(ticket: Ticket): Ticket {
    return {
      ...ticket,
      person: this.state.people.find((p) => p.id === ticket.person_id),
      service: this.state.services.find((s) => s.id === ticket.service_id),
      assigned_professional: this.state.profiles.find((p) => p.id === ticket.assigned_professional_id),
    };
  }

  /**
   * Directly dispenses a ticket for a service without requiring patient registration
   */
  public async issueTicketForService(params: {
    service_id: string;
    notes?: string;
  }): Promise<Ticket> {
    return this.dispatchAction('issueTicketForService', params, async () => {
      return this.withLock(async () => {
        this.ensureSyncedState();
        const activeEvent = this.getActiveEvent();
        if (!activeEvent) throw new Error('No hay un operativo activo seleccionado.');
        if (activeEvent.status === 'FINALIZADO') throw new Error('El operativo se encuentra cerrado.');

        const service = this.state.services.find((s) => s.id === params.service_id);
        if (!service) throw new Error('Servicio no encontrado.');
        if (!service.active) throw new Error(`El servicio ${service.name} está inactivo.`);

        const now = new Date().toISOString();
        let counter = this.state.serviceCounters.find(
          (sc) => sc.event_id === activeEvent.id && sc.service_id === params.service_id
        );
        let nextNumber = 1;
        if (counter) {
          nextNumber = counter.last_number + 1;
          counter.last_number = nextNumber;
          counter.updated_at = now;
        } else {
          counter = {
            id: 'sc-' + Math.random().toString(36).substring(2, 9),
            event_id: activeEvent.id,
            service_id: params.service_id,
            last_number: nextNumber,
            updated_at: now,
          };
          this.state.serviceCounters.push(counter);
        }

        const formattedNumber = String(nextNumber).padStart(3, '0');
        const ticketCode = `${service.code}-${formattedNumber}`;
        const ticketId = 'tkt-' + Math.random().toString(36).substring(2, 11);

        const newTicket: Ticket = {
          id: ticketId,
          event_id: activeEvent.id,
          service_id: params.service_id,
          ticket_number: nextNumber,
          ticket_code: ticketCode,
          status: 'PENDIENTE',
          notes: params.notes,
          created_at: now,
          updated_at: now,
        };

        const tktEvent: TicketEvent = {
          id: 'te-' + Math.random().toString(36).substring(2, 11),
          ticket_id: ticketId,
          event_type: 'CREATED',
          new_status: 'PENDIENTE',
          actor_id: 'dispensador',
          actor_name: 'Dispensador de Turnos',
          details: `Turno emitido: ${ticketCode} (${service.name})`,
          created_at: now,
        };

        return this.mutate((draft) => {
          draft.tickets.push(newTicket);
          draft.ticketEvents.unshift(tktEvent);
          return this.hydrateTicket(newTicket);
        }, 'TICKETS_CREATED', { ticketCode });
      });
    });
  }

  /**
   * Generates sequential tickets for a person across one or more services
   * Enforces atomic increment of service counters per event.
   */
  public async createPersonWithTickets(params: {
    first_name: string;
    last_name: string;
    rut?: string;
    phone?: string;
    service_ids: string[];
    actor_id: string;
    actor_name: string;
    notes?: string;
  }): Promise<{ person: Person; tickets: Ticket[] }> {
    return this.dispatchAction('createPersonWithTickets', params, async () => {
      return this.withLock(async () => {
      const activeEvent = this.getActiveEvent();
      if (!activeEvent) throw new Error('No hay un operativo activo seleccionado.');
      if (activeEvent.status === 'FINALIZADO') throw new Error('El operativo está cerrado.');
      if (params.service_ids.length === 0) throw new Error('Debe seleccionar al menos un servicio.');

      const now = new Date().toISOString();
      const personId = 'per-' + Math.random().toString(36).substring(2, 10);

      const newPerson: Person = {
        id: personId,
        first_name: params.first_name.trim(),
        last_name: params.last_name.trim(),
        rut: params.rut?.trim() || undefined,
        phone: params.phone?.trim() || undefined,
        created_at: now,
        updated_at: now,
        created_by: params.actor_id,
      };

      const createdTickets: Ticket[] = [];
      const newEvents: TicketEvent[] = [];

      for (const serviceId of params.service_ids) {
        const service = this.state.services.find((s) => s.id === serviceId);
        if (!service) continue;
        if (!service.active) throw new Error(`El servicio ${service.name} está inactivo.`);

        // Find or create service counter for this event & service
        let counter = this.state.serviceCounters.find(
          (sc) => sc.event_id === activeEvent.id && sc.service_id === serviceId
        );
        let nextNumber = 1;
        if (counter) {
          nextNumber = counter.last_number + 1;
          counter.last_number = nextNumber;
          counter.updated_at = now;
        } else {
          counter = {
            id: 'sc-' + Math.random().toString(36).substring(2, 9),
            event_id: activeEvent.id,
            service_id: serviceId,
            last_number: nextNumber,
            updated_at: now,
          };
          this.state.serviceCounters.push(counter);
        }

        const formattedNumber = String(nextNumber).padStart(3, '0');
        const ticketCode = `${service.code}-${formattedNumber}`;
        const ticketId = 'tkt-' + Math.random().toString(36).substring(2, 11);

        const newTicket: Ticket = {
          id: ticketId,
          event_id: activeEvent.id,
          person_id: personId,
          service_id: serviceId,
          ticket_number: nextNumber,
          ticket_code: ticketCode,
          status: 'PENDIENTE',
          notes: params.notes?.trim() || undefined,
          created_at: now,
          updated_at: now,
          created_by: params.actor_id,
        };

        const tktEvent: TicketEvent = {
          id: 'te-' + Math.random().toString(36).substring(2, 11),
          ticket_id: ticketId,
          event_type: 'CREATED',
          new_status: 'PENDIENTE',
          actor_id: params.actor_id,
          actor_name: params.actor_name,
          details: `Turno creado para ${newPerson.first_name} ${newPerson.last_name}`,
          created_at: now,
        };

        createdTickets.push(newTicket);
        newEvents.push(tktEvent);
      }

      return this.mutate((draft) => {
        draft.people.unshift(newPerson);
        draft.tickets.push(...createdTickets);
        draft.ticketEvents.unshift(...newEvents);
        return {
          person: newPerson,
          tickets: createdTickets.map((t) => this.hydrateTicket(t)),
        };
      }, 'TICKETS_CREATED', { count: createdTickets.length, personId });
    });
    });
  }

  /**
   * Calls the next sequential number for a service/profession.
   * If there is an existing pending ticket in queue, it claims it.
   * If the queue is empty, it automatically generates the next sequential ticket
   * (e.g. 1, 2, 3...) for this profession and calls it immediately!
   * No user or patient registration required!
   */
  public async callNextNumber(params: {
    service_id: string;
    professional_id: string;
    desk_info?: string;
  }): Promise<Ticket> {
    return this.dispatchAction('callNextNumber', params, async () => {
      return this.withLock(async () => {
      this.ensureSyncedState();
      const activeEvent = this.getActiveEvent();
      if (!activeEvent) throw new Error('No hay operativo activo seleccionado.');
      if (activeEvent.status === 'FINALIZADO') throw new Error('El operativo se encuentra cerrado.');

      const service = this.state.services.find((s) => s.id === params.service_id);
      if (!service) throw new Error('Servicio no encontrado.');
      if (!service.active) throw new Error(`El servicio ${service.name} está inactivo.`);

      const professional = this.state.profiles.find((p) => p.id === params.professional_id);
      const desk = params.desk_info || professional?.desk_number || 'Módulo 1';
      const now = new Date().toISOString();
      let calledTicketCode = '';

      return this.mutate((draft) => {
        // If professional has an ongoing attention or previously called ticket, finish it automatically
        const activeAtt = draft.tickets.find(
          (t) =>
            t.event_id === activeEvent.id &&
            t.service_id === params.service_id &&
            t.assigned_professional_id === params.professional_id &&
            (t.status === 'EN_ATENCION' || t.status === 'LLAMADO')
        );
        if (activeAtt) {
          activeAtt.status = 'ATENDIDO';
          activeAtt.completed_at = now;
          activeAtt.updated_at = now;
        }

        // 1. Check if there is an existing pending ticket in the queue
        const pendingTickets = draft.tickets
          .filter(
            (t) =>
              t.event_id === activeEvent.id &&
              t.service_id === params.service_id &&
              t.status === 'PENDIENTE'
          )
          .sort((a, b) => a.ticket_number - b.ticket_number);

        let targetTicket: Ticket;

        if (pendingTickets.length > 0) {
          // Take the oldest pending ticket
          targetTicket = pendingTickets[0];
          targetTicket.status = 'LLAMADO';
          targetTicket.assigned_professional_id = params.professional_id;
          targetTicket.desk_info = desk;
          targetTicket.called_at = now;
          targetTicket.updated_at = now;
        } else {
          // 2. Queue is empty: Generate next sequential number for this service
          let counter = draft.serviceCounters.find(
            (sc) => sc.event_id === activeEvent.id && sc.service_id === params.service_id
          );
          let nextNumber = 1;
          if (counter) {
            nextNumber = counter.last_number + 1;
            counter.last_number = nextNumber;
            counter.updated_at = now;
          } else {
            counter = {
              id: 'sc-' + Math.random().toString(36).substring(2, 9),
              event_id: activeEvent.id,
              service_id: params.service_id,
              last_number: nextNumber,
              updated_at: now,
            };
            draft.serviceCounters.push(counter);
          }

          const formattedNumber = String(nextNumber).padStart(3, '0');
          const ticketCode = `${service.code}-${formattedNumber}`;
          const ticketId = 'tkt-' + Math.random().toString(36).substring(2, 11);

          targetTicket = {
            id: ticketId,
            event_id: activeEvent.id,
            service_id: params.service_id,
            ticket_number: nextNumber,
            ticket_code: ticketCode,
            status: 'LLAMADO',
            assigned_professional_id: params.professional_id,
            desk_info: desk,
            called_at: now,
            created_at: now,
            updated_at: now,
          };
          draft.tickets.push(targetTicket);
        }

        calledTicketCode = targetTicket.ticket_code;

        // Audit event (ONLY profession name, no personal names)
        draft.ticketEvents.unshift({
          id: 'te-' + Math.random().toString(36).substring(2, 11),
          ticket_id: targetTicket.id,
          event_type: 'CALLED',
          previous_status: 'PENDIENTE',
          new_status: 'LLAMADO',
          professional_id: params.professional_id,
          actor_id: params.professional_id,
          actor_name: service.name,
          details: `Llamado a ${desk}`,
          created_at: now,
        });

        // Add to publicCalls board with fresh timestamp-based unique ID
        const callToken = 'call-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
        const newCall: PublicCall = {
          id: callToken,
          ticket_id: targetTicket.id,
          ticket_code: targetTicket.ticket_code,
          service_name: service.name,
          service_code: service.code,
          desk_info: desk,
          called_at: now,
          status: 'LLAMADO',
        };

        draft.publicCalls = [
          newCall,
          ...draft.publicCalls.filter((c) => c.ticket_id !== targetTicket.id),
        ].slice(0, 10);

        return this.hydrateTicket(targetTicket);
      }, 'TICKET_CALLED', { ticketCode: calledTicketCode, service: service.name, desk });
    });
    });
  }

  /**
   * Atomic Claim of the oldest pending ticket.
   * If queue is empty, automatically generates and calls the next sequential number.
   */
  public async claimNextTicket(params: {
    service_id: string;
    professional_id: string;
    desk_info?: string;
  }): Promise<Ticket | null> {
    return this.callNextNumber(params);
  }

  /**
   * Re-call current ticket (VOLVER A LLAMAR)
   */
  public async recallTicket(params: {
    ticket_id: string;
    professional_id: string;
    desk_info?: string;
  }): Promise<Ticket> {
    return this.dispatchAction('recallTicket', params, async () => {
      return this.withLock(async () => {
      this.ensureSyncedState();
      const ticket = this.state.tickets.find((t) => t.id === params.ticket_id);
      if (!ticket) throw new Error('Turno no encontrado.');
      if (ticket.status !== 'LLAMADO') {
        throw new Error('Solo se puede volver a llamar un turno en estado LLAMADO.');
      }

      const service = this.state.services.find((s) => s.id === ticket.service_id);
      const now = new Date().toISOString();
      const desk = params.desk_info || ticket.desk_info || 'Módulo 1';

      return this.mutate((draft) => {
        const t = draft.tickets.find((item) => item.id === params.ticket_id)!;
        t.called_at = now;
        t.updated_at = now;
        t.desk_info = desk;

        draft.ticketEvents.unshift({
          id: 'te-' + Math.random().toString(36).substring(2, 11),
          ticket_id: t.id,
          event_type: 'RECALLED',
          previous_status: 'LLAMADO',
          new_status: 'LLAMADO',
          professional_id: params.professional_id,
          actor_id: params.professional_id,
          actor_name: service?.name || 'Servicio',
          details: `Re-llamado al turno ${t.ticket_code} en ${desk}`,
          created_at: now,
        });

        // Fresh ID with timestamp guarantees screen triggers chime and visual pulse
        const callToken = 'call-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
        const newCall: PublicCall = {
          id: callToken,
          ticket_id: t.id,
          ticket_code: t.ticket_code,
          service_name: service?.name || '',
          service_code: service?.code || '',
          desk_info: desk,
          called_at: now,
          status: 'LLAMADO',
        };

        draft.publicCalls = [
          newCall,
          ...draft.publicCalls.filter((c) => c.ticket_id !== t.id),
        ].slice(0, 10);

        return this.hydrateTicket(t);
      }, 'TICKET_RECALLED', { ticketCode: ticket.ticket_code, desk });
    });
    });
  }

  /**
   * Start Attention (INICIAR ATENCIÓN)
   */
  public async startAttention(params: {
    ticket_id: string;
    professional_id: string;
  }): Promise<Ticket> {
    return this.dispatchAction('startAttention', params, async () => {
      return this.withLock(async () => {
        const ticket = this.state.tickets.find((t) => t.id === params.ticket_id);
        if (!ticket) throw new Error('Turno no encontrado.');
        if (ticket.status !== 'LLAMADO') {
          throw new Error('Solo se puede iniciar atención de un turno que ha sido llamado.');
        }

        const professional = this.state.profiles.find((p) => p.id === params.professional_id);
        const now = new Date().toISOString();

        return this.mutate((draft) => {
          const t = draft.tickets.find((item) => item.id === params.ticket_id)!;
          t.status = 'EN_ATENCION';
          t.started_at = now;
          t.updated_at = now;

          draft.ticketEvents.unshift({
            id: 'te-' + Math.random().toString(36).substring(2, 11),
            ticket_id: t.id,
            event_type: 'STARTED',
            previous_status: 'LLAMADO',
            new_status: 'EN_ATENCION',
            professional_id: params.professional_id,
            actor_id: params.professional_id,
            actor_name: professional?.full_name || 'Profesional',
            details: 'Atención presencial iniciada',
            created_at: now,
          });

          // Update status in public calls list
          draft.publicCalls = draft.publicCalls.map((pc) =>
            pc.ticket_id === t.id ? { ...pc, status: 'EN_ATENCION' } : pc
          );

          return this.hydrateTicket(t);
        }, 'ATTENTION_STARTED', { ticketCode: ticket.ticket_code });
      });
    });
  }

  /**
   * Complete Attention (FINALIZAR ATENCIÓN)
   */
  public async completeAttention(params: {
    ticket_id: string;
    professional_id: string;
  }): Promise<Ticket> {
    return this.dispatchAction('completeAttention', params, async () => {
      return this.withLock(async () => {
        const ticket = this.state.tickets.find((t) => t.id === params.ticket_id);
        if (!ticket) throw new Error('Turno no encontrado.');
        if (ticket.status !== 'EN_ATENCION' && ticket.status !== 'LLAMADO') {
          throw new Error('Solo se puede finalizar un turno activo.');
        }

        const professional = this.state.profiles.find((p) => p.id === params.professional_id);
        const now = new Date().toISOString();

        return this.mutate((draft) => {
          const t = draft.tickets.find((item) => item.id === params.ticket_id)!;
          const prevStatus = t.status;
          t.status = 'ATENDIDO';
          t.completed_at = now;
          t.updated_at = now;

          const durationMinutes = t.started_at
            ? Math.max(1, Math.round((new Date(now).getTime() - new Date(t.started_at).getTime()) / 60000))
            : 0;

          draft.ticketEvents.unshift({
            id: 'te-' + Math.random().toString(36).substring(2, 11),
            ticket_id: t.id,
            event_type: 'COMPLETED',
            previous_status: prevStatus,
            new_status: 'ATENDIDO',
            professional_id: params.professional_id,
            actor_id: params.professional_id,
            actor_name: professional?.full_name || 'Profesional',
            details: `Atención concluida (${durationMinutes} min)`,
            created_at: now,
          });

          // Update publicCalls
          draft.publicCalls = draft.publicCalls.map((pc) =>
            pc.ticket_id === t.id ? { ...pc, status: 'ATENDIDO' } : pc
          );

          return this.hydrateTicket(t);
        }, 'ATTENTION_COMPLETED', { ticketCode: ticket.ticket_code });
      });
    });
  }

  /**
   * Mark as Absent (MARCAR AUSENTE)
   */
  public async markAbsent(params: {
    ticket_id: string;
    professional_id: string;
    reason?: string;
  }): Promise<Ticket> {
    return this.dispatchAction('markAbsent', params, async () => {
      return this.withLock(async () => {
        const ticket = this.state.tickets.find((t) => t.id === params.ticket_id);
        if (!ticket) throw new Error('Turno no encontrado.');
        if (ticket.status !== 'LLAMADO' && ticket.status !== 'PENDIENTE') {
          throw new Error('Solo se puede marcar ausente un turno pendiente o llamado.');
        }

        const professional = this.state.profiles.find((p) => p.id === params.professional_id);
        const now = new Date().toISOString();

        return this.mutate((draft) => {
          const t = draft.tickets.find((item) => item.id === params.ticket_id)!;
          const prev = t.status;
          t.status = 'AUSENTE';
          t.absence_at = now;
          t.updated_at = now;

          draft.ticketEvents.unshift({
            id: 'te-' + Math.random().toString(36).substring(2, 11),
            ticket_id: t.id,
            event_type: 'ABSENT',
            previous_status: prev,
            new_status: 'AUSENTE',
            professional_id: params.professional_id,
            actor_id: params.professional_id,
            actor_name: professional?.full_name || 'Profesional',
            details: params.reason ? `Marcado ausente: ${params.reason}` : 'No se presentó al llamado',
            created_at: now,
          });

          draft.publicCalls = draft.publicCalls.filter((pc) => pc.ticket_id !== t.id);

          return this.hydrateTicket(t);
        }, 'TICKET_ABSENT', { ticketCode: ticket.ticket_code });
      });
    });
  }

  /**
   * Cancel Ticket with required reason (Admin only)
   */
  public async cancelTicket(params: {
    ticket_id: string;
    actor_id: string;
    actor_name: string;
    reason: string;
  }): Promise<Ticket> {
    return this.dispatchAction('cancelTicket', params, async () => {
      return this.withLock(async () => {
        if (!params.reason.trim()) throw new Error('Se requiere especificar el motivo de cancelación.');
        const ticket = this.state.tickets.find((t) => t.id === params.ticket_id);
        if (!ticket) throw new Error('Turno no encontrado.');
        if (ticket.status === 'ATENDIDO' || ticket.status === 'CANCELADO') {
          throw new Error('No se puede cancelar un turno ya atendido o previamente cancelado.');
        }

        const now = new Date().toISOString();

        return this.mutate((draft) => {
          const t = draft.tickets.find((item) => item.id === params.ticket_id)!;
          const prev = t.status;
          t.status = 'CANCELADO';
          t.canceled_at = now;
          t.cancellation_reason = params.reason.trim();
          t.updated_at = now;

          draft.ticketEvents.unshift({
            id: 'te-' + Math.random().toString(36).substring(2, 11),
            ticket_id: t.id,
            event_type: 'CANCELED',
            previous_status: prev,
            new_status: 'CANCELADO',
            actor_id: params.actor_id,
            actor_name: params.actor_name,
            details: `Cancelado: ${params.reason.trim()}`,
            created_at: now,
          });

          draft.publicCalls = draft.publicCalls.filter((pc) => pc.ticket_id !== t.id);

          return this.hydrateTicket(t);
        }, 'TICKET_CANCELED', { ticketCode: ticket.ticket_code });
      });
    });
  }

  /**
   * Reopen / recover a ticket (Admin only)
   */
  public async reopenTicket(params: {
    ticket_id: string;
    actor_id: string;
    actor_name: string;
    reason: string;
  }): Promise<Ticket> {
    return this.dispatchAction('reopenTicket', params, async () => {
      return this.withLock(async () => {
        if (!params.reason.trim()) throw new Error('Se requiere un motivo para reabrir el turno.');
        const ticket = this.state.tickets.find((t) => t.id === params.ticket_id);
        if (!ticket) throw new Error('Turno no encontrado.');
        if (ticket.status !== 'AUSENTE' && ticket.status !== 'CANCELADO') {
          throw new Error('Solo se pueden reabrir turnos ausentes o cancelados.');
        }

        const now = new Date().toISOString();

        return this.mutate((draft) => {
          const t = draft.tickets.find((item) => item.id === params.ticket_id)!;
          const prev = t.status;
          t.status = 'PENDIENTE';
          t.assigned_professional_id = undefined;
          t.canceled_at = undefined;
          t.absence_at = undefined;
          t.cancellation_reason = undefined;
          t.updated_at = now;

          draft.ticketEvents.unshift({
            id: 'te-' + Math.random().toString(36).substring(2, 11),
            ticket_id: t.id,
            event_type: 'REOPENED',
            previous_status: prev,
            new_status: 'PENDIENTE',
            actor_id: params.actor_id,
            actor_name: params.actor_name,
            details: `Reabierto a cola pendiente: ${params.reason.trim()}`,
            created_at: now,
          });

          return this.hydrateTicket(t);
        }, 'TICKET_REOPENED', { ticketCode: ticket.ticket_code });
      });
    });
  }

  /**
   * Edit person info with traceability
   */
  public async updatePerson(params: {
    person_id: string;
    first_name: string;
    last_name: string;
    rut?: string;
    phone?: string;
    actor_id: string;
    actor_name: string;
  }): Promise<Person> {
    return this.withLock(async () => {
      const now = new Date().toISOString();
      return this.mutate((draft) => {
        const p = draft.people.find((person) => person.id === params.person_id);
        if (!p) throw new Error('Persona no encontrada.');

        const changes: string[] = [];
        if (p.first_name !== params.first_name) changes.push(`Nombre: ${p.first_name} -> ${params.first_name}`);
        if (p.last_name !== params.last_name) changes.push(`Apellido: ${p.last_name} -> ${params.last_name}`);
        if (p.rut !== params.rut) changes.push(`RUT actualizado`);
        if (p.phone !== params.phone) changes.push(`Teléfono actualizado`);

        p.first_name = params.first_name.trim();
        p.last_name = params.last_name.trim();
        p.rut = params.rut?.trim() || undefined;
        p.phone = params.phone?.trim() || undefined;
        p.updated_at = now;

        // Log edit event on all tickets associated with this person
        const relatedTickets = draft.tickets.filter((t) => t.person_id === p.id);
        for (const t of relatedTickets) {
          draft.ticketEvents.unshift({
            id: 'te-' + Math.random().toString(36).substring(2, 11),
            ticket_id: t.id,
            event_type: 'EDITED',
            actor_id: params.actor_id,
            actor_name: params.actor_name,
            details: `Datos personales editados: ${changes.join(', ') || 'Actualización'}`,
            created_at: now,
          });
        }

        return { ...p };
      }, 'PERSON_UPDATED', { personId: params.person_id });
    });
  }

  // -------------------------------------------------------------
  // Operational Management (Events, Services, Professionals)
  // -------------------------------------------------------------

  public setActiveEvent(eventId: string): void {
    if (typeof window !== 'undefined') {
      fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setActiveEvent', params: { eventId } }),
      }).catch((e) => console.warn('[Sync] setActiveEvent failed:', e));
    }
    const event = this.state.events.find((e) => e.id === eventId);
    if (!event) throw new Error('Operativo no encontrado.');
    this.mutate((draft) => {
      draft.activeEventId = eventId;
    }, 'ACTIVE_EVENT_CHANGED', { eventId });
  }

  public createEvent(name: string, event_date: string, actor_id: string): Event {
    const now = new Date().toISOString();
    const newEvent: Event = {
      id: 'ev-' + Math.random().toString(36).substring(2, 9),
      name: name.trim(),
      event_date,
      status: 'ACTIVO',
      created_at: now,
      created_by: actor_id,
    };
    if (typeof window !== 'undefined') {
      fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'createEvent', params: { name, event_date, actor_id } }),
      }).catch((e) => console.warn('[Sync] createEvent failed:', e));
    }
    return this.mutate((draft) => {
      draft.events.unshift(newEvent);
      draft.activeEventId = newEvent.id;
      return newEvent;
    }, 'EVENT_CREATED', { newEvent });
  }

  public toggleEventStatus(eventId: string, newStatus: 'ACTIVO' | 'FINALIZADO'): void {
    if (typeof window !== 'undefined') {
      fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggleEventStatus', params: { eventId, newStatus } }),
      }).catch((e) => console.warn('[Sync] toggleEventStatus failed:', e));
    }
    this.mutate((draft) => {
      const ev = draft.events.find((e) => e.id === eventId);
      if (ev) ev.status = newStatus;
    }, 'EVENT_STATUS_UPDATED', { eventId, newStatus });
  }

  public toggleService(serviceId: string, active: boolean): void {
    if (typeof window !== 'undefined') {
      fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggleService', params: { serviceId, active } }),
      }).catch((e) => console.warn('[Sync] toggleService failed:', e));
    }
    this.mutate((draft) => {
      const s = draft.services.find((item) => item.id === serviceId);
      if (s) s.active = active;
    }, 'SERVICE_STATUS_UPDATED', { serviceId, active });
  }

  public addProfessional(params: {
    email: string;
    full_name: string;
    role: 'ADMIN' | 'PROFESSIONAL';
    desk_number?: string;
    service_ids: string[];
  }): Profile {
    const now = new Date().toISOString();
    const existing = this.state.profiles.find((p) => p.email.toLowerCase() === params.email.toLowerCase());
    if (existing) throw new Error('Ya existe un usuario con este correo electrónico.');

    const newProfile: Profile = {
      id: 'usr-' + Math.random().toString(36).substring(2, 9),
      email: params.email.trim().toLowerCase(),
      full_name: params.full_name.trim(),
      role: params.role,
      active: true,
      desk_number: params.desk_number?.trim() || undefined,
      created_at: now,
      updated_at: now,
    };

    const newAssignments: ProfessionalService[] = params.service_ids.map((srvId) => ({
      id: 'ps-' + Math.random().toString(36).substring(2, 9),
      professional_id: newProfile.id,
      service_id: srvId,
      active: true,
      created_at: now,
    }));

    return this.mutate((draft) => {
      draft.profiles.push(newProfile);
      draft.professionalServices.push(...newAssignments);
      return newProfile;
    }, 'PROFILE_CREATED', { newProfile });
  }

  public updateProfessionalAssignments(professionalId: string, serviceIds: string[], deskNumber?: string): void {
    if (typeof window !== 'undefined') {
      fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateProfessionalAssignments', params: { professionalId, serviceIds, deskNumber } }),
      }).catch((e) => console.warn('[Sync] updateProfessionalAssignments failed:', e));
    }
    const now = new Date().toISOString();
    this.mutate((draft) => {
      const prof = draft.profiles.find((p) => p.id === professionalId);
      if (prof && deskNumber !== undefined) {
        prof.desk_number = deskNumber;
        prof.updated_at = now;
      }

      // Remove old assignments
      draft.professionalServices = draft.professionalServices.filter((ps) => ps.professional_id !== professionalId);
      // Add new assignments
      for (const srvId of serviceIds) {
        draft.professionalServices.push({
          id: 'ps-' + Math.random().toString(36).substring(2, 9),
          professional_id: professionalId,
          service_id: srvId,
          active: true,
          created_at: now,
        });
      }
    }, 'ASSIGNMENTS_UPDATED', { professionalId, serviceIds });
  }

  public toggleProfileActive(profileId: string, active: boolean): void {
    if (typeof window !== 'undefined') {
      fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggleProfileActive', params: { profileId, active } }),
      }).catch((e) => console.warn('[Sync] toggleProfileActive failed:', e));
    }
    this.mutate((draft) => {
      const p = draft.profiles.find((item) => item.id === profileId);
      if (p) {
        p.active = active;
        p.updated_at = new Date().toISOString();
      }
    }, 'PROFILE_ACTIVE_TOGGLED', { profileId, active });
  }

  public resetToInitialSeed(): void {
    const fresh = generateInitialSeedState();
    this.state = fresh;
    this.saveStateToStorage(fresh);
    this.notifyListeners('DATABASE_RESET');
    if (this.channel) {
      this.channel.postMessage({ type: 'DATABASE_RESET' });
    }
  }

  public async resetAllTicketsToZero(): Promise<void> {
    return this.dispatchAction('resetAllTicketsToZero', {}, async () => {
      return this.withLock(async () => {
        this.ensureSyncedState();
        const activeEvent = this.getActiveEvent();
        const eventId = activeEvent?.id || 'ev-central-2026';
        const now = new Date().toISOString();

        return this.mutate((draft) => {
          draft.tickets = [];
          draft.publicCalls = [];
          draft.ticketEvents = [];
          draft.serviceCounters = draft.services.map((s) => ({
            id: 'sc-' + s.code.toLowerCase(),
            event_id: eventId,
            service_id: s.id,
            last_number: 0,
            updated_at: now,
          }));
        }, 'TICKETS_RESET_TO_ZERO');
      });
    });
  }
}

export const storageEngine = new ReactiveStorageEngine();
