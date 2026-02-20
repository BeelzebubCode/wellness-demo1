// src/features/head-consultant/bookings/hook/useAutoAssignCountdown.ts

import { useState, useEffect } from "react";

export function useAutoAssignCountdown(createdAtStr: string, isPending: boolean) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

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

    const targetTime = createdTime + 5 * 60 * 1000;

    const intervalId = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, targetTime - now);
      setTimeLeft(diff);

      if (diff <= 0) {
        clearInterval(intervalId);
      }
    }, 1000);

    // Initial calculation so we don't wait 1 second
    const now = Date.now();
    setTimeLeft(Math.max(0, targetTime - now));

    return () => clearInterval(intervalId);
  }, [createdAtStr, isPending]);

  if (timeLeft === null || timeLeft <= 0) return null;

  const m = Math.floor(timeLeft / 1000 / 60);
  const s = Math.floor((timeLeft / 1000) % 60);

  return `${m}:${s.toString().padStart(2, "0")}`;
}
