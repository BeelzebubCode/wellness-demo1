"use client";

import { useCallback, useMemo, useState } from "react";

type Mode = "help" | "booking_agent";
type Role = "user" | "assistant";

type ChatMsg = { role: Role; content: string };

type AgentIntent = "BOOK" | "CANCEL";

type AgentQuestion = {
  field: string;
  text: string;
  options?: { value: any; label: string; code?: string }[];
};

type AgentState = {
  intent: AgentIntent;
  confirmToken: string | null;
  plan?: any;
  suggested?: any;
  candidates?: any[];
  missingFields?: string[];
  questions?: AgentQuestion[];
};

function detectIntent(text: string): AgentIntent {
  const t = (text || "").toLowerCase();
  const cancelKw = ["ยกเลิก", "cancel", "เลื่อน", "ไม่ไป", "ติดธุระ", "ถอนนัด"];
  if (cancelKw.some((k) => t.includes(k))) return "CANCEL";
  return "BOOK";
}

function endpointFor(mode: Mode, intent: AgentIntent) {
  if (mode === "help") return { plan: "/api/v2/ai/help", confirm: "" };

  if (intent === "CANCEL") {
    return {
      plan: "/api/v2/ai/agent/booking/cancel/plan",
      confirm: "/api/v2/ai/agent/booking/cancel/confirm",
    };
  }

  return {
    plan: "/api/v2/ai/agent/booking/plan",
    confirm: "/api/v2/ai/agent/booking/confirm",
  };
}

export function useAiChat(input: { mode: Mode; onConfirmed?: () => void }) {
  const mode = input.mode;
  const onConfirmed = input.onConfirmed;

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [agent, setAgent] = useState<AgentState | null>(null);

  const canSend = useMemo(
    () => !isLoading && text.trim().length > 0,
    [isLoading, text],
  );

  const reset = useCallback(() => {
    setMessages([]);
    setText("");
    setError(null);
    setAgent(null);
  }, []);

  const send = useCallback(async () => {
    const userText = text.trim();
    if (!userText || isLoading) return;

    setError(null);
    setIsLoading(true);

    // ✅ ถ้าพิมพ์ใหม่ ให้เคลียร์ confirm เก่า (กันกดผิด action/แผนเก่า)
    setAgent(null);

    const nextMessages: ChatMsg[] = [
      ...messages,
      { role: "user", content: userText },
    ];
    setMessages(nextMessages);
    setText("");

    try {
      const intent: AgentIntent =
        mode === "booking_agent" ? detectIntent(userText) : "BOOK";
      const ep = endpointFor(mode, intent);

      const res = await fetch(ep.plan, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await res.json().catch(() => ({}) as any);

      const replyText =
        String(data?.reply ?? data?.message ?? "").trim() || "…";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: replyText },
      ]);

      if (mode === "booking_agent") {
        const confirmToken =
          typeof data?.confirmToken === "string"
            ? data.confirmToken
            : typeof data?.confirm_token === "string"
              ? data.confirm_token
              : typeof data?.token === "string"
                ? data.token
                : null;

        setAgent({
          intent,
          confirmToken,
          plan: data?.plan,
          suggested: data?.suggested,
          candidates: Array.isArray(data?.candidates) ? data.candidates : [],
          missingFields: Array.isArray(data?.missingFields)
            ? data.missingFields
            : [],
          questions: Array.isArray(data?.questions) ? data.questions : [],
        });
      }
    } catch (e: any) {
      setError(e?.message ?? "network");
    } finally {
      setIsLoading(false);
    }
  }, [text, isLoading, messages, mode]);

  const confirmAgentAction = useCallback(async () => {
    if (mode !== "booking_agent") return;
    if (!agent?.confirmToken) return;
    if (isLoading) return;

    setError(null);
    setIsLoading(true);

    try {
      const ep = endpointFor(mode, agent.intent);

      const res = await fetch(ep.confirm, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmToken: agent.confirmToken }),
      });

      const data = await res.json().catch(() => ({}) as any);

      const ok = Boolean(data?.success); // ✅ สำคัญ
      const replyText =
        String(data?.reply ?? "").trim() || (ok ? "✅ สำเร็จ" : "ไม่สำเร็จ");

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: replyText },
      ]);

      // ✅ confirm แล้วเคลียร์ token กันกดซ้ำ
      setAgent(null);

      // ✅ ให้หน้าอื่นรีเฟรช/รีเฟตช์
      if (ok) {
        onConfirmed?.(); // ให้ AiChatCore ทำ router.refresh()
        window.dispatchEvent(new Event("booking:changed")); // ✅ บอกหน้าอื่น refetch
      }
    } catch (e: any) {
      setError(e?.message ?? "network");
    } finally {
      setIsLoading(false);
    }
  }, [mode, agent, isLoading, onConfirmed]);

  return {
    messages,
    input: text,
    setInput: setText,
    send,
    reset,
    isLoading,
    error,
    canSend,
    agent,
    confirmAgentAction,
  };
}
