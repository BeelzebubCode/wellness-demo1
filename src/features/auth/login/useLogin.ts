"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import {
  LoginResponse,
  buildTargetHostFromTenantCode,
  isAdminPath,
  isAdminRole,
  isSafeNextPath,
  roleDefaultPath,
  withToastUrl,
} from "./login-utils";

type FormData = {
  username: string;
  password: string;

  // optional (เผื่อทำ dropdown เลือกมหาลัยตอน root domain)
  preferredUniversityId?: number | null;
};

export function useLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setTenant } = useTheme();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    username: "",
    password: "",
    preferredUniversityId: null,
  });

  const nextParam = useMemo(() => searchParams.get("next"), [searchParams]);

  const demoFill = useCallback((username: string, password: string) => {
    setFormData((p) => ({ ...p, username, password }));
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
          body: JSON.stringify({
            username: formData.username,
            password: formData.password,
            preferredUniversityId: formData.preferredUniversityId ?? null,
          }),
          credentials: "include",
        });

        const data = (await res.json()) as LoginResponse;

        if (!(res.ok && data.success)) {
          setError(data.error || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
          return;
        }

        // ✅ tenantCode จาก server (active tenant)
        const tenantCode = String(data.tenant?.universityCode || "DEFAULT").toUpperCase();
        setTenant(tenantCode || "DEFAULT");

        // ✅ localStorage เก็บเพื่อ UX เท่านั้น (ไม่เอาไปใช้ตัดสิทธิ์จริง)
        localStorage.setItem(
          "auth_user",
          JSON.stringify({
            name: data.account?.name || data.account?.username || formData.username,
            role: data.account?.role || null,
          })
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

        // 4) ย้าย subdomain ถ้าจำเป็น
        const { protocol, targetHost, currentHost } = buildTargetHostFromTenantCode(tenantCode);

        const url = withToastUrl(
          protocol,
          targetHost,
          nextPath,
          "login",
          data.account?.username || ""
        );

        if (targetHost !== currentHost) {
          window.location.assign(url); // full reload to new subdomain
          return;
        }

        // same host => SPA navigation
        router.replace(url.replace(`${protocol}//${targetHost}`, ""));
      } catch (err) {
        console.error(err);
        setError("Connection Error");
      } finally {
        setLoading(false);
      }
    },
    [formData, nextParam, router, setTenant]
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
