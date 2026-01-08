// ==========================================
// 📌 Root Layout
// ==========================================

import './globals.css';
import { NotificationProvider } from '@/components/notification/NotificationProvider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body>
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </body>
    </html>
  );
}
