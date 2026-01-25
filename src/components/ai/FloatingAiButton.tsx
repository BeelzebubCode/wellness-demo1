// src/components/ai/FloatingAiButton.tsx
"use client";

import { MessageCircle } from "lucide-react";
import { useAiWidget } from "@/features/ai/widget/useAiWidget";
import { useRoleAuth } from "@/features/auth/hooks/useRoleAuth";

export function FloatingAiButton() {
  const openChat = useAiWidget((s) => s.openChat);

  // ✅ ใช้ hook ที่นายมีอยู่แล้ว
  // guard:false => ไม่ redirect / ไม่ toast เด้ง
  // requireTenant:false => กันกรณีบางหน้ามี tenant ยังไม่พร้อม
  const { user, isLoading } = useRoleAuth({
    allowedRoles: ["STUDENT"] as const,
    loginToastKey: "ai_widget_login",
    guard: false,
    requireTenant: false,
  });

  // กันกระพริบ (ตอนกำลังเช็ค me)
  if (isLoading) return null;

  // ✅ เห็นเฉพาะ student
  if (!user || user.role !== "STUDENT") return null;

  return (
    <button
      type="button"
      onClick={openChat}
      aria-label="AI Chat"
      className="
        fixed left-5 bottom-5 z-[60]
        h-14 w-14 rounded-full
        bg-primary-600 text-white shadow-lg
        hover:bg-primary-700 active:scale-95
        flex items-center justify-center
        transition
      "
    >
      <MessageCircle className="h-6 w-6" />
    </button>
  );
}
