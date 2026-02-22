// app/(tenant)/(university)/head-consultant/layout.tsx
"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

import { AdminHeader, AdminSidebar } from "@/components/layout";
import { LoadingSpinner } from "@/components/ui";
import { useRoleAuth } from "@/features/auth/hooks/useRoleAuth";
import { ToastProvider } from "@/contexts/ToastContext";
import { ConfirmDialogProvider } from "@/components/ui/ConfirmDialog";

export default function HeadConsultantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  // ✅ counseling admin = พวกดูแล/จัดการงานให้คำปรึกษา
  // ปรับ roles ตามที่นายต้องการได้เลย
  const { user, isLoading, isAuthenticated: _isAuthenticated } = useRoleAuth({
    redirectTo: "/login",
    allowedRoles: ["HEAD_CONSULTANT", "SUPER_ADMIN", "RECTOR"] as const,
    loginToastKey: "toast_login_required_head_consultant",
    guard: !isLoginPage,
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // ✅ หน้า login ก็ปล่อยผ่าน
  if (isLoginPage) return <>{children}</>;

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="xl" label="กำลังตรวจสอบสิทธิ์..." />
      </div>
    );
  }

  return (
    <ToastProvider>
      <ConfirmDialogProvider>
        <div className="min-h-screen bg-gray-50 flex font-sans">
          <AdminSidebar
            isOpen={isMobileMenuOpen}
            isCollapsed={isSidebarCollapsed}
            onCloseMobile={() => setIsMobileMenuOpen(false)}
            onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          />

          <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
            <AdminHeader
              adminName={(user as any)?.name}
              adminRole={user?.role}
              onMenuClick={() => setIsMobileMenuOpen(true)}
            />

            <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
              <div className="max-w-7xl mx-auto animate-fade-in">{children}</div>
            </main>
          </div>
        </div>
      </ConfirmDialogProvider>
    </ToastProvider>
  );
}
