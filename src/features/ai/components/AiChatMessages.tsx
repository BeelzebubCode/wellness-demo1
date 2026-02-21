"use client";

import { forwardRef } from "react";
import { Bot } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import ChatMessage from "./ChatMessage";
import { AiChatMode } from "./AiChatCore";
import { cn } from "@/lib/cn";

// ✅ ใช้ theme ตัวเดียวกันทั้งแชท (ถ้าคุณยังใช้ชื่อ aiChatTypography ก็เปลี่ยนชื่อไฟล์ให้ตรง)
import styles from "./aiChatTheme.module.css";

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
        className={cn(
          styles.root,
          "flex-1 min-h-0 overflow-y-auto bg-slate-50 py-4 pb-6",
        )}
      >
        {/* Centered container matching input width */}
        <div className="mx-auto max-w-4xl px-6">
          {messages.length === 0 ? (
            <div className="mx-auto mt-3 max-w-[520px] rounded-2xl border-0 border-slate-200 bg-white p-4">
              {/* ✅ คุมฟอนต์จาก CSS module */}
              <div className={cn("mb-2 flex items-center gap-2 font-semibold text-slate-800", styles.headerTitle)}>
                <Bot className="h-4 w-4" />
                AI Help Center
              </div>

              {/* ✅ hint list ใช้ class จาก CSS module แทน text-xs */}
              <ul className={cn("list-disc space-y-1 pl-5 text-slate-600", styles.hintList)}>
                {mode === "booking_agent" ? (
                  <>
                    <li>จองพรุ่งนี้ช่วงบ่าย</li>
                    <li>อยากได้ 10:00 - 12:00</li>
                    <li>ยกเลิกคิวยังไง</li>
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
                <div className={cn("flex items-center gap-2 px-1 text-slate-500", styles.hintList)}>
                  <Spinner className="h-3 w-3" />
                  กำลังพิมพ์...
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  },
);

AiChatMessages.displayName = "AiChatMessages";
export default AiChatMessages;
