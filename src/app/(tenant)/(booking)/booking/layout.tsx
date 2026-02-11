// app/booking/layout.tsx
"use client";

import { useState, useCallback } from "react";
import { useRoleAuth } from "@/features/auth/hooks/useRoleAuth";
import { BookingSidebar } from "@/components/layout/sidebar";
import { BookingHeader } from "@/components/layout/header";
import { LoadingSpinner } from "@/components/ui";

import { AiChatModal } from "@/features/ai";
import { FloatingAiButton } from "@/features/ai";

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useRoleAuth({
    redirectTo: "/login",
    allowedRoles: ["STUDENT"] as const,
    loginToastKey: "toast_login_required_student",
    guard: false, // ✅ Allow public/guest access without force redirect
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleCloseMobile = useCallback(() => setIsSidebarOpen(false), []);
  const handleToggleCollapse = useCallback(() => setIsSidebarCollapsed((prev) => !prev), []);
  const handleOpenMobile = useCallback(() => setIsSidebarOpen(true), []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner label="กำลังตรวจสอบสิทธิ์..." />
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-screen bg-slate-50">
        <BookingSidebar
          isOpen={isSidebarOpen}
          isCollapsed={isSidebarCollapsed}
          onCloseMobile={handleCloseMobile}
          onToggleCollapse={handleToggleCollapse}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <BookingHeader
            userName={user?.name ?? user?.username ?? "บุคคลทั่วไป"}
            userRole={isAuthenticated ? "นักศึกษา" : "Guest"}
            onMenuClick={handleOpenMobile}
          />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>

      {/* ✅ วางไว้ท้ายสุด เพื่อให้ลอยทับทุกอย่าง */}
      <AiChatModal />
      <FloatingAiButton />
    </>
  );
}
