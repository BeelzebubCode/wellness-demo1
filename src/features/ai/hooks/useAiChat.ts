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

/* ================================
   แปลง error ให้เป็นภาษาคน
================================ */
function friendlyErrorMessage(err: unknown): string {
  const msg = (err instanceof Error ? err.message : String(err ?? "")).toLowerCase();

  if (
    msg.includes("fetch failed") ||
    msg.includes("failed to fetch") ||
    msg.includes("network")
  ) {
    return "ไม่สามารถเชื่อมต่อระบบได้ กรุณาตรวจสอบอินเทอร์เน็ต แล้วลองใหม่อีกครั้ง";
  }

  if (msg.includes("401") || msg.includes("unauthorized")) {
    return "คุณยังไม่ได้เข้าสู่ระบบ หรือเซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่";
  }

  if (msg.includes("403") || msg.includes("forbidden")) {
    return "บัญชีของคุณไม่มีสิทธิ์ใช้งาน AI ช่วยเหลือ";
  }

  if (msg.includes("429") || msg.includes("rate")) {
    return "มีผู้ใช้งานพร้อมกันจำนวนมาก กรุณารอสักครู่แล้วลองใหม่";
  }

  if (msg.includes("500") || msg.includes("internal")) {
    return "ระบบขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้ง";
  }

  return "เกิดข้อผิดพลาดระหว่างส่งข้อความ กรุณาลองใหม่อีกครั้ง";
}

export function useAiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const historyRef =
    useRef<ChatMessage[]>(INITIAL_MESSAGES) as MutableRefObject<ChatMessage[]>;

  // ✅ เก็บ prompt ล่าสุดไว้ retry
  const lastPromptRef = useRef<string>("");

  const canSend = useMemo(
    () => input.trim().length > 0 && !isLoading,
    [input, isLoading]
  );

  const send = useCallback(async () => {
    if (!canSend) return;

    const text = input.trim();
    lastPromptRef.current = text;

    setInput("");
    setError(null);
    setLoading(true);

    // เพิ่ม user message ก่อน
    setMessages((prev) => {
      const next = [...prev, { role: "user", content: text }].slice(-MAX_HISTORY);
      historyRef.current = next;
      return next;
    });

    try {
      const { reply } = await sendHelpChat(historyRef.current);

      setMessages((prev) => {
        const next = [
          ...prev,
          { role: "assistant", content: String(reply ?? "") },
        ].slice(-MAX_HISTORY);

        historyRef.current = next;
        return next;
      });
    } catch (err) {
      setError(friendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [canSend, input]);

  // ✅ retry ส่งข้อความเดิม (เหมือน ChatGPT)
  const retry = useCallback(async () => {
    if (!lastPromptRef.current || isLoading) return;

    setInput(lastPromptRef.current);
    await send();
  }, [send, isLoading]);

  const reset = useCallback(() => {
    const initial: ChatMessage[] = [
      {
        role: "assistant",
        content:
          "เริ่มใหม่ได้เลยครับ 🙂\nถามเรื่องการใช้งานเว็บ เช่น “จองคิวยังไง” หรือ “ดูประวัติการจองอยู่ตรงไหน”",
      },
    ];

    historyRef.current = initial;
    lastPromptRef.current = "";
    setMessages(initial);
    setInput("");
    setError(null);
    setLoading(false);
  }, []);

  return {
    messages,
    input,
    setInput,
    send,
    retry,        // ✅ ใหม่
    reset,
    isLoading,
    error,
    canSend,
  };
}
