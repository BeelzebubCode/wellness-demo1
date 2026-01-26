"use client";

import { Bot } from "lucide-react";
import { AiChatMode } from "./AiChatCore";

export default function AiChatHeader({ mode }: { mode: AiChatMode }) {
  return (
    <div
      className="
        sticky top-0 z-10
        flex items-center justify-between
        border-b border-slate-200
        bg-white px-6 py-4
      "
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border">
          <Bot className="h-5 w-5 text-slate-700" />
        </div>
        <div className="text-[15px] font-semibold">
          {mode === "booking_agent"
            ? "AI Agent จองคิว / ยกเลิก"
            : "AI Help Center"}
        </div>
      </div>

      <div className="text-xs text-slate-400">
        {mode === "booking_agent" ? "Plan → Confirm" : "Help-only"}
      </div>
    </div>
  );
}
