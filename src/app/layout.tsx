// src/app/layout.tsx

import "./globals.css";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { NotificationProvider } from "@/components/notification/NotificationProvider";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { tenantFromHost } from "@/config/tenant-domains"; // ✅ ใช้ตัวนี้

export const metadata: Metadata = {
  title: { default: "NU Wellness Center", template: "%s | NU Wellness Center" },
  description: "ระบบจองคิวให้คำปรึกษา NU Wellness",
  icons: { icon: "/icons/wellness_icon.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const h = headers();

  // ✅ host จริงของ request
  const host =
    h.get("x-forwarded-host") ||
    h.get("host") ||
    "";

  const tenant = tenantFromHost(host); // "NU" | "CU" | "KKU" | "DEFAULT"

  return (
    <html lang="th" data-tenant={tenant !== "DEFAULT" ? tenant : undefined}>
      <body>
        <ThemeProvider>
          <NotificationProvider>{children}</NotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
