// src/services/aiAgent/booking/plan/adapters/planner.ts
import type { ChatMsg } from "@/services/aiAgent/core";
import { callChatLLM, extractJsonFromText, safeParseJson, getLLMContent } from "@/services/aiAgent/core";
import type { PlanLLM } from "../types";
import type { BookingWindow } from "../domain/window";

export function buildBookingPlanSystemPrompt(args: {
  categoriesJson: string;
  bookingWindow: BookingWindow;
}) {
  const { categoriesJson, bookingWindow } = args;

  return `
คุณคือ "AI Agent ช่วยวางแผนการจองคิว" ของระบบ Wellness Center
- ตอบภาษาไทย
- หน้าที่: สรุปความต้องการผู้ใช้เป็นแผนจอง (date, timeRange, problemCategoryCode, detailText)
- ห้ามเดาข้อมูลที่ผู้ใช้ไม่ได้บอก (ถ้าไม่ชัดให้ null)
- ส่งผลลัพธ์เป็น JSON เท่านั้น (ใส่ในโค้ดบล็อก \`\`\`json)

บริบท:
- ช่วงวันที่อนุญาตให้จอง: ${bookingWindow.minISO} ถึง ${bookingWindow.maxISO}
- หมวดปัญหา (เลือก code จากนี้เท่านั้น):
${categoriesJson}

รูปแบบ JSON:
{
  "date": "YYYY-MM-DD" | null,
  "timeRange": "HH:mm-HH:mm" | "AUTO" | null,
  "problemCategoryCode": "STRING" | null,
  "detailText": "STRING" | null
}

กฎ:
- ถ้าผู้ใช้ไม่ได้ระบุวัน => date = null
- ถ้าผู้ใช้ไม่ได้ระบุเวลา => timeRange = null
- ถ้าผู้ใช้ไม่ได้ระบุหมวด => problemCategoryCode = null
- ถ้าข้อมูลปัญหาไม่พอ => detailText = null
`.trim();
}

export async function callPlannerLLM(args: {
  baseURL: string;
  model: string;
  userMessages: ChatMsg[];
  categoriesJson: string;
  bookingWindow: BookingWindow;
}): Promise<PlanLLM | null> {
  const system: ChatMsg = {
    role: "system",
    content: buildBookingPlanSystemPrompt({
      categoriesJson: args.categoriesJson,
      bookingWindow: args.bookingWindow,
    }),
  };

  const r = await callChatLLM({
    baseURL: args.baseURL,
    model: args.model,
    system,
    messages: args.userMessages,
    timeoutMs: 20000,
    temperature: 0.2,
  });

  if (!r.ok) return null;

  const data = await r.json().catch(() => ({} as any));
  const content = getLLMContent(data);

  const planJson = extractJsonFromText(content);
  const plan = safeParseJson<PlanLLM>(planJson);

  // normalize shape กัน null/undefined
  if (!plan) return null;

  return {
    date: plan.date ?? null,
    timeRange: plan.timeRange ?? null,
    problemCategoryCode: plan.problemCategoryCode ?? null,
    detailText: plan.detailText ?? null,
  };
}
