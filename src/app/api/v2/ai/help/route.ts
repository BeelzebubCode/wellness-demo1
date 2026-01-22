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
  2) ไปที่เมนูที่เกี่ยวข้อง (ยกตัวอย่างเส้นทางเมนูที่คุณมี)
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
  // best-effort (ไม่ทำให้พังถ้าไม่มี)
  // - ถ้าคุณมี cookie tenant_code อยู่แล้วก็จะติดมาเอง
  const cookie = req.cookies.get("tenant_code")?.value;
  if (cookie) return cookie;

  // - ถ้ามี header จาก middleware ก็สามารถใช้ได้
  const header = req.headers.get("x-tenant-code") || req.headers.get("x-tenant");
  if (header) return header;

  return undefined;
}

export async function POST(req: NextRequest) {
  try {
    const { messages, message } = await req.json().catch(() => ({} as any));

    const tenantCode = getTenantCodeBestEffort(req);
    const system: ChatMsg = { role: "system", content: buildSystemPrompt(tenantCode) };

    let userMessages: ChatMsg[] = [];
    if (Array.isArray(messages)) {
      userMessages = messages
        .filter((m: any) => m && typeof m.role === "string" && typeof m.content === "string")
        .map((m: any) => ({ role: m.role, content: m.content }));
    } else if (typeof message === "string" && message.trim()) {
      userMessages = [{ role: "user", content: message.trim() }];
    } else {
      return NextResponse.json({ error: "Missing message/messages" }, { status: 400 });
    }

    const baseURL = process.env.AI_BASE_URL || "http://localhost:11434/v1";
    const model = process.env.AI_MODEL || "gpt-oss:20b";
    const apiKey = process.env.AI_API_KEY || "ollama";

    const r = await fetch(`${baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // openai-compatible
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        messages: [system, ...userMessages],
      }),
    });

    if (!r.ok) {
      const text = await r.text().catch(() => "");
      return NextResponse.json(
        { error: "AI provider error", status: r.status, detail: text.slice(0, 2000) },
        { status: 500 }
      );
    }

    const data = await r.json();
    const content =
      data?.choices?.[0]?.message?.content ??
      data?.choices?.[0]?.text ??
      "ขอโทษครับ ตอนนี้ตอบไม่ได้ ลองใหม่อีกครั้ง";

    return NextResponse.json({ reply: content });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Internal error", detail: String(e?.message ?? e).slice(0, 2000) },
      { status: 500 }
    );
  }
}
