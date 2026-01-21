// ==========================================
// 📌 Root Layout
// ==========================================

import "./globals.css";
import type { Metadata } from "next";
import { headers, cookies } from "next/headers";
import { NotificationProvider } from "@/components/notification/NotificationProvider";
import { ThemeProvider } from "@/contexts/ThemeContext";

export const metadata: Metadata = {
  title: {
    default: "NU Wellness Center",
    template: "%s | NU Wellness Center",
  },
  description: "ระบบจองคิวให้คำปรึกษา NU Wellness",
  icons: { icon: "/icons/wellness_icon.png" },
  openGraph: {
    title: "NU Wellness Center",
    description: "ระบบจองคิวให้คำปรึกษา NU Wellness Center",
    images: ["/images/profiles.jpg"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const h = headers();
  const c = cookies();

  // ✅ อ่านจาก header ก่อน ถ้าไม่มีค่อย fallback จาก cookie
  const tenant =
    h.get("x-tenant") ||
    c.get("tenant_code")?.value ||
    "DEFAULT";

  return (
    <html lang="th" data-tenant={tenant}>
      <body>
        <ThemeProvider>
          <NotificationProvider>{children}</NotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
