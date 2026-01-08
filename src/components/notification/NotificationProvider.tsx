// src/components/notification/NotificationProvider.tsx
'use client';

import React, { createContext, useContext, useState } from 'react';
import type { Notification } from './types';
import { ToastHost } from './Toast';

type PushPayload = Omit<Notification, 'id'> & {
  title?: string;
  duration?: number;
};

interface NotificationContextValue {
  notifications: Notification[];
  push: (n: PushPayload) => void;
  clear: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const push: NotificationContextValue['push'] = (n) => {
    setNotifications((prev) => [
      // ใส่หน้า list ให้ toast ใหม่อยู่บนสุด
      { ...n, id: crypto.randomUUID() } as Notification,
      ...prev,
    ].slice(0, 3)); // max 3
  };

  const clear = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = () => setNotifications([]);

  return (
    <NotificationContext.Provider value={{ notifications, push, clear, clearAll }}>
      {children}
      <ToastHost />
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotificationContext must be used within NotificationProvider');
  return ctx;
}
