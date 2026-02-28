// src/app/layout.tsx

import "./globals.css";
import type { Metadata } from "next";
import { NotificationProvider } from "@/components/notification/NotificationProvider";
import { ThemeProvider } from "@/contexts/ThemeContext";
import AuthToastGate from "@/components/auth/AuthToastGate";

export const metadata: Metadata = {
  title: { default: "NU Wellness Center", template: "%s | NU Wellness Center" },
  description: "ระบบจองคิวให้คำปรึกษา NU Wellness",
  icons: { icon: "/icons/wellness_icon.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // ✅ ไม่ต้อง resolve tenant จาก domain อีกต่อไป — ThemeContext จะจัดการจาก cookie/localStorage
  return (
    <html lang="th">
      <body>
        <ThemeProvider>
          <NotificationProvider>
            <AuthToastGate />
            {children}
          </NotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
