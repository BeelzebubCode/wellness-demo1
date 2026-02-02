// src/components/ai/FloatingAiButton.tsx
"use client";

import { useAiWidget } from "@/features/ai/widget/useAiWidget";
import { useRoleAuth } from "@/features/auth/hooks/useRoleAuth";

export default function FloatingAiButton() {
  const openChat = useAiWidget((s) => s.openChat);

  const { user, isLoading } = useRoleAuth({
    allowedRoles: ["STUDENT"] as const,
    loginToastKey: "ai_widget_login",
    guard: false,
    requireTenant: false,
  });

  if (isLoading) return null;
  if (!user || user.role !== "STUDENT") return null;

  return (
    <button
      type="button"
      onClick={() => openChat("booking_agent")}
      className="fixed bottom-5 right-5 z-[60] bg-transparent p-0 active:scale-95"
    >
      <img
        src="/icons/Gif_Icon.gif"
        alt="AI Chat"
        className="w-32 h-32 object-contain pointer-events-none"
      />
    </button>
  );
}
