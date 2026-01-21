// app/consultant/layout.tsx
"use client";

import { useState, useCallback, useMemo } from "react";
import { ConsultantSidebar } from "@/components/layout/sidebar";
import { ConsultantHeader } from "@/components/layout/header";
import { LoadingSpinner } from "@/components/ui";

import { useRoleAuth } from "@/features/auth/hooks/useRoleAuth";

export default function ConsultantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ✅ กัน effect rerun เพราะ array literal เปลี่ยนทุก render
  const allowedRoles = useMemo(() => ["CONSULTANT"] as const, []);

  // ✅ Role guard อยู่ใน hook แล้ว (redirect + toast + deny)
  const { user, isLoading, isAuthenticated } = useRoleAuth({
    redirectTo: "/login",
    allowedRoles: ["CONSULTANT"] as const,
    loginToastKey: "toast_login_required_consultant",
  });

  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Handlers
  const handleCloseMobile = useCallback(() => setIsSidebarOpen(false), []);
  const handleToggleCollapse = useCallback(
    () => setIsSidebarCollapsed((prev) => !prev),
    [],
  );
  const handleOpenMobile = useCallback(() => setIsSidebarOpen(true), []);

  // ✅ Loading/unauth state
  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="xl" label="กำลังตรวจสอบสิทธิ์..." />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <ConsultantSidebar
        isOpen={isSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        onCloseMobile={handleCloseMobile}
        onToggleCollapse={handleToggleCollapse}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <ConsultantHeader onMenuClick={handleOpenMobile} />

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
