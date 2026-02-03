// src/features/ai/components/AiChatInput.tsx
"use client";

import { RotateCcw, Send, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import type { useAiChat } from "@/features/ai/hooks/useAiChat";
import { cn } from "@/lib/cn";
import styles from "./aiChatTheme.module.css";

export type AiChatMode = "help" | "booking_agent";
export type AiChatController = ReturnType<typeof useAiChat>;

export default function AiChatInput({
  mode = "help",
  chat,
}: {
  mode?: AiChatMode;
  chat: AiChatController;
}) {
  const { input, setInput, send, reset, isLoading, canSend, agent, confirmAgentAction } = chat;
  const showConfirm = mode === "booking_agent" && !!agent?.confirmToken;

  return (
    <div className={cn(styles.root, "sticky bottom-0 z-10 border-t border-slate-200 bg-white px-5 py-3")}>
      {showConfirm && (
        <button
          type="button"
          onClick={confirmAgentAction}
          disabled={isLoading}
          className={cn(
            styles.hintList,
            "mb-3 w-full rounded-xl bg-emerald-600 py-2.5 text-white disabled:opacity-60",
          )}
        >
          <CheckCircle2 className="mr-2 inline h-4 w-4" />
          ยืนยัน
        </button>
      )}

      <div className="flex items-center gap-2">
        {/* reset */}
        <button
          type="button"
          onClick={reset}
          disabled={isLoading}
          className="
            inline-flex h-9 w-9 items-center justify-center
            rounded-xl border border-slate-200
            bg-white text-slate-500
            hover:bg-slate-50
            disabled:opacity-40
          "
          aria-label="เริ่มใหม่"
          title="เริ่มใหม่"
        >
          <RotateCcw className="h-4 w-4" />
        </button>

        {/* input pill */}
        <div
          className="
            flex h-10 flex-1 items-center gap-2
            rounded-2xl border border-slate-200
            bg-slate-50/60 px-3
            transition
            focus-within:border-primary-400
            focus-within:ring-2 focus-within:ring-primary-100
          "
        >
          <Input
            variant="bare" // ✅ สำคัญ: ไม่เอา wrapper ของ Input เดิม
            value={input}
            placeholder={
              mode === "booking_agent"
                ? 'พิมพ์คำขอจอง/ยกเลิก เช่น "พรุ่งนี้ 14:00"'
                : "พิมพ์คำถามได้เลย…"
            }
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            disabled={isLoading}
            className={cn(
              styles.inputText,
              "w-full bg-transparent outline-none border-0",
              "placeholder:text-slate-400 placeholder:opacity-80",
            )}
          />
        </div>

        {/* send */}
        <button
          type="button"
          onClick={send}
          disabled={!canSend}
          className="
            inline-flex h-9 w-9
            items-center justify-center
            rounded-xl
            text-slate-500
            hover:bg-slate-100
            disabled:opacity-40
          "
          aria-label="ส่ง"
          title="ส่ง"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
