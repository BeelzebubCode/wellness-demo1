"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import type { ChatMessage } from "@/features/ai/api";
import { sendHelpChat } from "@/features/ai/api";

const MAX_HISTORY = 12;

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    role: "assistant",
    content:
      "สวัสดีครับ 🙂 ผมเป็นผู้ช่วยการใช้งานระบบ NU Wellness\nพิมพ์คำถามได้เลย เช่น “จองคิวยังไง” หรือ “เปลี่ยนมหาลัยยังไง”",
  },
];

export function useAiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const historyRef =
    useRef<ChatMessage[]>(INITIAL_MESSAGES) as MutableRefObject<ChatMessage[]>;

  const canSend = useMemo(
    () => input.trim().length > 0 && !isLoading,
    [input, isLoading]
  );

  const send = useCallback(async () => {
    if (!canSend) return;

    const text = input.trim();
    setInput("");
    setError(null);
    setLoading(true);

    setMessages((prev) => {
      const next = [...prev, { role: "user", content: text }].slice(-MAX_HISTORY);
      historyRef.current = next;
      return next;
    });

    try {
      const { reply } = await sendHelpChat(historyRef.current);

      setMessages((prev) => {
        const next = [...prev, { role: "assistant", content: String(reply ?? "") }].slice(
          -MAX_HISTORY
        );
        historyRef.current = next;
        return next;
      });
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }, [canSend, input]);

  const reset = useCallback(() => {
    const initial: ChatMessage[] = [
      {
        role: "assistant",
        content:
          "เริ่มใหม่ได้เลยครับ 🙂\nถามเรื่องการใช้งานเว็บ เช่น “จองคิวยังไง” หรือ “ดูประวัติการจองอยู่ตรงไหน”",
      },
    ];
    historyRef.current = initial;
    setMessages(initial);
    setInput("");
    setError(null);
    setLoading(false);
  }, []);

  return { messages, input, setInput, send, reset, isLoading, error, canSend };
}
