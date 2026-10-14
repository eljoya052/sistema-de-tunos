export type UserRole = 'ADMIN' | 'PROFESSIONAL';

export type TicketStatus = 
  | 'PENDIENTE' 
  | 'LLAMADO' 
  | 'EN_ATENCION' 
  | 'ATENDIDO' 
  | 'AUSENTE' 
  | 'CANCELADO';

export type EventStatus = 'PROGRAMADO' | 'ACTIVO' | 'FINALIZADO';

export interface Event {
  id: string;
  name: string;
  event_date: string;
  status: EventStatus;
  created_at: string;
  created_by?: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  active: boolean;
  desk_number?: string;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  name: string;
  code: string; // e.g. 'FON', 'PSI', 'ASO'
  active: boolean;
  description?: string;
  created_at: string;
}

export interface ProfessionalService {
  id: string;
  professional_id: string;
  service_id: string;
  active: boolean;
  created_at: string;
}

export interface Person {
  id: string;
  first_name: string;
  last_name: string;
  rut?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface Ticket {
  id: string;
  event_id: string;
  person_id?: string;
  service_id: string;
  ticket_number: number;
  ticket_code: string; // e.g. 'PSI-001'
  status: TicketStatus;
  assigned_professional_id?: string;
  desk_info?: string; // e.g. 'Módulo 2'
  notes?: string; // Observaciones administrativas generales
  created_at: string;
  called_at?: string;
  started_at?: string;
  completed_at?: string;
  canceled_at?: string;
  absence_at?: string;
  cancellation_reason?: string;
  created_by?: string;
  updated_at: string;
  // Hydrated joins
  person?: Person;
  service?: Service;
  assigned_professional?: Profile;
}

export interface TicketEvent {
  id: string;
  ticket_id: string;
  event_type: 
    | 'CREATED' 
    | 'CALLED' 
    | 'RECALLED' 
    | 'STARTED' 
    | 'COMPLETED' 
    | 'ABSENT' 
    | 'CANCELED' 
    | 'REOPENED' 
    | 'EDITED';
  previous_status?: TicketStatus;
  new_status?: TicketStatus;
  professional_id?: string;
  actor_id: string;
  actor_name?: string;
  details?: string;
  created_at: string;
}

export interface ServiceCounter {
  id: string;
  event_id: string;
  service_id: string;
  last_number: number;
  updated_at: string;
}

export interface PublicCall {
  id: string;
  ticket_id: string;
  ticket_code: string;
  service_name: string;
  service_code: string;
  desk_info?: string;
  called_at: string;
  status: TicketStatus;
}
