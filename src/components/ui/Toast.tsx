'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';

/* ─── Types ─────────────────────────────────────────────────────────────── */

type ToastType = 'error' | 'success' | 'info';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
  toastError: (message: string) => void;
  toastSuccess: (message: string) => void;
}

/* ─── Context ────────────────────────────────────────────────────────────── */

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 1;
const DURATION_MS = 4500;

/* ─── Provider ───────────────────────────────────────────────────────────── */

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) { clearTimeout(timer); timers.current.delete(id); }
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, type }]);
    const timer = setTimeout(() => dismiss(id), DURATION_MS);
    timers.current.set(id, timer);
  }, [dismiss]);

  const toastError   = useCallback((msg: string) => toast(msg, 'error'),   [toast]);
  const toastSuccess = useCallback((msg: string) => toast(msg, 'success'), [toast]);

  // Cleanup on unmount
  useEffect(() => {
    const t = timers.current;
    return () => { t.forEach(clearTimeout); };
  }, []);

  return (
    <ToastContext.Provider value={{ toast, toastError, toastSuccess }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

/* ─── Hook ───────────────────────────────────────────────────────────────── */

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

/* ─── UI ─────────────────────────────────────────────────────────────────── */

const STYLE: Record<ToastType, string> = {
  error:   'bg-red-600 border-red-700 text-white',
  success: 'bg-green-600 border-green-700 text-white',
  info:    'bg-deepsea-600 border-deepsea-700 text-white',
};

const ICON: Record<ToastType, string> = {
  error:   '✕',
  success: '✓',
  info:    'ℹ',
};

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="assertive"
      className="fixed bottom-5 right-5 z-[200] flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`
            pointer-events-auto flex items-start gap-3 min-w-[280px] max-w-sm
            rounded-xl border px-4 py-3 shadow-xl
            animate-toast-in
            ${STYLE[t.type]}
          `}
        >
          <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
            {ICON[t.type]}
          </span>
          <p className="flex-1 text-sm font-medium leading-snug">{t.message}</p>
          <button
            onClick={() => onDismiss(t.id)}
            className="flex-shrink-0 mt-0.5 opacity-70 hover:opacity-100 transition-opacity text-sm"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
