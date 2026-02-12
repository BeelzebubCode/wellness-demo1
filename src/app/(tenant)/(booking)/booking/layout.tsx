// app/booking/layout.tsx
"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRoleAuth } from "@/features/auth/hooks/useRoleAuth";
import { BookingSidebar } from "@/components/layout/sidebar";
import { BookingHeader } from "@/components/layout/header";
import { LoadingSpinner } from "@/components/ui";

// ✅ Dynamic imports - load AI components only when needed
const AiChatModal = dynamic(
  () => import("@/features/ai").then(mod => ({ default: mod.AiChatModal })),
  { ssr: false, loading: () => null }
);

const FloatingAiButton = dynamic(
  () => import("@/features/ai").then(mod => ({ default: mod.FloatingAiButton })),
  { ssr: false, loading: () => null }
);

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useRoleAuth({
    redirectTo: "/login",
    allowedRoles: ["STUDENT"] as const,
    loginToastKey: "toast_login_required_student",
    guard: false,
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

      {/* ✅ AI components loaded on-demand */}
      <AiChatModal />
      <FloatingAiButton />
    </>
  );
}
