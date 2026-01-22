"use client";

import { useEffect, useRef } from "react";
import { useAiChat } from "@/features/ai/hooks/useAiChat";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { Bot, RotateCcw, Send } from "lucide-react";
import { cn } from "@/lib/cn";

function ChatBubble({
  role,
  content,
}: {
  role: "user" | "assistant";
  content: string;
}) {
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "flex w-full gap-2",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      {!isUser && (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white/90">
          <Bot className="h-4 w-4 text-slate-600" />
        </div>
      )}

      <div
        className={cn(
          "max-w-[82%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-slate-900 text-white shadow-sm"
            : "bg-white/95 border border-slate-200 text-slate-900 shadow-sm",
        )}
      >
        {content}
      </div>
    </div>
  );
}

export default function AiChatPage() {
  const { messages, input, setInput, send, reset, isLoading, error, canSend } =
    useAiChat();

  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length, isLoading]);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6">
      <Card className="flex h-[78vh] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white/70 backdrop-blur">
        {/* ===== Card Header ===== */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-200/70 bg-white/70 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white">
              <Bot className="h-4 w-4 text-slate-700" />
            </div>
            <div className="text-sm font-extrabold text-slate-900 leading-tight">
              AI Help Center
            </div>
          </div>

          {/* ✅ เอาปุ่ม reset ออกไปไว้แถบล่าง */}
          <div className="text-xs text-slate-500">Help-only</div>
        </div>

        {/* ===== Messages ===== */}
        <div ref={listRef} className="flex-1 overflow-y-auto px-5 py-5">
          {messages.length === 0 ? (
            <div className="mx-auto mt-8 max-w-md rounded-2xl border border-slate-200 bg-white/85 p-4 text-sm text-slate-700">
              <div className="mb-2 flex items-center gap-2 font-semibold">
                <Bot className="h-4 w-4 opacity-70" />
                เริ่มถามได้เลย
              </div>
              <ul className="list-disc space-y-1 pl-5 text-slate-600">
                <li>“จองคิวยังไง”</li>
                <li>“ดูตารางนัดของฉันตรงไหน”</li>
                <li>“ยกเลิกนัดทำได้ไหม”</li>
              </ul>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((m, idx) => (
                <ChatBubble key={idx} role={m.role} content={m.content} />
              ))}

              {isLoading && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Spinner /> กำลังพิมพ์...
                </div>
              )}
            </div>
          )}
        </div>

        {/* ===== Composer ===== */}
        <div className="border-t border-slate-200 bg-white/80 px-5 py-4">
          {error && (
            <div className="mb-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              ส่งข้อความไม่สำเร็จ · {error}
            </div>
          )}

          <div className="flex items-center gap-3">
            {/* Reset */}
            <button
              type="button"
              onClick={reset}
              disabled={isLoading}
              className="
                    inline-flex h-11 w-11 items-center justify-center
                    rounded-2xl border border-slate-200 bg-white
                    text-slate-600 hover:bg-slate-50
                    disabled:opacity-50 disabled:cursor-not-allowed
                    outline-none focus:outline-none focus-visible:outline-none
                "
              aria-label="เริ่มใหม่"
              title="เริ่มใหม่"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            {/* Input shell */}
            <div
              className="
                    flex h-11 flex-1 items-center
                    rounded-2xl border border-slate-200 bg-white px-4
                    transition hover:border-slate-300
                    outline-none
                    focus-within:border-slate-300
                    focus-within:ring-0 focus-within:ring-offset-0
                "
            >
              <Input
                value={input}
                placeholder='พิมพ์คำถาม เช่น "จองคิวยังไง"'
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                disabled={isLoading}
                className="
                    h-full w-full
                    appearance-none
                    border-0 bg-transparent px-0 py-0
                    !text-sm !leading-5 !font-normal
                    !placeholder:text-sm !placeholder:font-normal !placeholder:text-slate-400
                    text-slate-900
                    shadow-none
                    outline-none focus:outline-none focus-visible:outline-none
                    ring-0 ring-offset-0
                    focus:ring-0 focus:ring-offset-0
                    focus-visible:ring-0 focus-visible:ring-offset-0
                    !ring-0 !ring-offset-0
                "
              />
            </div>

            {/* Send icon only */}
            <button
              type="button"
              onClick={send}
              disabled={!canSend}
              className="
                    inline-flex h-11 w-11 items-center justify-center
                    rounded-2xl bg-slate-900 text-white
                    hover:bg-slate-800
                    disabled:bg-slate-300 disabled:cursor-not-allowed
                    outline-none focus:outline-none focus-visible:outline-none
                "
              aria-label="ส่ง"
              title="ส่ง"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>

          <p className="mt-2 text-[11px] text-slate-400">
            ถ้าถามเรื่องข้อมูลส่วนตัว ระบบอาจแนะนำให้เข้าสู่ระบบ
          </p>
        </div>
      </Card>
    </div>
  );
}
