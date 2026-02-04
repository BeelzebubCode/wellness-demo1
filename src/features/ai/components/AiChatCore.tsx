// src/features/ai/components

"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAiChat } from "@/features/ai/hooks/useAiChat";
import { Card } from "@/components/ui/Card";

import AiChatHeader from "./AiChatHeader";
import AiChatMessages from "./AiChatMessages";
import AiChatInput from "./AiChatInput";

import styles from "./aiChatTheme.module.css";
import { cn } from "@/lib/cn";

export type AiChatMode = "help" | "booking_agent";

type Props = {
  mode: AiChatMode;
  variant: "page" | "modal";
  onModeChange?: (mode: AiChatMode) => void;
};

export default function AiChatCore({ mode, variant, onModeChange }: Props) {
  const router = useRouter();

  const chat = useAiChat({
    mode,
    onConfirmed: () => router.refresh(),
  });

  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [chat.messages.length, chat.isLoading]);

  const content = (
    // ✅ ครอบ root แค่ตรงนี้พอ (ทั้ง chat)
    <div className={cn(styles.root, "flex h-full min-h-0 flex-col")}>
      <AiChatHeader mode={mode} onModeChange={onModeChange} />

      {/* ✅ min-h-0 ช่วยให้ส่วน messages scroll ถูก */}
      <AiChatMessages
        ref={listRef}
        mode={mode}
        messages={chat.messages}
        isLoading={chat.isLoading}
      />

      <AiChatInput mode={mode} chat={chat} />
    </div>
  );

  if (variant === "modal") return content;

  return (
    <div className="mx-auto max-w-6xl px-4 py-4">
      <Card
        className="flex  h-[calc(90vh-90px)] 
        flex-col overflow-hidden 
        rounded-[16px] 
        border-0 
        border-slate-100 
        bg-white 
        shadow-none"
      >
        {content}
      </Card>
    </div>
  );
}
