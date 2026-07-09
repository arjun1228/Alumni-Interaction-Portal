import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';

// ── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext(null);

let nextId = 1;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    clearTimeout(timersRef.current[id]);
    delete timersRef.current[id];
  }, []);

  const showToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = nextId++;
    setToasts(prev => [{ id, message, type }, ...prev].slice(0, 5)); // max 5 visible

    timersRef.current[id] = setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
};

// ── Toast Container ───────────────────────────────────────────────────────────

const CONFIGS = {
  success: {
    icon: CheckCircle2,
    bg: 'bg-emerald-600',
    ring: 'ring-emerald-500/30',
    iconColor: 'text-white',
  },
  error: {
    icon: XCircle,
    bg: 'bg-rose-600',
    ring: 'ring-rose-500/30',
    iconColor: 'text-white',
  },
  info: {
    icon: Info,
    bg: 'bg-indigo-600',
    ring: 'ring-indigo-500/30',
    iconColor: 'text-white',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-amber-500',
    ring: 'ring-amber-400/30',
    iconColor: 'text-white',
  },
};

const ToastContainer = ({ toasts, onDismiss }) => {
  if (!toasts.length) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-9999 flex flex-col gap-3 pointer-events-none"
      aria-live="polite"
      aria-label="Notifications"
    >
      {[...toasts].reverse().map(toast => {
        const cfg = CONFIGS[toast.type] || CONFIGS.success;
        const Icon = cfg.icon;

        return (
          <div
            key={toast.id}
            className={`
              pointer-events-auto flex items-center gap-3 
              ${cfg.bg} ${cfg.ring}
              text-white text-sm font-medium
              px-4 py-3 rounded-xl shadow-lg ring-1
              min-w-[260px] max-w-[380px]
              animate-in slide-in-from-bottom-4 fade-in duration-300
            `}
            role="alert"
          >
            <Icon className={`w-5 h-5 shrink-0 ${cfg.iconColor}`} />
            <span className="flex-1 leading-snug">{toast.message}</span>
            <button
              onClick={() => onDismiss(toast.id)}
              className="shrink-0 p-0.5 rounded-md hover:bg-white/20 transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
