// src/components/ai/AiChatModal.tsx
"use client";

import { createPortal } from "react-dom";
import { useAiWidget } from "@/features/ai/widget/useAiWidget";
import AiChatCore from "./AiChatCore";

export default function AiChatModal() {
  const open = useAiWidget((s) => s.open);
  const closeChat = useAiWidget((s) => s.closeChat);

  if (!open) return null;

  return createPortal(
    <>
      {/* backdrop */}
      <div
        className="fixed inset-0 z-[50] bg-black/30"
        onClick={closeChat}
      />

      {/* floating chat */}
      <div className="fixed bottom-24 right-5 z-[60] h-[65vh] w-[550px] rounded-2xl bg-white shadow-2xl overflow-hidden">
        <AiChatCore mode="help" variant="modal" />
      </div>
    </>,
    document.body
  );
}
