// src/components/notification/useNotification.ts
'use client';

import { useNotificationContext } from './NotificationProvider';

export function useNotification() {
  const { push, clear, clearAll } = useNotificationContext();

  return {
    error: (message: string) =>
      push({ type: 'error', message }),

    success: (message: string) =>
      push({ type: 'success', message }),

    warning: (message: string) =>
      push({ type: 'warning', message }),

    info: (message: string) =>
      push({ type: 'info', message }),

    clear,
    clearAll,
  };
}
