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
          // bubble width
          "max-w-[88%] md:max-w-[72%]",

          // bubble style
          "rounded-2xl px-4 py-3 text-[13px] leading-relaxed",
          "break-words whitespace-normal",

          // color
          isUser
            ? "bg-primary-600 text-white"
            : "bg-white text-slate-900 border border-slate-200 shadow-sm",
        )}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ children }) => <p className="m-0">{children}</p>,

            ul: ({ children }) => (
              <ul className="my-2 list-disc pl-5 space-y-1">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="my-2 list-decimal pl-5 space-y-1">{children}</ol>
            ),
            li: ({ children }) => <li className="m-0">{children}</li>,

            strong: ({ children }) => (
              <strong className="font-semibold">{children}</strong>
            ),

            code: ({ children }) => (
              <code
                className={cn(
                  "rounded-md px-1 py-0.5 text-[12px]",
                  isUser ? "bg-white/20" : "bg-slate-100",
                )}
              >
                {children}
              </code>
            ),

            a: ({ children, ...props }) => (
              <a
                {...props}
                className={cn(
                  "underline underline-offset-2",
                  isUser ? "text-white" : "text-primary-700",
                )}
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
      </div>
    </div>
  );
}
