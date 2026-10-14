import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  requireInput?: boolean;
  inputPlaceholder?: string;
  inputLabel?: string;
  inputValue?: string;
  onInputChange?: (value: string) => void;
  onConfirm: () => void;
  onClose: () => void;
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  requireInput = false,
  inputPlaceholder = '',
  inputLabel = 'Motivo obligatorio',
  inputValue = '',
  onInputChange,
  onConfirm,
  onClose,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      button: 'bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500',
      iconBg: 'bg-rose-100 text-rose-600',
    },
    warning: {
      button: 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500',
      iconBg: 'bg-amber-100 text-amber-600',
    },
    primary: {
      button: 'bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500',
      iconBg: 'bg-indigo-100 text-indigo-600',
    },
  };

  const currentVariant = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${currentVariant.iconBg}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">{description}</p>

          {requireInput && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                {inputLabel} <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={inputValue}
                onChange={(e) => onInputChange?.(e.target.value)}
                placeholder={inputPlaceholder}
                rows={3}
                className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition outline-hidden"
                disabled={isLoading}
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-5 py-4 bg-slate-50 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading || (requireInput && !inputValue.trim())}
            className={`px-4 py-2 text-sm font-semibold rounded-lg shadow-sm transition-colors focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${currentVariant.button}`}
          >
            {isLoading ? 'Procesando...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
