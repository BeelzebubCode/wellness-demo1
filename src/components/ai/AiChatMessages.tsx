"use client";

import { forwardRef } from "react";
import { Bot } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import ChatMessage from "./ChatMessage";
import { AiChatMode } from "./AiChatCore";

type Props = {
  mode: AiChatMode;
  messages: { role: "user" | "assistant"; content: string }[];
  isLoading: boolean;
};

const AiChatMessages = forwardRef<HTMLDivElement, Props>(
  ({ mode, messages, isLoading }, ref) => {
    return (
      <div
        ref={ref}
        className="flex-1 overflow-y-auto px-6 py-6 bg-white"
      >
        {messages.length === 0 ? (
          <div className="mx-auto mt-10 max-w-md rounded-2xl border bg-white p-5 text-sm">
            <div className="mb-2 flex items-center gap-2 font-semibold">
              <Bot className="h-4 w-4" />
              เริ่มถามได้เลย
            </div>
            <ul className="list-disc space-y-1 pl-5 text-slate-600">
              {mode === "booking_agent" ? (
                <>
                  <li>จองพรุ่งนี้ช่วงบ่าย</li>
                  <li>อยากได้ 10:00 - 12:00</li>
                  <li>ยกเลิก bookingId 123</li>
                </>
              ) : (
                <>
                  <li>จองคิวยังไง</li>
                  <li>ดูตารางนัดตรงไหน</li>
                  <li>ยกเลิกนัดได้ไหม</li>
                </>
              )}
            </ul>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((m, i) => (
              <ChatMessage key={i} role={m.role} content={m.content} />
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Spinner /> กำลังพิมพ์...
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

AiChatMessages.displayName = "AiChatMessages";
export default AiChatMessages;
