// src/features/ai/hooks/useAiChat.ts
"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { aiApi, detectIntent, endpointFor } from "@/features/ai/api";
import type { ChatMsg, AiChatResponse, Mode, AgentIntent } from "@/features/ai/api";
import type { AgentQuestion } from "@/features/ai/api/client";

type Role = "user" | "assistant";
type UiMsg = { role: Role; content: string };

type AgentState = {
  intent: AgentIntent;
  confirmToken: string | null;
  plan?: any;                 // map state->plan ได้
  suggested?: any;
  candidates?: any[];
  missingFields?: string[];
  questions?: AgentQuestion[];
  categories?: any[];          // ✅ added categories list
};

function pickConfirmToken(data: any): string | null {
  return typeof data?.confirmToken === "string"
    ? data.confirmToken
    : typeof data?.confirm_token === "string"
      ? data.confirm_token
      : typeof data?.token === "string"
        ? data.token
        : null;
}

export function useAiChat(input: { mode: Mode; onConfirmed?: () => void }) {
  const { mode, onConfirmed } = input;
  const router = useRouter();

  const [messages, setMessages] = useState<UiMsg[]>([]);
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

  const sendMessage = useCallback(async (msgContent: string) => {
    const userText = msgContent.trim();
    if (!userText || isLoading) return;

    setError(null);
    setIsLoading(true);
    
    // ✅ Keep intent for continuity
    const currentIntent = agent?.intent;
    setAgent(null); // กันกด confirm เก่า

    const nextMessages: UiMsg[] = [...messages, { role: "user", content: userText }];
    setMessages(nextMessages);
    setText(""); 

    try {
      const intent: AgentIntent = mode === "booking_agent" ? detectIntent(userText, currentIntent) : "BOOK";
      const ep = endpointFor(mode, intent);

      const payload = {
        messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
        // ✅ Send current plan to auto-merge state
        plan: agent?.plan ?? null,
      };

      const data = await aiApi.chat(ep.plan, payload);

      const replyText = String(data?.reply ?? data?.detail ?? "…").trim() || "…";
      setMessages((prev) => [...prev, { role: "assistant", content: replyText }]);

      if (mode === "booking_agent") {
        const confirmToken = pickConfirmToken(data);

        // ✅ รองรับ response ใหม่: state
        const planOrState = (data as any)?.state ?? (data as any)?.plan ?? null;

        setAgent({
          intent,
          confirmToken,
          plan: planOrState,
          suggested: (data as any)?.suggested ?? null,
          candidates: Array.isArray((data as any)?.candidates) ? (data as any).candidates : [],
          missingFields: Array.isArray((data as any)?.missingFields) ? (data as any).missingFields : [],
          questions: Array.isArray((data as any)?.questions) ? (data as any).questions : [],
          categories: Array.isArray((data as any)?.categories) ? (data as any).categories : [], // ✅ Capture categories
        });
      }
    } catch (e: any) {
      setError(e?.message ?? "network");
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, messages, mode, agent]);

  const send = useCallback(() => {
    sendMessage(text);
  }, [sendMessage, text]);

  const confirmAgentAction = useCallback(async () => {
    if (mode !== "booking_agent") return;
    if (!agent?.confirmToken) return;
    if (isLoading) return;

    setError(null);
    setIsLoading(true);

    try {
      // ✅ confirm กลางอันเดียว
      const data = await aiApi.bookingConfirm(agent.confirmToken);

      const ok = Boolean((data as any)?.success);
      const replyText =
        String((data as any)?.reply ?? "").trim() || (ok ? "✅ สำเร็จ" : "ไม่สำเร็จ");

      setMessages((prev) => [...prev, { role: "assistant", content: replyText }]);

      setAgent(null);

      if (ok) {
        onConfirmed?.();
        window.dispatchEvent(new Event("booking:changed"));
        router.refresh(); // ✅ Refresh Server Components
      }
    } catch (e: any) {
      setError(e?.message ?? "network");
    } finally {
      setIsLoading(false);
    }
  }, [mode, agent, isLoading, onConfirmed, router]);

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
    sendMessage, // ✅ Exposed
  };
}
