-- ========================================================================
-- SEMILLA INICIAL: 8 SERVICIOS Y DATOS REPRODUCIBLES
-- ========================================================================

-- Insertar los 8 servicios obligatorios con sus prefijos exactos
INSERT INTO public.services (id, name, code, description, active)
VALUES
    ('c1111111-1111-4111-a111-111111111111', 'Fonoaudiología', 'FON', 'Evaluación y terapia vocal, auditiva y del habla', true),
    ('c2222222-2222-4222-a222-222222222222', 'Psicología', 'PSI', 'Contención emocional, orientación y salud mental', true),
    ('c3333333-3333-4333-a333-333333333333', 'Asistente social', 'ASO', 'Orientación en beneficios estatales, ficha social y subsidios', true),
    ('c4444444-4444-4444-a444-444444444444', 'Enfermería', 'ENF', 'Toma de presión, glicemia, curaciones y triage preventivo', true),
    ('c5555555-5555-4555-a555-555555555555', 'Asesoría jurídica', 'JUR', 'Orientación legal familiar, laboral y civil', true),
    ('c6666666-6666-4666-a666-666666666666', 'Veterinaria', 'VET', 'Atención primaria de mascotas, vacunación y desparasitación', true),
    ('c7777777-7777-4777-a777-777777777777', 'Kinesiología', 'KIN', 'Evaluación musculoesquelética, ergonomía y movilidad', true),
    ('c8888888-8888-4888-a888-888888888888', 'Barbería', 'BAR', 'Cortes de cabello y cuidado personal comunitario', true)
ON CONFLICT (code) DO NOTHING;

-- Crear operativo inicial activo
INSERT INTO public.events (id, name, event_date, status)
VALUES (
    'e0000000-0000-4000-a000-000000000001',
    'Operativo Social Comunitario 2026 - Plaza Central',
    CURRENT_DATE,
    'ACTIVO'
)
ON CONFLICT (id) DO NOTHING;
