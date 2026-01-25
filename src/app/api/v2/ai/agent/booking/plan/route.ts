// src/app/api/v2/ai/agent/booking/plan/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTenant, assertRole } from "@/lib/tenant/server";
import { signToken } from "@/services/aiAgent/token";

export const runtime = "nodejs";

type ChatMsg = { role: "system" | "user" | "assistant"; content: string };

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

/** ======================
 *  ✅ Date normalize (BKK)
 *  ====================== */
const TZ = "Asia/Bangkok";

function bkkTodayISO(): string {
  // "en-CA" -> YYYY-MM-DD
  return new Date().toLocaleDateString("en-CA", { timeZone: TZ });
}

function isISODate(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(s || "").trim());
}

function isPastDateISO(dateISO: string) {
  // compare string YYYY-MM-DD works
  return String(dateISO) < bkkTodayISO();
}

function bkkRange(date: string) {
  // fix timezone +07:00 ชัดเจน ป้องกัน server อยู่ UTC แล้วเพี้ยนวัน
  const start = new Date(`${date}T00:00:00.000+07:00`);
  const end = new Date(`${date}T23:59:59.999+07:00`);
  return { start, end };
}

function buildSystemPrompt(input: { categoriesText: string }) {
  return `
คุณคือ "AI Agent จองคิว" ของระบบ Wellness Center
- ตอบภาษาไทย
- ทำหน้าที่ช่วย “วางแผนการจอง” และต้องให้ผู้ใช้ “ยืนยัน” ก่อนจองจริงเสมอ
- ห้ามขอข้อมูลส่วนตัวของผู้อื่น
- ส่งผลลัพธ์เป็น JSON เท่านั้น (ใส่ในโค้ดบล็อก \`\`\`json)

รูปแบบ JSON:
{
  "date": "YYYY-MM-DD" | null,
  "timeRange": "HH:MM-HH:MM" | "ANY",
  "problemCategoryCode": "STRING" | null,
  "detailText": "STRING" | null,
  "notes": "STRING" | null
}

**กฎสำคัญเรื่องวัน**
- ถ้าผู้ใช้ไม่ได้ระบุวัน ให้ date = null (ระบบจะตั้งเป็น “วันนี้” เอง)
- ห้ามใส่วันย้อนหลัง (อดีต) ถ้าไม่แน่ใจให้ date = null

เลือก problemCategoryCode จากรายการนี้เท่านั้น:
${input.categoriesText}
`.trim();
}

// ===== slots =====
const ACTIVE_BOOKING_STATUSES = ["PENDING_ASSIGNMENT", "ASSIGNED", "IN_PROGRESS"] as const;

async function listAvailableSlots(params: { universityId: number; date: string; limit?: number }) {
  const { universityId, date, limit = 8 } = params;

  const { start, end } = bkkRange(date);

  const slots = await prisma.timeSlot.findMany({
    where: {
      university_id: universityId,
      time_slot_start_datetime: { gte: start, lt: end },
      NOT: [{ time_slot_status: "LOCKED" }, { time_slot_status: "CANCELLED" }],
    },
    orderBy: { time_slot_start_datetime: "asc" },
    take: 60,
    select: {
      time_slot_id: true,
      time_slot_start_datetime: true,
      time_slot_end_datetime: true,
      time_slot_max_capacity: true,
      time_slot_status: true,
    },
  });

  if (!slots.length) return [];

  const counts = await prisma.booking.groupBy({
    by: ["time_slot_id"],
    where: {
      university_id: universityId,
      time_slot_id: { in: slots.map((s) => s.time_slot_id) },
      booking_status: { in: [...ACTIVE_BOOKING_STATUSES] as any },
    },
    _count: { time_slot_id: true },
  });

  const countMap = new Map<number, number>();
  for (const c of counts) countMap.set(Number(c.time_slot_id), Number(c._count.time_slot_id || 0));

  return slots
    .map((s) => {
      const maxCap = Number(s.time_slot_max_capacity ?? 0);
      const booked = countMap.get(s.time_slot_id) || 0;
      const ok = maxCap > 0 && booked < maxCap && String(s.time_slot_status || "").toUpperCase() !== "BOOKED";
      return {
        timeSlotId: s.time_slot_id,
        start: s.time_slot_start_datetime.toISOString(),
        end: s.time_slot_end_datetime.toISOString(),
        remaining: Math.max(0, maxCap - booked),
        ok,
      };
    })
    .filter((x) => x.ok)
    .slice(0, limit);
}

function pickBestSlot(slots: any[], timeRange: string) {
  if (!slots.length) return null;
  const tr = String(timeRange || "ANY").trim().toUpperCase();
  if (tr === "ANY") return slots[0];

  const m = tr.match(/^(\d{2}):(\d{2})-(\d{2}):(\d{2})$/);
  if (!m) return slots[0];

  const targetStartMin = Number(m[1]) * 60 + Number(m[2]);
  const targetEndMin = Number(m[3]) * 60 + Number(m[4]);

  const toMin = (iso: string) => {
    const d = new Date(iso);
    return d.getHours() * 60 + d.getMinutes();
  };

  let best = slots[0];
  let bestDist = Infinity;

  for (const s of slots) {
    const st = toMin(s.start);
    const dist =
      st >= targetStartMin && st <= targetEndMin
        ? 0
        : Math.min(Math.abs(st - targetStartMin), Math.abs(st - targetEndMin));

    if (dist < bestDist) {
      bestDist = dist;
      best = s;
    }
  }
  return best;
}

export async function POST(req: NextRequest) {
  try {
    const { account, activeUniversityId } = await requireTenant(req);
    assertRole(account.role, ["STUDENT"]);

    if (!account.studentId) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({} as any));
    const { messages, message } = body ?? {};

    let userMessages: ChatMsg[] = [];
    if (Array.isArray(messages)) userMessages = coerceUserMessages(messages).filter((m) => m.role !== "system");
    else if (typeof message === "string" && message.trim()) userMessages = [{ role: "user", content: message.trim() }];
    else return NextResponse.json({ reply: "พิมพ์คำขอจองคิวสั้น ๆ ให้ผมหน่อยครับ 🙂" }, { status: 200 });

    const question = lastUserText(userMessages).trim();
    if (!question) return NextResponse.json({ reply: "พิมพ์คำขอจองคิวสั้น ๆ ให้ผมหน่อยครับ 🙂" }, { status: 200 });

    // ✅ โหลดหมวดปัญหาแบบ GLOBAL (ไม่กรองมหาลัย)
    const cats = await prisma.problemCategory.findMany({
      orderBy: { problem_category_name_th: "asc" },
      select: {
        problem_category_id: true,
        problem_category_code: true,
        problem_category_name_th: true,
      },
      take: 200,
    });

    const categoriesText =
      cats.length > 0
        ? cats.map((c) => `- ${c.problem_category_code}: ${c.problem_category_name_th}`).join("\n")
        : "- (ไม่พบหมวดปัญหาในระบบ)";

    const systemBase: ChatMsg = {
      role: "system",
      content: buildSystemPrompt({ categoriesText }),
    };

    // call LLM
    const baseURL = (process.env.AI_BASE_URL || "http://localhost:11434").replace(/\/+$/, "");
    const model = process.env.AI_MODEL || "qwen2.5:7b";

    let r: Response;
    try {
      r = await fetchWithTimeout(
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
    } catch (e: any) {
      const isAbort = String(e?.name) === "AbortError";
      return NextResponse.json(
        { reply: isAbort ? "ระบบตอบช้ากว่าปกติ ลองใหม่อีกครั้งนะครับ 🙏" : "เชื่อมต่อ AI ไม่สำเร็จ ลองใหม่อีกครั้งนะครับ" },
        { status: 200 },
      );
    }

    if (!r.ok) {
      const t = await r.text().catch(() => "");
      return NextResponse.json(
        { reply: "ขอโทษครับ ตอนนี้วางแผนจองไม่ได้ ลองใหม่อีกครั้ง", debug: { status: r.status, detail: t.slice(0, 200) } },
        { status: 200 },
      );
    }

    const data = await r.json().catch(() => ({} as any));
    const content = String(data?.message?.content ?? "").trim();

    const planJson = extractJsonFromText(content);
    const plan = safeParseJson<{
      date: string | null;
      timeRange: string;
      problemCategoryCode: string | null;
      detailText: string | null;
      notes: string | null;
    }>(planJson);

    if (!plan) {
      return NextResponse.json(
        { reply: "ผมอ่านแผนจองจาก AI ไม่ได้ ลองพิมพ์ใหม่เช่น “จองพรุ่งนี้ 14:00 เรื่องความเครียด”" },
        { status: 200 },
      );
    }

    // ===========================
    // ✅ Normalize date (วันนี้/ไม่ย้อนหลัง)
    // ===========================
    if (!plan.timeRange) plan.timeRange = "ANY";

    // ถ้า AI ส่ง date แปลก ๆ ให้ถือว่าไม่ส่ง
    if (plan.date && !isISODate(plan.date)) {
      plan.notes = (plan.notes ? plan.notes + " " : "") + "รูปแบบวันไม่ถูกต้อง ระบบตั้งเป็นวันนี้";
      plan.date = null;
    }

    // ถ้าไม่ส่งวัน -> ตั้งวันนี้ (ตาม requirement)
    if (!plan.date) {
      plan.date = bkkTodayISO();
      plan.notes = (plan.notes ? plan.notes + " " : "") + `ตั้งวันเป็นวันนี้ (${plan.date})`;
    }

    // ถ้าย้อนอดีต -> เลื่อนเป็นวันนี้
    if (plan.date && isPastDateISO(plan.date)) {
      const old = plan.date;
      plan.date = bkkTodayISO();
      plan.notes = (plan.notes ? plan.notes + " " : "") + `ปรับวันจาก ${old} เป็น ${plan.date} (ไม่ให้จองย้อนหลัง)`;
    }

    const candidates = await listAvailableSlots({ universityId: activeUniversityId, date: plan.date, limit: 8 });
    if (!candidates.length) {
      return NextResponse.json(
        {
          reply: `วัน ${plan.date} ยังไม่พบช่วงเวลาว่างครับ ลองเปลี่ยนวัน/ช่วงเวลาอีกครั้ง 🙂`,
          plan,
          candidates: [],
        },
        { status: 200 },
      );
    }

    const suggested = pickBestSlot(candidates, plan.timeRange);

    // ✅ map category code -> categoryId (global)
    const cat = plan.problemCategoryCode
      ? cats.find((c) => String(c.problem_category_code) === String(plan.problemCategoryCode))
      : null;

    if (!cat) {
      return NextResponse.json(
        {
          reply: "ผมยังไม่แน่ใจหมวดปัญหาครับ ช่วยพิมพ์ “หมวด: <CODE>” ตามรายการในระบบ 🙂",
          plan,
          candidates,
          categories: cats.map((c) => ({
            id: c.problem_category_id,
            code: c.problem_category_code,
            name: c.problem_category_name_th,
          })),
        },
        { status: 200 },
      );
    }

    const payload = {
      v: 1,
      exp: Date.now() + 5 * 60 * 1000,
      universityId: activeUniversityId, // ✅ slot เป็น tenant
      studentId: account.studentId,
      timeSlotId: suggested?.timeSlotId,
      problemCategoryId: cat.problem_category_id,
      detailText: plan.detailText || null,
    };

    const confirmToken = signToken(payload);

    return NextResponse.json(
      {
        reply: `ผมเสนอช่วงเวลานี้ให้ครับ ✅\n- วันที่: ${plan.date}\n- ช่วงเวลา: ${plan.timeRange}\nถ้าถูกต้องกด “ยืนยันการจอง” ได้เลย`,
        plan,
        candidates,
        suggested,
        confirmToken,
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { reply: "ระบบมีปัญหาเล็กน้อย ลองใหม่อีกครั้งนะครับ", detail: String(err?.message ?? err).slice(0, 200) },
      { status: 200 },
    );
  }
}
