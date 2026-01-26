// src/services/aiAgent/bookingCancel/plan.ts
import prisma from "@/lib/prisma";
import { signToken } from "@/services/aiAgent/token";
import { buildCancelPlanSystemPrompt } from "./prompt";
import type { CancelPlanResponse, ChatMsg, AgentQuestion } from "./types";

function coerceUserMessages(input: any): ChatMsg[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((m) => m && typeof m.role === "string" && typeof m.content === "string")
    .filter((m) => m.role === "user" || m.role === "assistant" || m.role === "system")
    .map((m) => ({ role: m.role, content: m.content }) as ChatMsg);
}

function lastUserText(msgs: ChatMsg[]) {
  for (let i = msgs.length - 1; i >= 0; i--) if (msgs[i]?.role === "user") return msgs[i].content || "";
  return "";
}

async function fetchWithTimeout(url: string, init: RequestInit, ms: number) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}

function extractJsonFromText(text: string) {
  const t = String(text || "");
  const fenced = t.match(/```json\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const obj = t.match(/\{[\s\S]*\}/);
  if (obj?.[0]) return obj[0].trim();
  return "";
}

function safeParseJson<T>(s: string): T | null {
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

// ✅ “ฉลาดขึ้น”: ดึงเหตุผลจากประโยคผู้ใช้ก่อน ไม่ต้องให้ LLM เดา
function extractReasonFromUser(text: string): string | null {
  const raw = String(text || "").trim();
  if (!raw) return null;

  // ถ้าพิมพ์แค่ "ยกเลิก" เฉยๆ
  const onlyCancel = /^(ยกเลิก|ยกเลิกนัด|cancel)\s*$/i.test(raw);
  if (onlyCancel) return null;

  // ตัดคำขึ้นต้น/คำสุภาพ
  let s = raw;

  // ตัด keyword ยกเลิกด้านหน้า
  s = s.replace(/^(ช่วย)?\s*(ยกเลิกนัดหมาย|ยกเลิกนัด|ยกเลิก|cancel)\s*/i, "");

  // ตัด filler ท้าย ๆ
  s = s.replace(/\b(ครับ|ค่ะ|นะ|หน่อย|ที|ทีครับ|ทีค่ะ)\b/g, " ");

  // normalize
  s = s.replace(/[“”"']/g, "").replace(/\s+/g, " ").trim();

  // ถ้ายังว่าง -> ไม่มีเหตุผล
  if (!s) return null;

  // ถ้าเป็นคำสั้นมากแบบ “ไม่” ให้ไม่รับ
  if (s.length < 2) return null;

  // keywords ที่ถือว่าเป็นเหตุผลชัดเจน
  const okKw = ["ไม่ว่าง", "ติดธุระ", "ป่วย", "งานด่วน", "มีธุระ", "ฉุกเฉิน", "เลื่อนไปก่อน"];
  if (okKw.some((k) => s.includes(k))) return s;

  // ถ้ายาวพอ ก็รับเป็นเหตุผลได้เลย
  if (s.length >= 3) return s;

  return null;
}

export async function runBookingCancelPlan(input: {
  activeUniversityId: number;
  studentId: number;
  body: any; // {messages|message}
}): Promise<CancelPlanResponse> {
  const { activeUniversityId, studentId, body } = input;

  // ✅ เช็คก่อนว่ามีนัด active ที่ยกเลิกได้ไหม
  const active = await prisma.booking.findFirst({
    where: {
      university_id: activeUniversityId,
      student_id: studentId,
      booking_status: { in: ["PENDING_ASSIGNMENT", "ASSIGNED", "IN_PROGRESS"] as any },
    },
    orderBy: { booking_created_at: "desc" as any },
    select: { booking_id: true },
  });

  if (!active) {
    return {
      intent: "CANCEL",
      reply: "ตอนนี้ไม่พบนัดหมายที่กำลังดำเนินการอยู่ครับ 🙂",
    };
  }

  const { messages, message } = body ?? {};
  let userMessages: ChatMsg[] = [];

  if (Array.isArray(messages)) userMessages = coerceUserMessages(messages).filter((m) => m.role !== "system");
  else if (typeof message === "string" && message.trim()) userMessages = [{ role: "user", content: message.trim() }];
  else {
    return {
      intent: "CANCEL",
      reply: "พิมพ์คำขอยกเลิกนัด เช่น “ยกเลิก ไม่ว่างครับ” 🙂",
    };
  }

  const question = lastUserText(userMessages).trim();
  if (!question) {
    return {
      intent: "CANCEL",
      reply: "พิมพ์คำขอยกเลิกนัด เช่น “ยกเลิก ไม่ว่างครับ” 🙂",
    };
  }

  // ✅ 1) rule-based ก่อน (เร็ว + แม่นกับเคสทั่วไป)
  let reason = extractReasonFromUser(question);

  // ✅ 2) ถ้ายังไม่มี reason ค่อยถาม/หรือให้ LLM ช่วย extract
  if (!reason) {
    // call LLM (optional)
    const baseURL = (process.env.AI_BASE_URL || "http://localhost:11434").replace(/\/+$/, "");
    const model = process.env.AI_MODEL || "qwen2.5:7b";

    const systemBase: ChatMsg = { role: "system", content: buildCancelPlanSystemPrompt() };

    try {
      const r = await fetchWithTimeout(
        `${baseURL}/api/chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model,
            stream: false,
            messages: [systemBase, ...userMessages],
            options: { temperature: 0.2 },
          }),
        },
        20000,
      );

      if (r.ok) {
        const data = await r.json().catch(() => ({}) as any);
        const content = String(data?.message?.content ?? "").trim();
        const jsonText = extractJsonFromText(content);
        const plan = safeParseJson<{ reason: string | null; notes: string | null }>(jsonText);
        const llmReason = plan?.reason ? String(plan.reason).trim() : null;

        // กัน LLM ตอบกว้าง ๆ แบบ “ขอยกเลิก” เฉย ๆ
        reason = llmReason && llmReason.length >= 2 ? llmReason : null;
      }
    } catch {
      // ignore
    }
  }

  if (!reason) {
    const q: AgentQuestion = {
      field: "reason",
      text: "ขอเหตุผลในการยกเลิกนัดหมายด้วยครับ เช่น “ติดธุระ / ไม่ว่าง / ป่วย”",
    };

    return {
      intent: "CANCEL",
      reply: "ได้ครับ 🙂 ขอเหตุผลในการยกเลิกนัดหมายด้วยครับ (เช่น “ติดธุระ / ไม่ว่าง / ป่วย”)",
      missingFields: ["reason"],
      questions: [q],
    };
  }

  // ✅ ใช้ action ให้ตรงกับ confirm route
  const payload = {
    v: 1,
    exp: Date.now() + 5 * 60 * 1000,
    action: "CANCEL" as const,
    universityId: activeUniversityId,
    studentId,
    reason,
  };

  const confirmToken = signToken(payload);

  return {
    intent: "CANCEL",
    confirmToken,
    reply: `ผมจะยกเลิกนัดหมายของคุณด้วยเหตุผล: “${reason}”\nถ้าถูกต้องกด “ยืนยันการยกเลิก” ได้เลย`,
    missingFields: [],
    questions: [],
  };
}
