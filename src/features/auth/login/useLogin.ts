"use client";

// src/features/auth/login/useLogin.ts

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import {
  LoginResponse,
  buildTargetHostFromTenant,
  isAdminPath,
  isAdminRole,
  isSafeNextPath,
  roleDefaultPath,
} from "./login-utils";

type FormData = { username: string; password: string };

export function useLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setTenant } = useTheme();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<FormData>({ username: "", password: "" });

  const nextParam = useMemo(() => searchParams.get("next"), [searchParams]);

  const demoFill = useCallback((username: string, password: string) => {
    setFormData({ username, password });
  }, []);

  const login = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/v2/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
          credentials: "include",
        });

        const data = (await res.json()) as LoginResponse;

        if (!(res.ok && data.success)) {
          setError(data.error || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
          return;
        }

        const tenantCode = String(data.tenant?.universityCode || "DEFAULT").toUpperCase();
        setTenant(tenantCode || "DEFAULT");

        localStorage.setItem(
          "auth_user",
          JSON.stringify({
            name: data.account?.name || data.account?.username || formData.username,
            role: data.account?.role || null,
            homeUniversityId: data.account?.homeUniversityId ?? null,
            allowedUniversityIds: data.account?.allowedUniversityIds ?? [],
          }),
        );

        window.dispatchEvent(new Event("auth-changed"));

        const role = data.account?.role;

        // 1) next ที่ปลอดภัย
        let nextPath = isSafeNextPath(nextParam) ? nextParam : null;

        // 2) กันหลุดเข้า /admin ถ้า role ไม่ใช่ admin
        if (nextPath && isAdminPath(nextPath) && !isAdminRole(role)) {
          nextPath = null;
        }

        // 3) ไม่มี next -> ใช้ default ตาม role
        if (!nextPath) nextPath = roleDefaultPath(role);

        // ✅ ถ้า targetHost != currentHost ให้ย้าย subdomain ด้วย full reload
        // ถ้าเท่ากัน ให้ใช้ router.replace (ไม่กระพริบ/ไม่รีเฟรชทั้งหน้า)
        const { protocol, targetHost, currentHost } = buildTargetHostFromTenant(tenantCode);

        const withToastUrl = (basePath: string) => {
          const url = new URL(`${protocol}//${targetHost}${basePath}`);
          url.searchParams.set("toast", "login");
          url.searchParams.set("name", data.account?.username || "");
          url.searchParams.set("toastId", String(Date.now()));
          return url.toString();
        };

        if (targetHost !== currentHost) {
          window.location.assign(withToastUrl(nextPath));
          return;
        }

        // same host => SPA navigation
        router.replace(withToastUrl(nextPath).replace(`${protocol}//${targetHost}`, ""));
      } catch (err) {
        console.error(err);
        setError("Connection Error");
      } finally {
        setLoading(false);
      }
    },
    [formData, nextParam, router, setTenant],
  );

  return {
    loading,
    error,
    showPassword,
    formData,
    setFormData,
    setShowPassword,
    demoFill,
    login,
    clearError: () => setError(null),
  };
}
