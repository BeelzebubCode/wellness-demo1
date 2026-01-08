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

export function useStudentAuth(redirectTo = "/login") {
  const router = useRouter();
  const pathname = usePathname();
  const { push } = useNotificationContext();

  const [user, setUser] = useState<StudentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const toastLoginOnce = () => {
      try {
        if (sessionStorage.getItem(LOGIN_TOAST_KEY) === "1") return;
        sessionStorage.setItem(LOGIN_TOAST_KEY, "1");
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
      if (pathname === "/login") return;

      toastLoginOnce();

      const next = pathname && pathname !== "/login" ? pathname : "/booking";
      router.replace(`${redirectTo}?next=${encodeURIComponent(next)}`);
      router.refresh();
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
          router.refresh();
          return;
        }

        // ✅ ผ่านแล้ว เคลียร์ flag กัน toast ค้าง
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
