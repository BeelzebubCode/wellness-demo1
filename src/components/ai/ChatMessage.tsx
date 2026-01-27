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
    {/* 🔹 Bubble */}
          <div
            className={cn(
              // ความกว้างสูงสุดของ bubble
              isUser ? "max-w-[70%]" : "max-w-[80%]",

              // ขนาดตัวอักษร
              "text-sm leading-[20px]",

              // padding + shape
              "px-3 py-2 rounded-xl",
                    "break-words whitespace-pre-wrap",

              // ตัดคำ
              "break-words whitespace-pre-wrap",

              // สี
            isUser
              ? "bg-black text-white"
              : "bg-white text-slate-900 border border-slate-100",
            )}
          >
        {
        /* 
        ===============================
            USER → plain text (ไม่ markdown)
        =============================== 
        */
        }
        {isUser ? (
          <span className="block">{content}</span>
        ) : (
          /* 
          ===============================
              AI → markdown (ควบคุม spacing)
          =============================== 
          */
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              /* ===== AI TEXT BASE ===== */
              p: ({ children }) => (
                <p className="m-0 text-sm leading-[20px]">
                  {children}
                </p>
              ),

              ul: ({ children }) => (
                <ul className="m-0 list-disc list-inside text-sm leading-[20px]">
                  {children}
                </ul>
              ),

              ol: ({ children }) => (
                <ol className="m-0 list-decimal list-inside text-sm leading-[20px]">
                  {children}
                </ol>
              ),

              li: ({ children }) => (
                <li className="m-0">{children}</li>
              ),

              strong: ({ children }) => (
                <strong className="font-semibold">{children}</strong>
              ),

              code: ({ children }) => (
                <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">
                  {children}
                </code>
              ),

              a: ({ children, ...props }) => (
                <a
                  {...props}
                  className="underline underline-offset-2 text-primary-600"
                  target="_blank"
                  rel="noreferrer"
                >
                  {children}
                </a>
              ),
            }}
          >

            {String(content || "")}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}
