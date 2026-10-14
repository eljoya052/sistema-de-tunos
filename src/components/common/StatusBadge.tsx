import React from 'react';
import { TicketStatus } from '../../types/database';
import { Clock, Bell, UserCheck, CheckCircle2, UserX, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: TicketStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
}) => {
  const config: Record<
    TicketStatus,
    { label: string; icon: React.ReactNode; bg: string; text: string; border: string }
  > = {
    PENDIENTE: {
      label: 'Pendiente',
      icon: <Clock className="w-3.5 h-3.5" />,
      bg: 'bg-amber-50',
      text: 'text-amber-800 font-medium',
      border: 'border-amber-200',
    },
    LLAMADO: {
      label: 'Llamado',
      icon: <Bell className="w-3.5 h-3.5 animate-pulse" />,
      bg: 'bg-blue-50',
      text: 'text-blue-800 font-semibold',
      border: 'border-blue-300',
    },
    EN_ATENCION: {
      label: 'En Atención',
      icon: <UserCheck className="w-3.5 h-3.5" />,
      bg: 'bg-emerald-50',
      text: 'text-emerald-800 font-semibold',
      border: 'border-emerald-300',
    },
    ATENDIDO: {
      label: 'Atendido',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      bg: 'bg-slate-100',
      text: 'text-slate-700 font-medium',
      border: 'border-slate-200',
    },
    AUSENTE: {
      label: 'Ausente',
      icon: <UserX className="w-3.5 h-3.5" />,
      bg: 'bg-rose-50',
      text: 'text-rose-700 font-medium',
      border: 'border-rose-200',
    },
    CANCELADO: {
      label: 'Cancelado',
      icon: <XCircle className="w-3.5 h-3.5" />,
      bg: 'bg-zinc-100',
      text: 'text-zinc-600 font-medium',
      border: 'border-zinc-200',
    },
  };

  const current = config[status] || config.PENDIENTE;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-medium',
  };

  return (
    <span
      className={`inline-flex items-center rounded border ${current.bg} ${current.text} ${current.border} ${sizeClasses[size]}`}
    >
      {showIcon && current.icon}
      <span>{current.label}</span>
    </span>
  );
};
