"use client";

import { useEffect, useRef } from "react";
import { useAiChat } from "@/features/ai/hooks/useAiChat";
import { Card } from "@/components/ui/Card";

import AiChatHeader from "./AiChatHeader";
import AiChatMessages from "./AiChatMessages";
import AiChatInput from "./AiChatInput";

export type AiChatMode = "help" | "booking_agent";

type Props = {
  mode: AiChatMode;
  variant: "page" | "modal";
};

export default function AiChatCore({ mode, variant }: Props) {
  const chat = useAiChat({ mode });
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [chat.messages.length, chat.isLoading]);

  const content = (
    <>
      <AiChatHeader mode={mode} />
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
          rounded-[28px]
          border border-slate-200
          bg-white
        "
      >
        {content}
      </Card>
    </div>
  );
}
