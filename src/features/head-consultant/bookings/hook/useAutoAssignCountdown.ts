// src/features/head-consultant/bookings/hook/useAutoAssignCountdown.ts

import { useState, useEffect, useRef } from "react";

/** ระยะเวลารอก่อน auto-assign (ms) — ตั้งค่าจาก ENV: NEXT_PUBLIC_AUTO_ASSIGN_DELAY_SEC (default: 30) */
const delaySec = Number(process.env.NEXT_PUBLIC_AUTO_ASSIGN_DELAY_SEC) || 30;
export const AUTO_ASSIGN_DELAY_MS = delaySec * 1000;

export function useAutoAssignCountdown(
  createdAtStr: string,
  isPending: boolean,
  onExpire?: () => void,
) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const expiredRef = useRef(false);

  useEffect(() => {
    // Reset when a new booking comes in
    expiredRef.current = false;
  }, [createdAtStr]);

  useEffect(() => {
    if (!isPending) {
      setTimeLeft(null);
      return;
    }

    const createdTime = new Date(createdAtStr).getTime();
    if (Number.isNaN(createdTime)) {
      setTimeLeft(null);
      return;
    }

    const targetTime = createdTime + AUTO_ASSIGN_DELAY_MS;

    const intervalId = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, targetTime - now);
      setTimeLeft(diff);

      if (diff <= 0) {
        clearInterval(intervalId);
        // ✅ เรียก onExpire ครั้งเดียวเมื่อหมดเวลา
        if (!expiredRef.current && onExpire) {
          expiredRef.current = true;
          onExpire();
        }
      }
    }, 1000);

    // Initial calculation so we don't wait 1 second
    const now = Date.now();
    const initDiff = Math.max(0, targetTime - now);
    setTimeLeft(initDiff);

    // ถ้าหมดเวลาแล้วตั้งแต่แรก → fire onExpire ทันที
    if (initDiff <= 0 && !expiredRef.current && onExpire) {
      expiredRef.current = true;
      // delay เล็กน้อยเพื่อไม่ให้ fire ระหว่าง render
      setTimeout(() => onExpire(), 0);
    }

    return () => clearInterval(intervalId);
  }, [createdAtStr, isPending, onExpire]);

  if (timeLeft === null || timeLeft <= 0) return null;

  const m = Math.floor(timeLeft / 1000 / 60);
  const s = Math.floor((timeLeft / 1000) % 60);

  return `${m}:${s.toString().padStart(2, "0")}`;
}
