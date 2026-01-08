// ==========================================
// 📌 Root Layout
// ==========================================

import './globals.css';
import type { Metadata } from 'next';
import { NotificationProvider } from '@/components/notification/NotificationProvider';

export const metadata: Metadata = {
  title: {
    default: 'NU Wellness Center',
    template: '%s | NU Wellness Center',
  },
  description: 'ระบบจองคิวให้คำปรึกษา NU Wellness',
  icons: {
    icon: '/icons/wellness_icon.png', // ถ้ามี
  },
  openGraph: {
    title: 'NU Wellness Center',
    description: 'ระบบจองคิวให้คำปรึกษา NU Wellness Center',
    images: ['/images/profiles.jpg'], // หรือรูป og ที่เตรียมไว้
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>
        <NotificationProvider>{children}</NotificationProvider>
      </body>
    </html>
  );
}

