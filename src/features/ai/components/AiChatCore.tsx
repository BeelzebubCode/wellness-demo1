// src/features/ai/components

"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAiChat } from "@/features/ai/hooks/useAiChat";
import { Card } from "@/components/ui/Card";

import AiChatHeader from "./AiChatHeader";
import AiChatMessages from "./AiChatMessages";
import AiChatInput from "./AiChatInput";

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
    <>
      <AiChatHeader mode={mode} onModeChange={onModeChange} />
      <AiChatMessages
        ref={listRef}
        mode={mode}
        messages={chat.messages}
        isLoading={chat.isLoading}
      />
      <AiChatInput mode={mode} chat={chat} />
    </>
  );

  if (variant === "modal") {
    return <div className="flex h-full flex-col">{content}</div>;
  }

  return (
    <div className="mx-auto max-w-5xl px-2 py-4">
      <Card
        className="
          flex h-[75vh] flex-col
          overflow-hidden
          rounded-[20px]
          border border-slate-200
          bg-white
        "
      >
        {content}
      </Card>
    </div>
  );
}
