// src/services/aiAgent/booking/plan/adapters/planner.ts
import type { ChatMsg } from "@/services/ai-agent/core";
import { callChatLLM, extractJsonFromText, safeParseJson, getLLMContent } from "@/services/ai-agent/core";
import type { PlanLLM } from "../types";
import type { BookingWindow } from "../domain/window";

export function buildBookingPlanSystemPrompt(args: {
  categoriesJson: string;
  bookingWindow: BookingWindow;
}) {
  const { categoriesJson, bookingWindow } = args;

  return `
คุณคือ "ระบบจองคิวอัตโนมัติ" ของ Wellness Center
- **ตอบเป็นภาษาไทยเท่านั้น** (Always reply in Thai)
- **ห้ามตอบเป็นภาษาจีนโดยเด็ดขาด** (Strictly forbidden: No Chinese)
- **ห้ามกล่าวถึง "เอกสาร", "Prompt", หรือ "คำสั่งภายใน" ใดๆ ทั้งสิ้น**
- ทำหน้าที่เป็นระบบจองคิวที่รู้กฎระเบียบอยู่แล้ว (System Persona)
- หน้าที่: สรุปความต้องการผู้ใช้เป็นแผนจอง (date, timeRange, problemCategoryCode, detailText)
- ห้ามนั่งเทียนข้อมูล (ถ้าไม่ชัดให้ null)
- ส่งผลลัพธ์เป็น JSON เท่านั้น (ใส่ในโค้ดบล็อก \`\`\`json)

บริบท:
- ช่วงวันที่อนุญาตให้จอง: ${bookingWindow.minISO} ถึง ${bookingWindow.maxISO}
- หมวดปัญหา (เลือก code จากนี้เท่านั้น):
${categoriesJson}
- วิธีเลือกหมวด: ดู field "desc" ของแต่ละหมวดประกอบ ว่าเข้าข่ายกับปัญหาผู้ใช้ที่สุด
- ตัวอย่าง:
  - "เครียดเรื่องสอบ" -> STRESS
  - "ทะเลาะกับแฟน" -> REL
  - "ไม่มีเงินกินข้าว" -> FIN
  - "ซึมเศร้า ไม่อยากทำอะไร" -> MENTAL

การแปลงเวลา (Time Parsing Rule):
- แปลงภาษาพูดไทยเป็น "HH:mm-HH:mm" (1 ชั่วโมง)
- ตัวอย่าง:
  - "10 โมง" -> "10:00-11:00"
  - "บ่าย 2" -> "14:00-15:00" 
  - "ทุ่มนึง" -> "19:00-20:00"
  - "9.30" -> "09:30-10:30"
  - "ช่วงเช้า" -> "08:00-12:00"
  - "ช่วงบ่าย" -> "13:00-17:00"

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
