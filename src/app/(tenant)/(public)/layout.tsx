// src/app/(tenant)/(public)/layout.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { PublicHeader, PublicFooter } from "@/components/layout";
import { useRoleAuth } from "@/features/auth/hooks/useRoleAuth";
import { roleDefaultPath } from "@/features/auth/login/login-utils";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  // ✅ ป้องกัน hydration mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // ✅ render footer หลัง mount เท่านั้น
  const showFooter = mounted && pathname === "/";

  const { user, isLoading, isAuthenticated } = useRoleAuth({
    redirectTo: "/login",
    allowedRoles: ["STUDENT", "CONSULTANT", "HEAD_CONSULTANT", "RECTOR", "SUPER_ADMIN"] as const,
    loginToastKey: "toast_public_layout_auth_check",
    guard: false,
    requireTenant: false,
  });

  useEffect(() => {
    if (!mounted) return;          // ✅ กัน redirect ก่อน hydrate เสร็จ
    if (isLoading) return;
    if (!isAuthenticated) return;
    if (!user) return;

    if (user.role !== "STUDENT" && user.role !== "SUPER_ADMIN") {
      const target = roleDefaultPath(user.role);
      if (target && target !== pathname) router.replace(target);
    }
  }, [mounted, isLoading, isAuthenticated, user, router, pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader onLogin={() => router.push("/login")} />

      <main className="flex-1 pt-16">{children}</main>

      {showFooter && <PublicFooter />}
    </div>
  );
}
