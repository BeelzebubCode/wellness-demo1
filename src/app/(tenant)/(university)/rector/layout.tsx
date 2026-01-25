"use client";

import { LoadingSpinner } from "@/components/ui";
import { useRoleAuth } from "@/features/auth/hooks/useRoleAuth";

export default function RectorLayout({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated, user } = useRoleAuth({
    redirectTo: "/login",
    allowedRoles: ["RECTOR"] as const,
    loginToastKey: "toast_login_required_rector",
    guard: true,
    requireTenant: true, 
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="xl" label="กำลังตรวจสอบสิทธิ์..." />
      </div>
    );
  }

  return <>{children}</>;
}
