import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { EventProvider } from './context/EventContext';

// Layouts & Pages
import { AdminLayout } from './components/layout/AdminLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { PublicDisplayPage } from './pages/public/PublicDisplayPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { TicketRegistrationPage } from './pages/admin/TicketRegistrationPage';
import { TicketsManagementPage } from './pages/admin/TicketsManagementPage';
import { ServicesManagementPage } from './pages/admin/ServicesManagementPage';
import { ProfessionalsManagementPage } from './pages/admin/ProfessionalsManagementPage';
import { EventsManagementPage } from './pages/admin/EventsManagementPage';
import { ReportsPage } from './pages/admin/ReportsPage';
import { AuditLogPage } from './pages/admin/AuditLogPage';
import { ProfessionalDashboard } from './pages/professional/ProfessionalDashboard';
import { TicketDispenserPage } from './pages/totem/TicketDispenserPage';

// Guard for root redirection
const RootRedirect: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'ADMIN') {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/profesional" replace />;
};

// Guard for professional workstation
const ProtectedProfessionalRoute: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <ProfessionalDashboard />;
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <EventProvider>
          <Routes>
            {/* Public Display Screen (Standalone, no auth required) */}
            <Route path="/pantalla" element={<PublicDisplayPage />} />

            {/* Auth */}
            <Route path="/login" element={<LoginPage />} />

            {/* Admin Backoffice */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="registro" element={<Navigate to="/admin/turnos" replace />} />
              <Route path="turnos" element={<TicketsManagementPage />} />
              <Route path="servicios" element={<ServicesManagementPage />} />
              <Route path="profesionales" element={<ProfessionalsManagementPage />} />
              <Route path="operativos" element={<EventsManagementPage />} />
              <Route path="reportes" element={<ReportsPage />} />
              <Route path="auditoria" element={<AuditLogPage />} />
            </Route>

            {/* Professional Workstation */}
            <Route path="/profesional" element={<ProtectedProfessionalRoute />} />

            {/* Root redirect */}
            <Route path="/" element={<RootRedirect />} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </EventProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
