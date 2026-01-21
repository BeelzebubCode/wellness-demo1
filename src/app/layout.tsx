// ==========================================
// 📌 Root Layout
// ==========================================

import './globals.css';
import type { Metadata } from 'next';
import { NotificationProvider } from '@/components/notification/NotificationProvider';
import { ThemeProvider } from '@/contexts/ThemeContext'; // ✅ เพิ่ม

export const metadata: Metadata = {
  title: {
    default: 'NU Wellness Center',
    template: '%s | NU Wellness Center',
  },
  description: 'ระบบจองคิวให้คำปรึกษา NU Wellness',
  icons: {
    icon: '/icons/wellness_icon.png',
  },
  openGraph: {
    title: 'NU Wellness Center',
    description: 'ระบบจองคิวให้คำปรึกษา NU Wellness Center',
    images: ['/images/profiles.jpg'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>
        {/* ✅ ThemeProvider ต้องครอบทั้งหมด เพื่อให้สลับธีมตามมหาลัยได้ */}
        <ThemeProvider>
          <NotificationProvider>{children}</NotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
