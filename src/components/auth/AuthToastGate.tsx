"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import { useNotificationContext } from "@/components/notification/NotificationProvider";

const STORAGE_KEY = "auth_toast_gate_once_v3";

export default function AuthToastGate() {
  const { push } = useNotificationContext();
  const pathname = usePathname();

  useLayoutEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const login = params.get("login");
    const logout = params.get("logout");
    const name = params.get("name") || "";

    if (login !== "1" && logout !== "1") return;

    const key = `${window.location.origin}${pathname}?${params.toString()}`;

    // ✅ กันซ้ำ (StrictMode / re-mount)
    try {
      const last = sessionStorage.getItem(STORAGE_KEY);
      if (last === key) return;
      sessionStorage.setItem(STORAGE_KEY, key);
    } catch {}

    params.delete("login");
    params.delete("logout");
    params.delete("name");

    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    window.history.replaceState({}, "", nextUrl);

    // ✅ ยิง toast ทันที (เร็วกว่า useEffect)
    if (logout === "1") {
      push({
        type: "success",
        title: "ออกจากระบบสำเร็จ",
        message: "แล้วพบกันใหม่ 👋",
        duration: 1500,
      });
    } else if (login === "1") {
      push({
        type: "success",
        title: "เข้าสู่ระบบสำเร็จ",
        message: name ? `ยินดีต้อนรับ ${name}` : "ยินดีต้อนรับ",
        duration: 1200,
      });
    }

    // ✅ เคลียร์ key หลัง toast หมดอายุ ให้ครั้งถัดไปทำงานได้
    const t = window.setTimeout(() => {
      try {
        if (sessionStorage.getItem(STORAGE_KEY) === key) {
          sessionStorage.removeItem(STORAGE_KEY);
        }
      } catch {}
    }, 2200);

    return () => window.clearTimeout(t);
  }, [pathname, push]);

  return null;
}
