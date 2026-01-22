"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
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
    const arr = Array.from(set).slice(-30);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  } catch {}
}

export default function AuthToastGate() {
  const { push } = useNotificationContext();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  // ✅ กัน StrictMode dev ที่ effect รัน 2 รอบติด ๆ
  const handledRef = useRef<string>("");

  useEffect(() => {
    const toast = searchParams.get("toast"); // login | logout
    const toastId = searchParams.get("toastId") || "";
    const name = searchParams.get("name") || "";

    if (!toast || !toastId) return;

    // ✅ กันยิงซ้ำในรอบเดียวกัน (StrictMode)
    const key = `${toast}:${toastId}`;
    if (handledRef.current === key) return;
    handledRef.current = key;

    const seen = getSeenSet();
    if (seen.has(toastId)) return;

    // ✅ mark seen ก่อนเลย กันหลุด
    seen.add(toastId);
    saveSeenSet(seen);

    // ✅ ลบ param แบบ "นิ่ม" ด้วย router.replace (ไม่ใช้ replaceState)
    const params = new URLSearchParams(searchParams.toString());
    params.delete("toast");
    params.delete("toastId");
    params.delete("name");

    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;

    // ลบ query ก่อน แล้วค่อยยิง toast ในเฟรมถัดไป (ลดกระพริบ)
    router.replace(nextUrl, { scroll: false });

    // ✅ ให้หน้า render/transition เสร็จก่อนค่อย toast
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
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
      });
    });
  }, [searchParams, pathname, router, push]);

  return null;
}
