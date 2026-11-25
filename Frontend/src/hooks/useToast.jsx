import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

let nextToastId = 1;

const TOAST_STYLES = {
  success: {
    container: 'border-emerald-200 bg-white text-[#1E293B]',
    iconWrap: 'bg-emerald-50 text-[#16A34A]',
    Icon: CheckCircle2,
  },
  error: {
    container: 'border-red-200 bg-white text-[#1E293B]',
    iconWrap: 'bg-red-50 text-[#DC2626]',
    Icon: AlertCircle,
  },
  warning: {
    container: 'border-amber-200 bg-white text-[#1E293B]',
    iconWrap: 'bg-amber-50 text-[#D97706]',
    Icon: AlertTriangle,
  },
  info: {
    container: 'border-teal-200 bg-white text-[#1E293B]',
    iconWrap: 'bg-[#CCFBF1] text-[#0F766E]',
    Icon: Info,
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ title, message, type = 'info', duration = 4500 }) => {
      const id = nextToastId++;
      setToasts((prev) => [...prev, { id, title, message, type }]);

      if (duration > 0) {
        window.setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  const toast = {
    success: (title, message) => addToast({ title, message, type: 'success' }),
    error: (title, message) => addToast({ title, message, type: 'error', duration: 6000 }),
    warning: (title, message) => addToast({ title, message, type: 'warning', duration: 5000 }),
    info: (title, message) => addToast({ title, message, type: 'info' }),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        aria-live="polite"
        aria-label="Notifications"
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2.5 px-4 sm:px-0"
      >
        {toasts.map((item) => {
          const style = TOAST_STYLES[item.type] || TOAST_STYLES.info;
          const Icon = style.Icon;
          return (
            <div
              key={item.id}
              role="status"
              className={`pointer-events-auto flex items-start gap-3 rounded-lg border p-3.5 shadow-elevated transition-all ${style.container}`}
            >
              <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${style.iconWrap}`}>
                <Icon className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                {item.title && (
                  <p className="text-sm font-semibold text-[#0F172A]">{item.title}</p>
                )}
                {item.message && (
                  <p className="mt-0.5 text-xs leading-relaxed text-[#64748B]">{item.message}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeToast(item.id)}
                aria-label="Dismiss notification"
                className="rounded p-1 text-[#64748B] hover:bg-slate-100 hover:text-[#0F172A]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used inside ToastProvider');
  }
  return ctx;
}

