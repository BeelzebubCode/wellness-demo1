"use client";

import { usePathname } from "next/navigation";
import { LoadingSpinner } from "@/components/ui";
import { useRoleAuth } from "@/features/auth/hooks/useRoleAuth";

export default function UniversityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  // ✅ เช็ค "ล็อกอิน" อย่างเดียว ไม่สน role (role ไปเช็คใน layout ของแต่ละฝ่าย)
  const { isLoading, isAuthenticated } = useRoleAuth({
    redirectTo: "/login",
    allowedRoles: ["STUDENT", "CONSULTANT", "HEAD_CONSULTANT", "RECTOR", "SUPER_ADMIN"] as const,
    loginToastKey: "toast_login_required_university",
    guard: !isLoginPage,
  });

  // ✅ หน้า login ก็ปล่อยผ่าน (กัน loop)
  if (isLoginPage) return <>{children}</>;

  // ✅ Loading / ยังไม่ auth
  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="xl" label="กำลังตรวจสอบสิทธิ์..." />
      </div>
    );
  }

  // ✅ ผ่านแล้วก็ render ลูกอย่างเดียว (ไม่ใส่ header/sidebar)
  return <>{children}</>;
}
