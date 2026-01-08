// src/components/notification/NotificationProvider.tsx
'use client';

import { createContext, useContext, useState } from 'react';
import { Notification } from './types';

interface NotificationContextValue {
  notifications: Notification[];
  push: (n: Omit<Notification, 'id'>) => void;
  clear: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const push = (n: Omit<Notification, 'id'>) => {
    setNotifications((prev) => [
      ...prev,
      { ...n, id: crypto.randomUUID() },
    ]);
  };

  const clear = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = () => setNotifications([]);

  return (
    <NotificationContext.Provider
      value={{ notifications, push, clear, clearAll }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotificationContext must be used within NotificationProvider');
  }
  return ctx;
}
