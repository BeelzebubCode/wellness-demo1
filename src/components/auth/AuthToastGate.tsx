"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useNotificationContext } from "@/components/notification/NotificationProvider";

const STORAGE_KEY = "auth_toast_seen_ids";

function getSeenSet(): Set<string> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const arr: string[] = raw ? JSON.parse(raw) : [];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

function saveSeenSet(set: Set<string>) {
  try {
    // เก็บแค่ล่าสุด 30 อันพอ กัน storage บวม
    const arr = Array.from(set).slice(-30);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  } catch {}
}

export default function AuthToastGate() {
  const { push } = useNotificationContext();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    // ✅ ใช้ param กลางชุดเดียว: toast=login|logout, toastId=xxxx, name=...
    const toast = searchParams.get("toast"); // "login" | "logout"
    const toastId = searchParams.get("toastId") || "";
    const name = searchParams.get("name") || "";

    if (!toast || !toastId) return;

    const seen = getSeenSet();
    if (seen.has(toastId)) return; // ✅ กันซ้ำแบบชัวร์

    // ✅ ลบ param ออกจาก URL ก่อน (กัน refresh แล้วเด้งซ้ำ)
    const params = new URLSearchParams(searchParams.toString());
    params.delete("toast");
    params.delete("toastId");
    params.delete("name");

    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    window.history.replaceState({}, "", nextUrl);

    // ✅ mark seen
    seen.add(toastId);
    saveSeenSet(seen);

    // ✅ ค่อยยิง toast
    if (toast === "logout") {
      push({
        type: "success",
        title: "ออกจากระบบสำเร็จ",
        message: "แล้วพบกันใหม่ 👋",
        duration: 1500,
      });
    } else if (toast === "login") {
      push({
        type: "success",
        title: "เข้าสู่ระบบสำเร็จ",
        message: name ? `ยินดีต้อนรับ ${name}` : "ยินดีต้อนรับ",
        duration: 1200,
      });
    }
  }, [searchParams, pathname, push]);

  return null;
}
