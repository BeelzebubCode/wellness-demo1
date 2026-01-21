// src/features/auth/hooks/useRoleAuth.ts

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authApi } from "../api";
import type { AuthUser } from "../types";
import { useNotificationContext } from "@/components/notification/NotificationProvider";

type Role = AuthUser["role"];

type UseRoleAuthOptions = {
  redirectTo?: string; // default "/login"
  allowedRoles: readonly Role[];
  loginToastKey: string;
};

const SUPPRESS_TOAST_KEY = "suppress_login_toast_once";

export function useRoleAuth<TUser extends AuthUser = AuthUser>({
  redirectTo = "/login",
  allowedRoles,
  loginToastKey,
}: UseRoleAuthOptions) {
  const router = useRouter();
  const pathname = usePathname();
  const { push } = useNotificationContext();

  const [user, setUser] = useState<TUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ ทำให้ dependency "เสถียร"
  const rolesKey = useMemo(() => allowedRoles.join("|"), [allowedRoles]);
  const allowedSet = useMemo(() => new Set<Role>(allowedRoles), [rolesKey]);

  useEffect(() => {
    let isMounted = true;

    if (pathname === "/login") {
      setIsLoading(false);
      return () => {
        isMounted = false;
      };
    }

    const toastLoginOnce = () => {
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
    };

    const clearLoginToastFlag = () => {
      try {
        sessionStorage.removeItem(loginToastKey);
      } catch {}
    };

    const redirectLogin = () => {
      if (pathname === "/login") return;
      toastLoginOnce();
      const next = pathname && pathname !== "/login" ? pathname : "/";
      router.replace(`${redirectTo}?next=${encodeURIComponent(next)}`);
    };

    const verify = async () => {
      try {
        const data = await authApi.me();
        if (!isMounted) return;

        if (!data?.valid || !data?.account) {
          setUser(null);
          redirectLogin();
          return;
        }

        if (!allowedSet.has(data.account.role)) {
          setUser(null);
          push({
            type: "error",
            title: "ไม่มีสิทธิ์เข้าถึง",
            message: "บัญชีนี้ไม่สามารถเข้าหน้านี้ได้",
            duration: 2400,
          });
          router.replace("/");
          return;
        }

        clearLoginToastFlag();
        setUser(data.account as TUser);
      } catch {
        if (!isMounted) return;
        setUser(null);
        redirectLogin();
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    verify();

    return () => {
      isMounted = false;
    };
    // ✅ สำคัญ: ใช้ rolesKey แทน allowedRoles
  }, [router, pathname, redirectTo, push, rolesKey, loginToastKey, allowedSet]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
