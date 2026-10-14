# TurnoSocial: Sistema de Gestión de Turnos para Operativo Social

Sistema web completo, seguro y reactivo en tiempo real para administrar los turnos de un operativo social con ocho servicios profesionales simultáneos, panel centralizado de administración, puesto de trabajo ergonómico para profesionales y pantalla pública de llamados para monitores o proyectores.

---

## 1. Arquitectura y Tecnologías
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, React Router v7.
- **Base de Datos y Backend:** 
  - **Modo Supabase Cloud:** PostgreSQL con Row Level Security (RLS), función transaccional `claim_next_ticket` con `SELECT ... FOR UPDATE SKIP LOCKED` para concurrencia garantizada, contadores por servicio y operativo, y Supabase Realtime.
  - **Modo Standalone Reactivo:** Motor transaccional local persistente en navegador con `BroadcastChannel` para sincronización en tiempo real entre pestañas (Pantalla TV, Administrador y Profesionales), soporte fuera de línea y datos semilla listos para evaluación.
- **Audio:** Sintetizador Web Audio API nativo con campana armónica de dos tonos para anuncios de turnos sin dependencias de archivos externos.

---

## 2. Los 8 Servicios Oficiales y sus Prefijos
1. **Fonoaudiología** (`FON`)
2. **Psicología** (`PSI`)
3. **Asistente social** (`ASO`)
4. **Enfermería** (`ENF`)
5. **Asesoría jurídica** (`JUR`)
6. **Veterinaria** (`VET`)
7. **Kinesiología** (`KIN`)
8. **Barbería** (`BAR`)

Cada servicio cuenta con su propia cola de espera, numeración secuencial independiente por operativo (`FON-001`, `PSI-001`, etc.) y control de profesionales autorizados.

---

## 3. Cuentas de Acceso Rápido para Pruebas (Demo)
El sistema incluye cuentas preconfiguradas con botón de 1-clic en la pantalla de inicio de sesión (`/login`):

| Rol | Correo Electrónico | Contraseña | Módulo Inicial |
| :--- | :--- | :--- | :--- |
| **Administrador General** | `admin@operativo.cl` | `admin123` | Control Room |
| **Psicología** | `psicologia@operativo.cl` | `pro123` | Box 1 |
| **Enfermería** | `enfermeria@operativo.cl` | `pro123` | Box 2 |
| **Asistente Social** | `social@operativo.cl` | `pro123` | Módulo A |
| **Fonoaudiología** | `fono@operativo.cl` | `pro123` | Box 3 |
| **Asesoría Jurídica** | `juridico@operativo.cl` | `pro123` | Módulo B |
| **Veterinaria** | `veterinaria@operativo.cl` | `pro123` | Área Canina |
| **Kinesiología** | `kine@operativo.cl` | `pro123` | Box 4 |
| **Barbería** | `barberia@operativo.cl` | `pro123` | Sillón 1 |

---

## 4. Guía de Ejecución Local en Windows

### Requisitos Previos:
- Node.js versión 18 o superior instalado ([nodejs.org](https://nodejs.org/)).
- Git para Windows (opcional).

### Pasos en Símbolo del Sistema (CMD) o PowerShell:
```bash
# 1. Clonar o navegar al directorio del proyecto:
cd turno-social

# 2. Instalar las dependencias de Node:
npm install

# 3. Copiar archivo de entorno:
copy .env.example .env

# 4. Iniciar en modo desarrollo:
npm run dev
```

La aplicación abrirá en `http://localhost:3000`.

---

## 5. Configuración de Supabase Cloud

1. Crea un proyecto en [Supabase](https://supabase.com/).
2. Dirígete a **SQL Editor** en el panel de Supabase.
3. Abre el archivo local `supabase/migrations/20261013000000_operativo_turnos.sql`, copia su contenido y ejecútalo en el editor SQL de Supabase.
4. Abre `supabase/seed.sql` y ejecútalo para cargar los 8 servicios oficiales y el operativo inicial.
5. Obtén tus credenciales en **Project Settings > API**:
   - `Project URL`
   - `anon public key`
6. Agrégalas a tu archivo `.env`:
   ```env
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu_clave_anonima_publica
   ```
7. En el menú superior de la aplicación, haz clic en el botón de base de datos para ingresar o verificar la conexión en tiempo real.

---

## 6. Lista de Comprobación de Seguridad (Security Checklist)
- [x] **Row Level Security (RLS)** habilitado en todas las tablas sensibles.
- [x] **Pantalla Pública de Lectura Exclusiva:** Sin exposición de nombres de personas, RUT, teléfonos ni notas clínicas o jurídicas.
- [x] **Transacciones Atómicas:** Bloqueo `FOR UPDATE SKIP LOCKED` para impedir que dos profesionales reclamen el mismo turno en colas concurrentes.
- [x] **Trazabilidad Inmutable:** Cada transición (creación, llamado, re-llamado, atención, conclusión, ausencia, cancelación, reapertura) queda registrada en `ticket_events`.
- [x] **Cancelación Protegida:** Requiere motivo obligatorio registrado en auditoría.
