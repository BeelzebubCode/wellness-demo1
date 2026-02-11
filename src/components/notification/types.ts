// src/components/notification/types.ts
export type NotificationType = 'error' | 'warning' | 'success' | 'info' | 'reward';

export interface Notification {
  id: string;
  type: NotificationType;
  title?: string;
  message: string;
  duration?: number; // ms
}
