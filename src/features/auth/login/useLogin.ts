"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { authApi } from "@/features/auth/api";
import {
  isAdminPath,
  isAdminRole,
  isSafeNextPath,
  roleDefaultPath,
} from "./login-utils";

type FormData = {
  username: string;
  password: string;
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
        const data = await authApi.login({
          username: formData.username,
          password: formData.password,
          preferredUniversityId: formData.preferredUniversityId ?? undefined,
        });

        if (!data.success) {
          setError(data.error || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
          return;
        }

        // ✅ tenantCode จาก server (based on account_home_university_id)
        const tenantCode = String(data.tenant?.universityCode || "DEFAULT").toUpperCase();
        setTenant(tenantCode || "DEFAULT");

        // localStorage เก็บเพื่อ UX เท่านั้น
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

        // ✅ ไม่ต้อง redirect ไป subdomain อีกต่อไป — stay on same host
        router.replace(nextPath);
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

