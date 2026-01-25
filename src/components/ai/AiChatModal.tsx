"use client";

import { Modal } from "@/components/ui/Modal";
import { useAiWidget } from "@/features/ai/widget/useAiWidget";
import { useRoleAuth } from "@/features/auth/hooks/useRoleAuth";
import AiChatPage from "@/components/ai/AiChatPage";

export function AiChatModal() {
  const open = useAiWidget((s) => s.open);
  const closeChat = useAiWidget((s) => s.closeChat);

  const { user, isLoading } = useRoleAuth({
    allowedRoles: ["STUDENT"] as const,
    loginToastKey: "ai_widget_login",
    guard: false,
    requireTenant: false,
  });

  if (isLoading) return null;
  if (!user || user.role !== "STUDENT") return null;

  return (
    <Modal open={open} onOpenChange={(v) => (v ? null : closeChat())} title="AI ผู้ช่วย">
      <div className="h-[70vh] w-[min(420px,90vw)]">
        {/* ✅ เปลี่ยนโหมดตรงนี้ */}
        <AiChatPage variant="modal" mode="booking_agent" />
      </div>
    </Modal>
  );
}
