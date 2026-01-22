// api/v2/ai/help/route.ts

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type ChatMsg = { role: "system" | "user" | "assistant"; content: string };

function buildSystemPrompt(tenantCode?: string) {
  return `คุณคือผู้ช่วย "ศูนย์ช่วยเหลือการใช้งานระบบ NU Wellness"

ภาษา:
- ต้องตอบเป็นภาษาไทยเท่านั้น (ยกเว้นผู้ใช้ขอให้ตอบภาษาอังกฤษอย่างชัดเจน)

ขอบเขตงาน (Help-only):
- อธิบายวิธีใช้งานเว็บ, ขั้นตอนเมนู, แก้ปัญหาทั่วไป, ตอบคำถามเกี่ยวกับระบบ
- ห้ามทำธุรกรรมแทนผู้ใช้ (เช่น สร้าง/แก้ไข/ยกเลิก booking, เปลี่ยนข้อมูลบัญชี)
- ห้ามขอ/แสดงข้อมูลส่วนบุคคลของผู้อื่น หรือข้อมูลอ่อนไหว (สุขภาพ/การรักษา)

แนวทางการตอบ (สำคัญ):
- ตอบให้ "ตรงคำถาม" ก่อน แล้วค่อยเสริม "ขั้นตอน" แบบสั้น ๆ ถ้าจำเป็น
- ถ้าคำถามกว้าง เช่น “wellness คืออะไร” ให้ตอบภาพรวม 2-4 บรรทัด แล้วตามด้วยหัวข้อสั้น ๆ ว่ามีเมนูอะไรบ้าง
- ถ้าผู้ใช้ถามเรื่องเฉพาะบัญชี เช่น "นัดของฉัน" ให้ตอบว่า:
  1) ต้องเข้าสู่ระบบก่อน
  2) ไปที่เมนูที่เกี่ยวข้อง
- ถ้าไม่แน่ใจ ให้ถามคำถามสั้น ๆ 1 ข้อเพื่อเก็บ context (เช่น ผู้ใช้เป็น Student/Consultant/Admin? อยู่หน้าไหน? เจอ error อะไร?)

ข้อมูลสภาพแวดล้อม:
- Tenant (ถ้ามี): ${tenantCode ?? "UNKNOWN"}

เมนูตัวอย่างในระบบ (ใช้ในการอธิบาย):
- นักศึกษา: จองคิว, ตารางนัดของฉัน, ประวัติการจอง, โปรไฟล์
- ผู้ให้คำปรึกษา: ตารางงาน, งานของฉัน, ประวัติ
- แอดมินมหาลัย: จัดการตาราง, รายการจอง, ศูนย์ข้อมูล (Data Center)

สไตล์:
- กระชับ ชัดเจน เป็นข้อ ๆ
- อย่าเดาข้อมูลเฉพาะระบบถ้าไม่รู้ ให้บอกว่าไม่แน่ใจและถามเพิ่ม`;
}

function getTenantCodeBestEffort(req: NextRequest) {
  const cookie = req.cookies.get("tenant_code")?.value;
  if (cookie) return cookie;

  const header = req.headers.get("x-tenant-code") || req.headers.get("x-tenant");
  if (header) return header;

  return undefined;
}

function coerceUserMessages(input: any): ChatMsg[] {
  if (Array.isArray(input)) {
    return input
      .filter((m) => m && typeof m.role === "string" && typeof m.content === "string")
      .filter((m) => m.role === "user" || m.role === "assistant" || m.role === "system")
      .map((m) => ({ role: m.role, content: m.content } as ChatMsg));
  }
  return [];
}

export async function POST(req: NextRequest) {
  try {
    const { messages, message } = await req.json().catch(() => ({} as any));

    const tenantCode = getTenantCodeBestEffort(req);
    const system: ChatMsg = { role: "system", content: buildSystemPrompt(tenantCode) };

    let userMessages: ChatMsg[] = [];

    if (Array.isArray(messages)) {
      userMessages = coerceUserMessages(messages).filter((m) => m.role !== "system");
    } else if (typeof message === "string" && message.trim()) {
      userMessages = [{ role: "user", content: message.trim() }];
    } else {
      return NextResponse.json({ error: "Missing message/messages" }, { status: 400 });
    }

    // ✅ Ollama native base URL (ไม่มี /v1)
    const baseURL = (process.env.AI_BASE_URL || "http://localhost:11434").replace(/\/+$/, "");
    const model = process.env.AI_MODEL || "qwen2.5:7b";

    const r = await fetch(`${baseURL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        stream: false,
        // Ollama native: messages = [{role, content}]
        messages: [system, ...userMessages],
        options: { temperature: 0.3 },
      }),
    });

    if (!r.ok) {
      const text = await r.text().catch(() => "");
      return NextResponse.json(
        { error: "AI provider error", status: r.status, detail: text.slice(0, 2000) },
        { status: 500 }
      );
    }

    const data = await r.json().catch(() => ({} as any));
    const content = data?.message?.content ?? "ขอโทษครับ ตอนนี้ตอบไม่ได้ ลองใหม่อีกครั้ง";

    return NextResponse.json({ reply: content });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Internal error", detail: String(e?.message ?? e).slice(0, 2000) },
      { status: 500 }
    );
  }
}
