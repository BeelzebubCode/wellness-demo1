// src/contexts/ToastContext.tsx
'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/cn';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  hideToast: (id: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const styles = {
  success: 'bg-emerald-500 border-emerald-600 text-white shadow-emerald-200',
  error: 'bg-red-500 border-red-600 text-white shadow-red-200',
  info: 'bg-blue-500 border-blue-600 text-white shadow-blue-200',
  warning: 'bg-amber-400 border-amber-500 text-amber-950 shadow-amber-200',
};

const iconStyles = {
  success: 'text-white',
  error: 'text-white',
  info: 'text-white',
  warning: 'text-amber-900',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration = 4000) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setToasts((prev) => [...prev, { id, type, message, duration }]);
      if (duration > 0) setTimeout(() => hideToast(id), duration);
    },
    [hideToast]
  );

  const success = useCallback((msg: string) => showToast(msg, 'success'), [showToast]);
  const error = useCallback((msg: string) => showToast(msg, 'error'), [showToast]);
  const info = useCallback((msg: string) => showToast(msg, 'info'), [showToast]);
  const warning = useCallback((msg: string) => showToast(msg, 'warning'), [showToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast, success, error, info, warning }}>
      {children}

      {/* Toast container — rendered at end of provider so it sits on top in DOM order */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 2147483647,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          maxWidth: '384px',
          width: '100%',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => {
          const Icon = icons[toast.type];
          return (
            <div
              key={toast.id}
              className={cn(
                'flex items-center gap-3 px-4 py-3.5 rounded-2xl border shadow-2xl',
                styles[toast.type]
              )}
              style={{ pointerEvents: 'auto', animation: 'slideInToast 0.3s ease-out' }}
            >
              <Icon className={cn('w-5 h-5 flex-shrink-0', iconStyles[toast.type])} />
              <p className="flex-1 text-sm font-semibold">{toast.message}</p>
              <button
                onClick={() => hideToast(toast.id)}
                className="flex-shrink-0 p-1 hover:bg-black/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes slideInToast {
          from { transform: translateX(110%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}