// src/features/ai/components/ChatMessage.tsx

"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/cn";

export default function ChatMessage({
  role,
  content,
}: {
  role: "user" | "assistant";
  content: string;
}) {
  const isUser = role === "user";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          isUser ? "max-w-[70%]" : "max-w-[80%]",
          // ✅ ขนาด “ปกติ” แบบ UI ทั่วไป (ปรับได้: 12/18 หรือ 13/19)
          "!text-[13px] !leading-[19px]",
          "px-3 py-2 rounded-xl break-words",
          isUser ? "whitespace-pre-wrap bg-black text-white" : "bg-white text-slate-900 border border-slate-100",
        )}
      >
        {isUser ? (
          <span className="block">{content}</span>
        ) : (
          // ✅ บังคับให้ markdown inherit font จาก bubble (กันโดน CSS อื่นทับ)
          <div className="!text-[13px] !leading-[19px]">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // ✅ ไม่กำหนด font-size ซ้ำ ข้างในคุมแค่ “ระยะ” ให้ดูปกติ
                p: ({ children }) => <p className="my-1">{children}</p>,

                ul: ({ children }) => (
                  <ul className="my-1 pl-4 list-disc list-outside">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="my-1 pl-4 list-decimal list-outside">
                    {children}
                  </ol>
                ),
                li: ({ children }) => <li className="my-0">{children}</li>,

                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,

                // inline code เล็กลงนิดเดียวพอ
                code: ({ children }) => (
                  <code className="rounded bg-slate-100 px-1 py-0.5 text-[12px]">
                    {children}
                  </code>
                ),

                a: ({ children, ...props }) => (
                  <a
                    {...props}
                    className="underline underline-offset-2 text-blue-600 hover:text-blue-700"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {children}
                  </a>
                ),

                // code block (ถ้ามี) ให้ไม่ใหญ่
                pre: ({ children }) => (
                  <pre className="my-1 overflow-x-auto rounded bg-slate-50 p-2 text-[12px] leading-[16px] border border-slate-100">
                    {children}
                  </pre>
                ),
              }}
            >
              {String(content || "")}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
