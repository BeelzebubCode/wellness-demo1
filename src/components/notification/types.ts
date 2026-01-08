// src/components/notification/types.ts
export type NotificationType =
  | 'error'
  | 'warning'
  | 'success'
  | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
}
