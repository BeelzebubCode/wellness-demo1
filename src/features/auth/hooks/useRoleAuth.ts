// src/features/auth/hooks/useRoleAuth.ts
"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authApi } from "../api";
import type { AuthUser } from "../types";
import { useNotificationContext } from "@/components/notification/NotificationProvider";

type Role = AuthUser["role"];

type UseRoleAuthOptions = {
  redirectTo?: string; // default "/login"
  allowedRoles: readonly Role[];
  loginToastKey: string;
  /** ถ้า false จะไม่ redirect/ไม่ toast (เหมาะกับหน้า public) */
  guard?: boolean;
};

const SUPPRESS_TOAST_KEY = "suppress_login_toast_once";

export function useRoleAuth<TUser extends AuthUser = AuthUser>({
  redirectTo = "/login",
  allowedRoles,
  loginToastKey,
  guard = true,
}: UseRoleAuthOptions) {
  const router = useRouter();
  const pathname = usePathname();
  const { push } = useNotificationContext();

  const [user, setUser] = useState<TUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ทำ dependency เสถียร
  const rolesKey = useMemo(() => allowedRoles.join("|"), [allowedRoles]);
  const allowedSet = useMemo(() => new Set<Role>(allowedRoles), [rolesKey]);

  const toastLoginOnce = useCallback(() => {
    const COOLDOWN_MS = 3000;

    try {
      if (sessionStorage.getItem(SUPPRESS_TOAST_KEY) === "1") {
        sessionStorage.removeItem(SUPPRESS_TOAST_KEY);
        return;
      }
      const last = Number(sessionStorage.getItem(loginToastKey) || "0");
      const now = Date.now();
      if (now - last < COOLDOWN_MS) return;
      sessionStorage.setItem(loginToastKey, String(now));
    } catch {}

    push({
      type: "warning",
      title: "กรุณาเข้าสู่ระบบ",
      message: "คุณต้องเข้าสู่ระบบก่อนใช้งานหน้านี้",
      duration: 2200,
    });
  }, [push, loginToastKey]);

  const clearLoginToastFlag = useCallback(() => {
    try {
      sessionStorage.removeItem(loginToastKey);
    } catch {}
  }, [loginToastKey]);

  const redirectLogin = useCallback(() => {
    if (!guard) return;

    // กัน loop
    if (pathname === "/login") return;

    toastLoginOnce();

    // ✅ normalize redirectTo
    const to = redirectTo.startsWith("/") ? redirectTo : `/${redirectTo}`;

    const next = pathname && pathname !== "/login" ? pathname : "/";

    router.replace(`${to}?next=${encodeURIComponent(next)}`);
  }, [guard, pathname, router, redirectTo, toastLoginOnce]);

  const verify = useCallback(async () => {
    setIsLoading(true);

    try {
      const data = await authApi.me(); // ✅ ต้อง include cookies ใน authApi.me()
      if (!data?.valid || !data?.account) {
        setUser(null);
        redirectLogin();
        return;
      }

      if (!allowedSet.has(data.account.role)) {
        setUser(null);

        if (guard) {
          push({
            type: "error",
            title: "ไม่มีสิทธิ์เข้าถึง",
            message: "บัญชีนี้ไม่สามารถเข้าหน้านี้ได้",
            duration: 2400,
          });
          router.replace("/");
        }
        return;
      }

      clearLoginToastFlag();
      setUser(data.account as TUser);
    } catch {
      setUser(null);
      redirectLogin();
    } finally {
      setIsLoading(false);
    }
  }, [allowedSet, clearLoginToastFlag, guard, push, redirectLogin, router]);

  useEffect(() => {
    let isMounted = true;

    if (pathname === "/login") {
      setIsLoading(false);
      return () => {
        isMounted = false;
      };
    }

    // run verify ครั้งแรก
    verify();

    // ✅ refetch เมื่อ auth เปลี่ยน (login/logout)
    const onAuthChanged = () => {
      if (!isMounted) return;
      verify();
    };
    window.addEventListener("auth-changed", onAuthChanged);

    return () => {
      isMounted = false;
      window.removeEventListener("auth-changed", onAuthChanged);
    };
  }, [pathname, verify]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    refetch: verify,
  };
}
