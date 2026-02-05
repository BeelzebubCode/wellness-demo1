// src/app/(platform)/layout.tsx

"use client";

import { usePathname } from "next/navigation";
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
    allowedRoles: ["SUPER_ADMIN", "MINISTRY"] as const,
    loginToastKey: "toast_login_required_platform",
    guard: !isLoginPage,
    requireTenant: false, // ✅ สำคัญ: SUPER_ADMIN ไม่ต้องมีมหาลัย
  });

  if (isLoginPage) return <>{children}</>;

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="xl" label="กำลังตรวจสอบสิทธิ์..." />
      </div>
    );
  }

  return (
    <div>{children}</div>
  );
}
