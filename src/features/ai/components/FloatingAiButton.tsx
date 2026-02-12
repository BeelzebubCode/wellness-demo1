// src/components/ai/FloatingAiButton.tsx
"use client";

import { useCallback } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useAiWidget } from "@/features/ai/widget/useAiWidget";
import { useRoleAuth } from "@/features/auth/hooks/useRoleAuth";

export default function FloatingAiButton() {
  const openChat = useAiWidget((s) => s.openChat);
  const isOpen = useAiWidget((s) => s.open); // 👈 กันกดซ้ำ

  const { user, isLoading } = useRoleAuth({
    allowedRoles: ["STUDENT"] as const,
    loginToastKey: "ai_widget_login",
    guard: false,
    requireTenant: false,
  });

  const onClick = useCallback(() => {
    if (isOpen) return;
    openChat("booking_agent");
  }, [isOpen, openChat]);

  const pathname = usePathname();

  if (isLoading) return null;
  if (!user || user.role !== "STUDENT") return null;
  // Hide on AI chat page to avoid duplication
  if (pathname?.includes("/help/ai")) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="เปิด AI Booking Assistant"
      title="คุยกับ AI ช่วยจองคิว"
      className="
        fixed bottom-5 right-5 z-[60]
        bg-transparent p-0
        transition
        hover:scale-105
        active:scale-95
        focus:outline-none
      "
    >
      <Image
        src="/icons/Gif_Icon.gif"
        alt=""
        width={128}
        height={128}
        aria-hidden
        className="h-32 w-32 object-contain pointer-events-none select-none"
        priority
        unoptimized
      />
    </button>
  );
}
