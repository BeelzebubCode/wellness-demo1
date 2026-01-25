// src/app/(platform)/layout.tsx

"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { SuperAdminHeader } from "@/components/layout/header/SuperAdminHeader";
import { SuperAdminSidebar } from "@/components/layout/sidebar/SuperAdminSidebar";
import { LoadingSpinner } from "@/components/ui";
import { useRoleAuth } from "@/features/auth/hooks/useRoleAuth";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  const { user, isLoading, isAuthenticated } = useRoleAuth({
    redirectTo: "/login",
    allowedRoles: ["SUPER_ADMIN"] as const,
    loginToastKey: "toast_login_required_platform",
    guard: !isLoginPage,
    requireTenant: false, // ✅ สำคัญ: SUPER_ADMIN ไม่ต้องมีมหาลัย
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  if (isLoginPage) return <>{children}</>;

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="xl" label="กำลังตรวจสอบสิทธิ์..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      <SuperAdminSidebar
        isOpen={isMobileMenuOpen}
        isCollapsed={isSidebarCollapsed}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        onToggleCollapse={() => setIsSidebarCollapsed((v) => !v)}
      />

      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <SuperAdminHeader
          adminName={(user as any)?.name}
          adminRole={user?.role}
        />

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          <div className="max-w-7xl mx-auto animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}
