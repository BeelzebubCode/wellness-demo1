// src/features/auth/hooks/useStudentAuth.ts
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authApi } from "../api";
import type { AuthUser } from "../types";
import { useNotificationContext } from "@/components/notification/NotificationProvider";

type StudentUser = AuthUser & {
  role: "STUDENT";
};

const LOGIN_TOAST_KEY = "toast_login_required_student";
const SUPPRESS_TOAST_KEY = "suppress_login_toast_once";

export function useStudentAuth(redirectTo = "/login") {
  const router = useRouter();
  const pathname = usePathname();
  const { push } = useNotificationContext();

  const [user, setUser] = useState<StudentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // ✅ ถ้าอยู่หน้า login อยู่แล้ว ไม่ต้อง verify
    if (pathname === "/login") {
      setIsLoading(false);
      return () => {
        isMounted = false;
      };
    }

    const toastLoginOnce = () => {
      const COOLDOWN_MS = 3000; // ✅ ปรับได้: 3000 = 3 วิ
      try {
        if (sessionStorage.getItem(SUPPRESS_TOAST_KEY) === "1") {
          sessionStorage.removeItem(SUPPRESS_TOAST_KEY);
          return;
        }

        // ✅ ใช้ timestamp แทน "1"
        const last = Number(sessionStorage.getItem(LOGIN_TOAST_KEY) || "0");
        const now = Date.now();

        // ถ้ายังไม่ถึงคูลดาวน์ ก็ไม่ต้องเด้ง
        if (now - last < COOLDOWN_MS) return;

        sessionStorage.setItem(LOGIN_TOAST_KEY, String(now));
      } catch {
        // ignore
      }

      push({
        type: "warning",
        title: "กรุณาเข้าสู่ระบบ",
        message: "คุณต้องเข้าสู่ระบบก่อนใช้งานหน้านี้",
        duration: 2200,
      });
    };

    const clearLoginToastFlag = () => {
      try {
        sessionStorage.removeItem(LOGIN_TOAST_KEY);
      } catch {
        // ignore
      }
    };

    const redirectLogin = () => {
      // กันไว้ เผื่อ pathname เปลี่ยนระหว่างรัน
      if (pathname === "/login") return;

      toastLoginOnce();

      const next = pathname && pathname !== "/login" ? pathname : "/booking";
      router.replace(`${redirectTo}?next=${encodeURIComponent(next)}`);
    };

    const verify = async () => {
      try {
        const data = await authApi.verifyStudent();

        if (!isMounted) return;

        // ✅ ไม่ valid / ไม่มี account = ให้ล็อกอิน
        if (!data?.valid || !data?.account) {
          setUser(null);
          redirectLogin();
          return;
        }

        // ✅ valid แต่ role ไม่ตรง = ไม่มีสิทธิ์
        if (data.account.role !== "STUDENT") {
          setUser(null);

          push({
            type: "error",
            title: "ไม่มีสิทธิ์เข้าถึง",
            message: "บัญชีนี้ไม่สามารถเข้าหน้านักศึกษาได้",
            duration: 2400,
          });

          router.replace("/");
          return;
        }

        clearLoginToastFlag();
        setUser(data.account as StudentUser);
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
  }, [router, pathname, redirectTo, push]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
