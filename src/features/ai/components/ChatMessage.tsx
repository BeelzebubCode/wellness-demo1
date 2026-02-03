// src/features/ai/components/ChatMessage.tsx
"use client";

import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/cn";
import styles from "./aiChatTheme.module.css";

export default function ChatMessage({
  role,
  content,
}: {
  role: "user" | "assistant";
  content: string;
}) {
  const isUser = role === "user";

  const mdComponents = useMemo(
    () => ({
      p: ({ children }: any) => <p>{children}</p>,
      ul: ({ children }: any) => <ul>{children}</ul>,
      ol: ({ children }: any) => <ol>{children}</ol>,
      li: ({ children }: any) => <li>{children}</li>,
      strong: ({ children }: any) => <strong>{children}</strong>,
      code: ({ children }: any) => <code>{children}</code>,
      pre: ({ children }: any) => <pre>{children}</pre>,
      a: ({ children, ...props }: any) => (
        <a {...props} target="_blank" rel="noreferrer">
          {children}
        </a>
      ),
    }),
    [],
  );

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          styles.msg,
          isUser ? "max-w-[70%]" : "max-w-[80%]",
          "px-3 py-2 rounded-xl break-words",
          isUser
            ? "whitespace-pre-wrap bg-black text-white"
            : "bg-white text-slate-900 border border-slate-100",
        )}
      >
        {isUser ? (
          <span className="block">{content}</span>
        ) : (
          <div className={styles.md}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
              {String(content || "")}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
