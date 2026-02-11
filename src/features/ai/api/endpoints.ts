// src/features/ai/api/endpoints.ts

export type Mode = "help" | "booking_agent";
export type AgentIntent = "BOOK" | "CANCEL";

export function detectIntent(text: string, currentIntent?: AgentIntent | null): AgentIntent {
  const t = (text || "").toLowerCase();
  const cancelKw = ["ยกเลิก", "cancel", "เลื่อน", "ไม่ไป", "ติดธุระ", "ถอนนัด", "ลบ", "ทิ้ง"];
  const bookKw = ["จอง", "นัด", "พบ", "ปรึกษา", "คุย", "ทำนัด"];

  const hasCancel = cancelKw.some((k) => t.includes(k));
  const hasBook = bookKw.some((k) => t.includes(k));

  if (hasCancel) return "CANCEL";
  if (hasBook) return "BOOK";

  // ✅ ถ้ากำลังอยู่ใน flow เดิม และไม่มี Keyword เปลี่ยนใหม่ชัดเจน -> ให้เกาะ flow เดิมไว้ (Stickiness)
  if (currentIntent === "CANCEL") return "CANCEL";
  if (currentIntent === "BOOK") return "BOOK";

  return "BOOK";
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
