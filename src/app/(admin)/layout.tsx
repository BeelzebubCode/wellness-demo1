"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminHeader, AdminSidebar } from "@/components/layout";
import { LoadingSpinner } from "@/components/ui";
import useAdminAuth from "@/features/auth/hooks/useAdminAuth";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  // ✅ หน้า login กลาง (/login) ห้ามโดน guard
  const isLoginPage = pathname === "/login";
  if (isLoginPage) return <>{children}</>;

  const { user, isLoading, isAuthenticated } = useAdminAuth();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const safeNext =
        pathname && pathname !== "/login" ? pathname : "/admin/data-center";

      router.replace(`/login?next=${encodeURIComponent(safeNext)}`);
    }
  }, [isLoading, isAuthenticated, pathname, router]);

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
