// app/admin/layout.tsx (หรือ path ที่คุณใช้จริง)
"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { AdminHeader, AdminSidebar } from "@/components/layout";
import { LoadingSpinner } from "@/components/ui";
import { useRoleAuth } from "@/features/auth/hooks/useRoleAuth";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // ✅ หน้า login ไม่ต้อง guard
  if (pathname === "/login") return <>{children}</>;

  // ✅ roles admin ของคุณ
  const allowedRoles = useMemo(
    () => ["HEAD_CONSULTANT", "SUPER_ADMIN", "RECTOR"] as const,
    [],
  );

  // ✅ guard ทั้งหมดอยู่ใน hook แล้ว (login/role/toast/redirect)
  const { user, isLoading, isAuthenticated } = useRoleAuth({
    redirectTo: "/login",
    allowedRoles: ["HEAD_CONSULTANT", "SUPER_ADMIN", "RECTOR"] as const,
    loginToastKey: "toast_login_required_admin",
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="xl" label="กำลังตรวจสอบสิทธิ์..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      <AdminSidebar
        isOpen={isMobileMenuOpen}
        isCollapsed={isSidebarCollapsed}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <AdminHeader
          adminName={user?.name}
          adminRole={user?.role}
          onMenuClick={() => setIsMobileMenuOpen(true)}
        />

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          <div className="max-w-7xl mx-auto animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}
