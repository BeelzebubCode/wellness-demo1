"use client";

import { useEffect, useRef } from "react";
import { useAiChat } from "@/features/ai/hooks/useAiChat";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";

function ChatBubble({
  role,
  content,
}: {
  role: "user" | "assistant";
  content: string;
}) {
  const isUser = role === "user";
  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={[
          "max-w-[78%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm shadow-sm",
          isUser
            ? "bg-black text-white"
            : "bg-white border border-gray-200 text-gray-900",
        ].join(" ")}
      >
        {content}
      </div>
    </div>
  );
}

export default function AiChatPage() {
  const { messages, input, setInput, send, reset, isLoading, error, canSend } = useAiChat();
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isLoading]);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">AI Help Center</h1>
          <p className="text-sm text-gray-600">
            ถามเรื่องการใช้งานระบบได้เลย (Help-only • ไม่ทำรายการแทนผู้ใช้)
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" onClick={reset} disabled={isLoading}>
            เริ่มใหม่
          </Button>
        </div>
      </div>

      <Card className="flex h-[70vh] flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {messages.map((m, idx) => (
              <ChatBubble key={idx} role={m.role} content={m.content} />
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Spinner /> กำลังพิมพ์...
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        <div className="border-t bg-gray-50 p-3">
          {error && (
            <div className="mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-2">
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
            />
            <Button onClick={send} disabled={!canSend}>
              ส่ง
            </Button>
          </div>

          <p className="mt-2 text-xs text-gray-500">
            ถ้าถามเรื่องข้อมูลส่วนตัว/นัดหมาย ระบบอาจแนะนำให้เข้าสู่ระบบและไปที่เมนูที่เกี่ยวข้อง
          </p>
        </div>
      </Card>
    </div>
  );
}
