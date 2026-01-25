// src/app/api/v2/ai/agent/booking/cancel/plan/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTenant, assertRole } from "@/lib/tenant/server";
import { signToken } from "@/services/aiAgent/token";

export const runtime = "nodejs";

type ChatMsg = { role: "system" | "user" | "assistant"; content: string };

function coerceUserMessages(input: any): ChatMsg[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter(
      (m) => m && typeof m.role === "string" && typeof m.content === "string",
    )
    .filter(
      (m) => m.role === "user" || m.role === "assistant" || m.role === "system",
    )
    .map((m) => ({ role: m.role, content: m.content }) as ChatMsg);
}

function lastUserText(msgs: ChatMsg[]) {
  for (let i = msgs.length - 1; i >= 0; i--)
    if (msgs[i]?.role === "user") return msgs[i].content || "";
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

function buildSystemPrompt() {
  return `
คุณคือ "AI Agent ยกเลิกนัดหมาย" ของระบบ Wellness Center
- ตอบภาษาไทย
- หน้าที่: ช่วยเก็บ “เหตุผลการยกเลิก” และต้องให้ผู้ใช้ “ยืนยัน” ก่อนยกเลิกจริงเสมอ
- ห้ามขอข้อมูลส่วนตัวของผู้อื่น
- ส่งผลลัพธ์เป็น JSON เท่านั้น (ใส่ในโค้ดบล็อก \`\`\`json)

รูปแบบ JSON:
{
  "reason": "STRING" | null,
  "notes": "STRING" | null
}

กฎ:
- ถ้าผู้ใช้ไม่บอกเหตุผล ให้ reason = null
- ห้ามแต่งเหตุผลเอง ถ้าไม่ชัดเจนให้ reason = null
`.trim();
}

export async function POST(req: NextRequest) {
  try {
    const { account, activeUniversityId } = await requireTenant(req);
    assertRole(account.role, ["STUDENT"]);

    if (!account.studentId) {
      return NextResponse.json(
        { reply: "ไม่พบโปรไฟล์นักศึกษา" },
        { status: 200 },
      );
    }

    // ✅ เช็คก่อนว่ามีนัดที่ยกเลิกได้ไหม
    const active = await prisma.booking.findFirst({
      where: {
        university_id: activeUniversityId,
        student_id: account.studentId,
        booking_status: {
          in: ["PENDING_ASSIGNMENT", "ASSIGNED", "IN_PROGRESS"] as any,
        },
      },
      orderBy: { booking_created_at: "desc" as any }, // ถ้าฟิลด์ชื่ออื่น แก้ให้ตรง
      select: { booking_id: true },
    });

    if (!active) {
      return NextResponse.json(
        { reply: "ตอนนี้ไม่พบนัดหมายที่กำลังดำเนินการอยู่ครับ" },
        { status: 200 },
      );
    }

    const body = await req.json().catch(() => ({}) as any);
    const { messages, message } = body ?? {};

    let userMessages: ChatMsg[] = [];
    if (Array.isArray(messages))
      userMessages = coerceUserMessages(messages).filter(
        (m) => m.role !== "system",
      );
    else if (typeof message === "string" && message.trim())
      userMessages = [{ role: "user", content: message.trim() }];
    else {
      return NextResponse.json(
        { reply: "พิมพ์คำขอยกเลิกนัด เช่น “ยกเลิกนัด ผมไม่ว่าง” 🙂" },
        { status: 200 },
      );
    }

    const question = lastUserText(userMessages).trim();
    if (!question) {
      return NextResponse.json(
        { reply: "พิมพ์คำขอยกเลิกนัด เช่น “ยกเลิกนัด ผมไม่ว่าง” 🙂" },
        { status: 200 },
      );
    }

    // call LLM
    const baseURL = (
      process.env.AI_BASE_URL || "http://localhost:11434"
    ).replace(/\/+$/, "");
    const model = process.env.AI_MODEL || "qwen2.5:7b";

    const systemBase: ChatMsg = {
      role: "system",
      content: buildSystemPrompt(),
    };

    let reason: string | null = null;

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
        const plan = safeParseJson<{
          reason: string | null;
          notes: string | null;
        }>(jsonText);
        reason = plan?.reason ? String(plan.reason).trim() : null;
      }
    } catch {
      // LLM ล่มก็ให้ถามเหตุผลเองด้านล่าง
    }

    if (!reason) {
      return NextResponse.json(
        {
          reply:
            "ได้ครับ 🙂 ขอเหตุผลในการยกเลิกนัดหมายด้วยครับ (เช่น “ติดธุระ / ไม่ว่าง / ป่วย”)",
          intent: "CANCEL",
        },
        { status: 200 },
      );
    }

    const payload = {
      v: 1,
      exp: Date.now() + 5 * 60 * 1000,
      intent: "CANCEL" as const,
      universityId: activeUniversityId,
      studentId: account.studentId,
      reason,
    };

    const confirmToken = signToken(payload);

    return NextResponse.json(
      {
        intent: "CANCEL",
        confirmToken,
        reply: `ผมจะยกเลิกนัดหมายของคุณด้วยเหตุผล: “${reason}”\nถ้าถูกต้องกด “ยืนยันการยกเลิก” ได้เลย`,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { reply: "ระบบมีปัญหาเล็กน้อย ลองใหม่อีกครั้งนะครับ" },
      { status: 200 },
    );
  }
}
