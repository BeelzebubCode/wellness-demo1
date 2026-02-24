"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AdminHeader, SuperAdminSidebar } from "@/components/layout";
import { LoadingSpinner } from "@/components/ui";
import { useRoleAuth } from "@/features/auth/hooks/useRoleAuth";
import { ToastProvider } from "@/contexts/ToastContext";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  const { isLoading, isAuthenticated, user } = useRoleAuth({
    redirectTo: "/login",
    allowedRoles: ["SUPER_ADMIN"],
    loginToastKey: "toast_login_required_super_admin",
    guard: !isLoginPage,
    requireTenant: false, // Super Admin might not belong to a specific tenant
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  if (isLoginPage) return <>{children}</>;

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="xl" label="Checking permissions..." />
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50 flex font-sans">
        <SuperAdminSidebar
          isOpen={isMobileMenuOpen}
          isCollapsed={isSidebarCollapsed}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        />

        <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
          <AdminHeader
            adminName={(user as any)?.name || "Super Admin"}
            adminRole="System Administrator"
            onMenuClick={() => setIsMobileMenuOpen(true)}
          />

          <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
            <div className="max-w-7xl mx-auto animate-fade-in">{children}</div>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
