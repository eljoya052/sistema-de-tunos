import { storageEngine } from './storage-engine';
import { isSupabaseConfigured, supabase } from './supabase';
import {
  Event,
  Profile,
  Service,
  Person,
  Ticket,
  TicketEvent,
  PublicCall,
  TicketStatus
} from '../types/database';

export const repository = {
  isUsingCloudSupabase(): boolean {
    return isSupabaseConfigured && supabase !== null;
  },

  async getActiveEvent(): Promise<Event | null> {
    return storageEngine.getActiveEvent();
  },

  async getEvents(): Promise<Event[]> {
    return storageEngine.getEvents();
  },

  async setActiveEvent(eventId: string): Promise<void> {
    storageEngine.setActiveEvent(eventId);
  },

  async createEvent(name: string, event_date: string, actor_id: string): Promise<Event> {
    return storageEngine.createEvent(name, event_date, actor_id);
  },

  async toggleEventStatus(eventId: string, newStatus: 'ACTIVO' | 'FINALIZADO'): Promise<void> {
    storageEngine.toggleEventStatus(eventId, newStatus);
  },

  async getServices(onlyActive = false): Promise<Service[]> {
    return storageEngine.getServices(onlyActive);
  },

  async toggleService(serviceId: string, active: boolean): Promise<void> {
    storageEngine.toggleService(serviceId, active);
  },

  async getProfiles(): Promise<Profile[]> {
    return storageEngine.getProfiles();
  },

  async getProfileById(id: string): Promise<Profile | undefined> {
    return storageEngine.getProfileById(id);
  },

  async getProfileByEmail(email: string): Promise<Profile | undefined> {
    return storageEngine.getProfileByEmail(email);
  },

  async getProfessionalServices(professionalId: string): Promise<Service[]> {
    return storageEngine.getProfessionalServices(professionalId);
  },

  async addProfessional(params: {
    email: string;
    full_name: string;
    role: 'ADMIN' | 'PROFESSIONAL';
    desk_number?: string;
    service_ids: string[];
  }): Promise<Profile> {
    return storageEngine.addProfessional(params);
  },

  async updateProfessionalAssignments(professionalId: string, serviceIds: string[], deskNumber?: string): Promise<void> {
    storageEngine.updateProfessionalAssignments(professionalId, serviceIds, deskNumber);
  },

  async toggleProfileActive(profileId: string, active: boolean): Promise<void> {
    storageEngine.toggleProfileActive(profileId, active);
  },

  async getPeople(): Promise<Person[]> {
    return storageEngine.getPeople();
  },

  async getPersonById(id: string): Promise<Person | undefined> {
    return storageEngine.getPersonById(id);
  },

  async getTickets(filter?: {
    eventId?: string;
    serviceId?: string;
    status?: TicketStatus | 'ALL';
    professionalId?: string;
  }): Promise<Ticket[]> {
    return storageEngine.getTickets(filter);
  },

  async getTicketById(id: string): Promise<Ticket | null> {
    return storageEngine.getTicketById(id);
  },

  async getPublicCalls(): Promise<PublicCall[]> {
    return storageEngine.getPublicCalls();
  },

  async getTicketEvents(ticketId?: string): Promise<TicketEvent[]> {
    return storageEngine.getTicketEvents(ticketId);
  },

  async createPersonWithTickets(params: {
    first_name: string;
    last_name: string;
    rut?: string;
    phone?: string;
    service_ids: string[];
    actor_id: string;
    actor_name: string;
    notes?: string;
  }): Promise<{ person: Person; tickets: Ticket[] }> {
    return storageEngine.createPersonWithTickets(params);
  },

  async issueTicketForService(params: {
    service_id: string;
    notes?: string;
  }): Promise<Ticket> {
    return storageEngine.issueTicketForService(params);
  },

  async callNextNumber(params: {
    service_id: string;
    professional_id: string;
    desk_info?: string;
  }): Promise<Ticket> {
    return storageEngine.callNextNumber(params);
  },

  async claimNextTicket(params: {
    service_id: string;
    professional_id: string;
    desk_info?: string;
  }): Promise<Ticket | null> {
    return storageEngine.claimNextTicket(params);
  },

  async recallTicket(params: {
    ticket_id: string;
    professional_id: string;
    desk_info?: string;
  }): Promise<Ticket> {
    return storageEngine.recallTicket(params);
  },

  async startAttention(params: {
    ticket_id: string;
    professional_id: string;
  }): Promise<Ticket> {
    return storageEngine.startAttention(params);
  },

  async completeAttention(params: {
    ticket_id: string;
    professional_id: string;
  }): Promise<Ticket> {
    return storageEngine.completeAttention(params);
  },

  async markAbsent(params: {
    ticket_id: string;
    professional_id: string;
    reason?: string;
  }): Promise<Ticket> {
    return storageEngine.markAbsent(params);
  },

  async cancelTicket(params: {
    ticket_id: string;
    actor_id: string;
    actor_name: string;
    reason: string;
  }): Promise<Ticket> {
    return storageEngine.cancelTicket(params);
  },

  async reopenTicket(params: {
    ticket_id: string;
    actor_id: string;
    actor_name: string;
    reason: string;
  }): Promise<Ticket> {
    return storageEngine.reopenTicket(params);
  },

  async updatePerson(params: {
    person_id: string;
    first_name: string;
    last_name: string;
    rut?: string;
    phone?: string;
    actor_id: string;
    actor_name: string;
  }): Promise<Person> {
    return storageEngine.updatePerson(params);
  },

  subscribeRealtime(callback: (event: { type: string; payload?: unknown }) => void): () => void {
    return storageEngine.subscribe(callback);
  },

  resetDatabase(): void {
    storageEngine.resetToInitialSeed();
  },

  async resetAllTicketsToZero(): Promise<void> {
    return storageEngine.resetAllTicketsToZero();
  }
};
