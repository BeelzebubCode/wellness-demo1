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
        className="
          flex-1 overflow-y-auto
          bg-slate-50
          px-4 sm:px-5
          py-4 pb-6
        "
      >
        {messages.length === 0 ? (
          <div className="mx-auto mt-3 max-w-[520px] rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Bot className="h-4 w-4" />
              AI Help Center
            </div>

            <ul className="list-disc space-y-1 pl-5 text-xs text-slate-600">
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
              <ChatMessage
                key={i}
                role={m.role}
                content={m.content}
              />
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 px-1 text-xs text-slate-500">
                <Spinner className="h-3 w-3" />
                กำลังพิมพ์...
              </div>
            )}
          </div>
        )}
      </div>
    );
  },
);

AiChatMessages.displayName = "AiChatMessages";
export default AiChatMessages;
