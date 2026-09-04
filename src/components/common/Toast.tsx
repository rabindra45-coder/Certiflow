import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss?: (id: string) => void;
  onCloseToast?: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss, onCloseToast }) => {
  const handleDismiss = (id: string) => {
    if (typeof onDismiss === 'function') {
      onDismiss(id);
    }
    if (typeof onCloseToast === 'function') {
      onCloseToast(id);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none max-w-sm w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 rounded-xl p-4 shadow-lg border backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 ${
            toast.type === 'success'
              ? 'bg-emerald-50/95 border-emerald-200 text-emerald-900 dark:bg-emerald-950/90 dark:border-emerald-800 dark:text-emerald-100'
              : toast.type === 'error'
              ? 'bg-rose-50/95 border-rose-200 text-rose-900 dark:bg-rose-950/90 dark:border-rose-800 dark:text-rose-100'
              : 'bg-indigo-50/95 border-indigo-200 text-indigo-900 dark:bg-indigo-950/90 dark:border-indigo-800 dark:text-indigo-100'
          }`}
        >
          <div className="shrink-0 mt-0.5">
            {toast.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
            {toast.type === 'error' && <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />}
            {toast.type === 'info' && <Info className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />}
          </div>
          <div className="flex-1 text-sm">
            <h5 className="font-semibold">{toast.title}</h5>
            {toast.message && <p className="mt-0.5 text-xs opacity-90">{toast.message}</p>}
          </div>
          <button
            onClick={() => handleDismiss(toast.id)}
            className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
