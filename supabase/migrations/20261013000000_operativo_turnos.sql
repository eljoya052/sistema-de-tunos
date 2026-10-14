-- ========================================================================
-- SISTEMA DE GESTIÓN DE TURNOS PARA UN OPERATIVO SOCIAL (POSTGRESQL / SUPABASE)
-- Migración oficial versionada: 20261013000000_operativo_turnos.sql
-- ========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUMS Y TIPOS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('ADMIN', 'PROFESSIONAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ticket_status AS ENUM (
        'PENDIENTE',
        'LLAMADO',
        'EN_ATENCION',
        'ATENDIDO',
        'AUSENTE',
        'CANCELADO'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE event_status AS ENUM ('PROGRAMADO', 'ACTIVO', 'FINALIZADO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. TABLAS PRINCIPALES

-- 2.1 events (Operativos Sociales)
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    event_date DATE NOT NULL,
    status event_status NOT NULL DEFAULT 'ACTIVO',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 2.2 profiles (Perfiles vinculados a Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'PROFESSIONAL',
    active BOOLEAN NOT NULL DEFAULT true,
    desk_number TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.3 services (Los 8 servicios obligatorios con prefijos únicos)
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL,
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.4 professional_services (Relación muchos-a-muchos)
CREATE TABLE IF NOT EXISTS public.professional_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_prof_service UNIQUE(professional_id, service_id)
);

-- 2.5 people (Asistentes al operativo social)
CREATE TABLE IF NOT EXISTS public.people (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    rut TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- 2.6 service_counters (Contador transaccional independiente por operativo y servicio)
CREATE TABLE IF NOT EXISTS public.service_counters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    last_number INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_event_service_counter UNIQUE(event_id, service_id)
);

-- 2.7 tickets (Turnos del operativo)
CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE RESTRICT,
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
    ticket_number INTEGER NOT NULL,
    ticket_code VARCHAR(20) NOT NULL,
    status ticket_status NOT NULL DEFAULT 'PENDIENTE',
    assigned_professional_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    desk_info TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    called_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    canceled_at TIMESTAMPTZ,
    absence_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_event_service_ticket UNIQUE(event_id, service_id, ticket_number)
);

-- 2.8 ticket_events (Auditoría inmutable de eventos de atención)
CREATE TABLE IF NOT EXISTS public.ticket_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    previous_status ticket_status,
    new_status ticket_status,
    professional_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_name TEXT,
    details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.9 public_calls (Tabla para visualización de pantalla pública sin datos personales)
CREATE TABLE IF NOT EXISTS public.public_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID UNIQUE NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    ticket_code VARCHAR(20) NOT NULL,
    service_name TEXT NOT NULL,
    service_code VARCHAR(10) NOT NULL,
    desk_info TEXT,
    called_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    status ticket_status NOT NULL
);

-- 3. ÍNDICES DE RENDIMIENTO Y CONCURRENCIA
CREATE INDEX IF NOT EXISTS idx_tickets_pending ON public.tickets (event_id, service_id, status, ticket_number) 
WHERE status = 'PENDIENTE';

CREATE INDEX IF NOT EXISTS idx_tickets_person ON public.tickets (person_id);
CREATE INDEX IF NOT EXISTS idx_ticket_events_ticket ON public.ticket_events (ticket_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_public_calls_called_at ON public.public_calls (called_at DESC);

-- 4. FUNCIONES TRANSACCIONALES CON ATOMICIDAD Y LOCKS (SKIP LOCKED)

-- 4.1 Generar turno secuencial seguro por operativo y servicio
CREATE OR REPLACE FUNCTION public.generate_ticket(
    p_event_id UUID,
    p_person_id UUID,
    p_service_id UUID,
    p_notes TEXT DEFAULT NULL,
    p_actor_id UUID DEFAULT NULL
)
RETURNS public.tickets
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_service public.services%ROWTYPE;
    v_event public.events%ROWTYPE;
    v_next_num INTEGER;
    v_code VARCHAR(20);
    v_new_ticket public.tickets%ROWTYPE;
    v_actor_name TEXT;
BEGIN
    SELECT * INTO v_event FROM public.events WHERE id = p_event_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Operativo no encontrado';
    END IF;
    IF v_event.status = 'FINALIZADO' THEN
        RAISE EXCEPTION 'No se pueden generar turnos en un operativo cerrado';
    END IF;

    SELECT * INTO v_service FROM public.services WHERE id = p_service_id;
    IF NOT FOUND OR NOT v_service.active THEN
        RAISE EXCEPTION 'Servicio no existe o está inactivo';
    END IF;

    -- Bloqueo atómico del contador para evitar duplicados en concurrencia
    INSERT INTO public.service_counters (event_id, service_id, last_number, updated_at)
    VALUES (p_event_id, p_service_id, 1, timezone('utc'::text, now()))
    ON CONFLICT (event_id, service_id)
    DO UPDATE SET 
        last_number = public.service_counters.last_number + 1,
        updated_at = timezone('utc'::text, now())
    RETURNING last_number INTO v_next_num;

    v_code := v_service.code || '-' || LPAD(v_next_num::TEXT, 3, '0');

    -- Insertar turno
    INSERT INTO public.tickets (
        event_id, person_id, service_id, ticket_number, ticket_code,
        status, notes, created_by, created_at, updated_at
    )
    VALUES (
        p_event_id, p_person_id, p_service_id, v_next_num, v_code,
        'PENDIENTE', p_notes, p_actor_id, timezone('utc'::text, now()), timezone('utc'::text, now())
    )
    RETURNING * INTO v_new_ticket;

    SELECT full_name INTO v_actor_name FROM public.profiles WHERE id = p_actor_id;

    -- Auditoría
    INSERT INTO public.ticket_events (
        ticket_id, event_type, new_status, actor_id, actor_name, details
    )
    VALUES (
        v_new_ticket.id, 'CREATED', 'PENDIENTE', p_actor_id, COALESCE(v_actor_name, 'Sistema'),
        'Turno generado: ' || v_code
    );

    RETURN v_new_ticket;
END;
$$;

-- 4.2 Reclamar el siguiente turno pendiente de forma atómica (SKIP LOCKED)
CREATE OR REPLACE FUNCTION public.claim_next_ticket(
    p_service_id UUID,
    p_professional_id UUID,
    p_desk_info TEXT DEFAULT NULL
)
RETURNS public.tickets
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_ticket_id UUID;
    v_claimed_ticket public.tickets%ROWTYPE;
    v_prof public.profiles%ROWTYPE;
    v_service public.services%ROWTYPE;
    v_active_event_id UUID;
    v_desk TEXT;
BEGIN
    SELECT * INTO v_prof FROM public.profiles WHERE id = p_professional_id;
    IF NOT FOUND OR NOT v_prof.active THEN
        RAISE EXCEPTION 'Profesional no encontrado o inactivo';
    END IF;

    SELECT * INTO v_service FROM public.services WHERE id = p_service_id;
    IF NOT FOUND OR NOT v_service.active THEN
        RAISE EXCEPTION 'Servicio no activo';
    END IF;

    -- Validar que el profesional esté asignado al servicio
    IF v_prof.role <> 'ADMIN' AND NOT EXISTS (
        SELECT 1 FROM public.professional_services 
        WHERE professional_id = p_professional_id AND service_id = p_service_id AND active = true
    ) THEN
        RAISE EXCEPTION 'El profesional no está asignado a este servicio';
    END IF;

    -- Verificar que no tenga atención en curso
    IF EXISTS (
        SELECT 1 FROM public.tickets 
        WHERE service_id = p_service_id AND assigned_professional_id = p_professional_id AND status = 'EN_ATENCION'
    ) THEN
        RAISE EXCEPTION 'Ya tiene una atención en curso. Debe finalizarla primero.';
    END IF;

    -- Obtener operativo activo
    SELECT id INTO v_active_event_id FROM public.events WHERE status = 'ACTIVO' ORDER BY created_at DESC LIMIT 1;
    IF v_active_event_id IS NULL THEN
        RAISE EXCEPTION 'No hay un operativo activo';
    END IF;

    v_desk := COALESCE(p_desk_info, v_prof.desk_number, 'Módulo 1');

    -- Bloqueo atómico del turno más antiguo: SELECT ... FOR UPDATE SKIP LOCKED
    SELECT id INTO v_ticket_id
    FROM public.tickets
    WHERE event_id = v_active_event_id
      AND service_id = p_service_id
      AND status = 'PENDIENTE'
    ORDER BY ticket_number ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    IF v_ticket_id IS NULL THEN
        RETURN NULL; -- No hay pendientes en cola
    END IF;

    UPDATE public.tickets
    SET status = 'LLAMADO',
        assigned_professional_id = p_professional_id,
        desk_info = v_desk,
        called_at = timezone('utc'::text, now()),
        updated_at = timezone('utc'::text, now())
    WHERE id = v_ticket_id
    RETURNING * INTO v_claimed_ticket;

    -- Auditoría
    INSERT INTO public.ticket_events (
        ticket_id, event_type, previous_status, new_status,
        professional_id, actor_id, actor_name, details
    )
    VALUES (
        v_claimed_ticket.id, 'CALLED', 'PENDIENTE', 'LLAMADO',
        p_professional_id, p_professional_id, v_prof.full_name, 'Llamado a ' || v_desk
    );

    -- Publicar en pantalla
    INSERT INTO public.public_calls (
        ticket_id, ticket_code, service_name, service_code, desk_info, called_at, status
    )
    VALUES (
        v_claimed_ticket.id, v_claimed_ticket.ticket_code, v_service.name, v_service.code,
        v_desk, timezone('utc'::text, now()), 'LLAMADO'
    )
    ON CONFLICT (ticket_id) DO UPDATE SET
        called_at = timezone('utc'::text, now()),
        desk_info = v_desk,
        status = 'LLAMADO';

    RETURN v_claimed_ticket;
END;
$$;

-- 5. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_calls ENABLE ROW LEVEL SECURITY;

-- Pantalla pública: lectura anónima autorizada
CREATE POLICY "Public Read for Public Calls"
ON public.public_calls FOR SELECT
TO anon, authenticated
USING (true);

-- Eventos: lectura para autenticados y anónimos (para nombre y fecha del operativo en TV)
CREATE POLICY "Read Events"
ON public.events FOR SELECT
TO anon, authenticated
USING (true);

-- Servicios: lectura pública para pantallas y profesionales
CREATE POLICY "Read Services"
ON public.services FOR SELECT
TO anon, authenticated
USING (true);

-- Perfiles: solo autenticados leen perfiles
CREATE POLICY "Authenticated Read Profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- Tickets: solo usuarios autenticados leen tickets
CREATE POLICY "Authenticated Read Tickets"
ON public.tickets FOR SELECT
TO authenticated
USING (true);

-- Auditoría: solo lectura para autenticados
CREATE POLICY "Authenticated Read Events Log"
ON public.ticket_events FOR SELECT
TO authenticated
USING (true);
