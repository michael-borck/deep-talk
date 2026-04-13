import React, { createContext, useCallback, useContext, useState } from 'react';

export type ToastKind = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  body?: string;
  duration: number; // ms; 0 = sticky until dismissed
}

interface ToastContextValue {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'> & { duration?: number }) => number;
  dismissToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 1;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: Omit<Toast, 'id'> & { duration?: number }) => {
      const id = nextId++;
      const duration = toast.duration ?? 5000;
      const newToast: Toast = {
        id,
        kind: toast.kind,
        title: toast.title,
        body: toast.body,
        duration,
      };
      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => dismissToast(id), duration);
      }
      return id;
    },
    [dismissToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used inside a ToastProvider');
  }
  return ctx;
};
