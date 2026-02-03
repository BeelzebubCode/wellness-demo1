// src/features/ai/api/endpoints.ts

export type Mode = "help" | "booking_agent";
export type AgentIntent = "BOOK" | "CANCEL";

export function detectIntent(text: string): AgentIntent {
  const t = (text || "").toLowerCase();
  const cancelKw = ["ยกเลิก", "cancel", "เลื่อน", "ไม่ไป", "ติดธุระ", "ถอนนัด"];
  return cancelKw.some((k) => t.includes(k)) ? "CANCEL" : "BOOK";
}

export function endpointFor(mode: Mode, intent: AgentIntent) {
  if (mode === "help") {
    return { plan: "/api/v2/ai/agent/help", confirm: "" };
  }

  if (intent === "CANCEL") {
    return {
      plan: "/api/v2/ai/agent/booking/cancel/plan",
      confirm: "/api/v2/ai/agent/booking/confirm", // ✅ confirm กลาง
    };
  }

  return {
    plan: "/api/v2/ai/agent/booking/plan",
    confirm: "/api/v2/ai/agent/booking/confirm", // ✅ confirm กลาง
  };
}
