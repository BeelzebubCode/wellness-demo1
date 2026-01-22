// src/features/auth/hooks/useRoleAuth.ts
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { authApi } from "../api";
import type { AuthUser } from "../types";
import { useNotificationContext } from "@/components/notification/NotificationProvider";

type Role = AuthUser["role"];

type UseRoleAuthOptions = {
  redirectTo?: string; // default "/login"
  allowedRoles: readonly Role[];
  loginToastKey: string;

  guard?: boolean; // default true
  requireTenant?: boolean; // default true
  allowedUniversityIds?: readonly number[]; // optional
};

const SUPPRESS_TOAST_KEY = "suppress_login_toast_once";

type VerifyResult =
  | { ok: true; user: AuthUser }
  | { ok: false; reason: "UNAUTH" | "FORBIDDEN" | "NO_TENANT" | "UNI_NOT_ALLOWED" };

function uniqKey(list: readonly unknown[]) {
  return list.join("|");
}

export function useRoleAuth<TUser extends AuthUser = AuthUser>({
  redirectTo = "/login",
  allowedRoles,
  loginToastKey,
  guard = true,
  requireTenant = true,
  allowedUniversityIds,
}: UseRoleAuthOptions) {
  const router = useRouter();
  const pathname = usePathname();
  const { push } = useNotificationContext();

  // ---- stable refs (avoid re-creating callbacks) ----
  const pushRef = useRef(push);
  useEffect(() => {
    pushRef.current = push;
  }, [push]);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ---- state ----
  const [user, setUser] = useState<TUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ---- stable guards ----
  const rolesKey = useMemo(() => uniqKey(allowedRoles), [allowedRoles]);
  const allowedRoleSet = useMemo(() => new Set<Role>(allowedRoles), [rolesKey]);

  const allowedUniKey = useMemo(
    () => uniqKey((allowedUniversityIds || []).filter(Number.isFinite)),
    [allowedUniversityIds],
  );
  const allowedUniSet = useMemo(() => {
    const list = (allowedUniversityIds || []).filter((n) => Number.isFinite(n)) as number[];
    return new Set<number>(list);
  }, [allowedUniKey]);

  // ---- helpers ----
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

    pushRef.current({
      type: "warning",
      title: "กรุณาเข้าสู่ระบบ",
      message: "คุณต้องเข้าสู่ระบบก่อนใช้งานหน้านี้",
      duration: 2200,
    });
  }, [loginToastKey]);

  const clearLoginToastFlag = useCallback(() => {
    try {
      sessionStorage.removeItem(loginToastKey);
    } catch {}
  }, [loginToastKey]);

  const redirectingRef = useRef(false);

  const redirectLogin = useCallback(() => {
    if (!guard) return;
    if (pathname === "/login") return;

    // ✅ กัน redirect ซ้อน
    if (redirectingRef.current) return;
    redirectingRef.current = true;

    toastLoginOnce();

    const to = redirectTo.startsWith("/") ? redirectTo : `/${redirectTo}`;

    const next =
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search || ""}`
        : pathname;

    router.replace(`${to}?next=${encodeURIComponent(next || "/")}`);

    // ปลดล็อคภายหลังสั้นๆ กันกรณี user กลับมาเร็ว
    setTimeout(() => {
      redirectingRef.current = false;
    }, 800);
  }, [guard, pathname, redirectTo, router, toastLoginOnce]);

  const redirectHomeDenied = useCallback(() => {
    if (!guard) return;

    if (redirectingRef.current) return;
    redirectingRef.current = true;

    pushRef.current({
      type: "error",
      title: "ไม่มีสิทธิ์เข้าถึง",
      message: "บัญชีนี้ไม่สามารถเข้าหน้านี้ได้",
      duration: 2400,
    });

    router.replace("/");

    setTimeout(() => {
      redirectingRef.current = false;
    }, 800);
  }, [guard, router]);

  const verifyOnce = useCallback(async (): Promise<VerifyResult> => {
    const data = await authApi.me();
    const acc = data?.account;

    if (!data?.valid || !acc) return { ok: false, reason: "UNAUTH" };

    // role guard
    if (!allowedRoleSet.has(acc.role as Role)) {
      return { ok: false, reason: "FORBIDDEN" };
    }

    // tenant required
    if (requireTenant) {
      const activeUni = (acc as any).activeUniversityId as number | null | undefined;
      if (!activeUni) return { ok: false, reason: "NO_TENANT" };
    }

    // optional allowed university restriction
    if (allowedUniSet.size > 0) {
      const activeUni = (acc as any).activeUniversityId as number | null | undefined;
      const allowedUnis = Array.isArray((acc as any).allowedUniversityIds)
        ? ((acc as any).allowedUniversityIds as number[])
        : [];

      const ok =
        (activeUni != null && allowedUniSet.has(activeUni)) ||
        allowedUnis.some((u) => allowedUniSet.has(u));

      if (!ok) return { ok: false, reason: "UNI_NOT_ALLOWED" };
    }

    return { ok: true, user: acc };
  }, [allowedRoleSet, allowedUniSet, requireTenant]);

  const inflightRef = useRef<Promise<void> | null>(null);

  const verify = useCallback(async () => {
    // ✅ dedupe (ถ้า verify อยู่แล้วให้ใช้ตัวเดิม)
    if (inflightRef.current) return inflightRef.current;

    const run = (async () => {
      if (!mountedRef.current) return;
      setIsLoading(true);

      try {
        const result = await verifyOnce();

        if (!mountedRef.current) return;

        if (result.ok) {
          clearLoginToastFlag();
          setUser(result.user as TUser);
          return;
        }

        // fail cases
        setUser(null);

        if (result.reason === "UNAUTH" || result.reason === "NO_TENANT") {
          redirectLogin();
          return;
        }

        // forbidden / uni not allowed
        redirectHomeDenied();
      } catch {
        if (!mountedRef.current) return;
        setUser(null);
        redirectLogin();
      } finally {
        if (!mountedRef.current) return;
        setIsLoading(false);
        inflightRef.current = null;
      }
    })();

    inflightRef.current = run;
    return run;
  }, [clearLoginToastFlag, redirectHomeDenied, redirectLogin, verifyOnce]);

  // ---- init + listen auth-changed (NO pathname-based re-verify) ----
  const didInitRef = useRef(false);

  useEffect(() => {
    if (pathname === "/login") {
      setIsLoading(false);
      return;
    }

    if (!didInitRef.current) {
      didInitRef.current = true;
      verify();
    }

    const onAuthChanged = () => verify();
    window.addEventListener("auth-changed", onAuthChanged);

    return () => {
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
