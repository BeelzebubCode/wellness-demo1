// src/components/ai/AiChatModal.tsx
"use client";

import { createPortal } from "react-dom";
import { useAiWidget } from "@/features/ai/widget/useAiWidget";
import AiChatCore from "./AiChatCore";

export default function AiChatModal() {
  const open = useAiWidget((s) => s.open);
  const mode = useAiWidget((s) => s.mode);
  const closeChat = useAiWidget((s) => s.closeChat);

  if (!open) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[50] bg-black/30" onClick={closeChat} />

      <div
        className="
          fixed bottom-24 right-5 z-[60]
          h-[75vh]
          w-[92vw] max-w-[1200px]
          rounded-2xl bg-white shadow-2xl overflow-hidden
        "
      >
        <AiChatCore mode={mode} variant="modal" />
      </div>
    </>,
    document.body,
  );
}
