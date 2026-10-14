import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  UserPlus,
  Ticket as TicketIcon,
  Stethoscope,
  Users,
  Calendar,
  BarChart3,
  History,
  Tv,
  X
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const navItems = [
    { to: '/admin', label: 'Resumen General', icon: LayoutDashboard, end: true },
    { to: '/admin/turnos', label: 'Gestión de Turnos', icon: TicketIcon },
    { to: '/admin/servicios', label: 'Servicios (8)', icon: Stethoscope },
    { to: '/admin/profesionales', label: 'Puestos de Profesiones', icon: Users },
    { to: '/admin/operativos', label: 'Operativos', icon: Calendar },
    { to: '/admin/reportes', label: 'Estadísticas e Informes', icon: BarChart3 },
    { to: '/admin/auditoria', label: 'Auditoría y Trazabilidad', icon: History },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 transition-transform duration-200 ease-in-out border-r border-slate-800 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Mobile close button */}
          <div className="flex items-center justify-between p-4 border-b border-slate-800 lg:hidden">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Menú Principal</span>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Links list */}
          <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            <p className="px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Administración Central
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => onClose()}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>

          {/* Bottom TV display callout */}
          <div className="p-3 border-t border-slate-800">
            <NavLink
              to="/pantalla"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-indigo-300 bg-indigo-950/60 border border-indigo-800/50 hover:bg-indigo-900/80 rounded-lg transition"
            >
              <Tv className="w-4 h-4 text-indigo-400 shrink-0" />
              <div>
                <p className="leading-tight">Pantalla Pública TV</p>
                <p className="text-[10px] text-slate-400 font-normal">Para proyectores y salas</p>
              </div>
            </NavLink>
          </div>
        </div>
      </aside>
    </>
  );
};
