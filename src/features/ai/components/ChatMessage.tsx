// src/features/ai/components/ChatMessage.tsx
"use client";

import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, User } from "lucide-react";
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
    <div
      className={cn(
        styles.slideIn, // Add entrance animation
        styles.msgContainer,
        isUser ? styles.userContainer : styles.aiContainer
      )}
    >
      {/* AI Avatar (Left) */}
      {!isUser && (
        <div className={cn(styles.avatar, styles.aiAvatar)}>
          <Bot size={24} />
        </div>
      )}

      {/* Message Bubble */}
      <div
        className={cn(
          styles.msg,
          isUser ? styles.userMsg : styles.aiMsg
        )}
      >
        {isUser ? (
          <span className="block whitespace-pre-wrap">{content}</span>
        ) : (
          <div className={styles.md}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
              {String(content || "")}
            </ReactMarkdown>
          </div>
        )}
      </div>

      {/* User Avatar (Right) - Optional, but adds symmetry */}
      {isUser && (
        <div className={cn(styles.avatar, styles.userAvatar)}>
          <User size={24} />
        </div>
      )}
    </div>
  );
}
