// src/app/api/v2/ai/help/route.ts
import { NextRequest, NextResponse } from "next/server";
import { runHelp } from "@/services/aiHelp/runHelp";

export const runtime = "nodejs";
type ChatMsg = { role: "system" | "user" | "assistant"; content: string };

function buildSystemPrompt(tenantCode?: string) {
  return `คุณคือผู้ช่วย "ศูนย์ช่วยเหลือการใช้งานระบบ NU Wellness"
- ตอบภาษาไทยเท่านั้น
- Help-only: อธิบายขั้นตอนการใช้งาน/แก้ปัญหา
- ห้ามทำธุรกรรมแทนผู้ใช้ และห้ามขอข้อมูลส่วนตัวของผู้อื่น
- ถ้ามีข้อมูลจากเอกสาร ให้ยึดตามเอกสารก่อน
Tenant: ${tenantCode ?? "UNKNOWN"}`;
}

function getTenantCodeBestEffort(req: NextRequest) {
  return (
    req.cookies.get("tenant_code")?.value ||
    req.headers.get("x-tenant-code") ||
    req.headers.get("x-tenant") ||
    undefined
  );
}

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

export async function POST(req: NextRequest) {
  try {
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
      // ✅ FIX: ไม่ส่ง 400
      return NextResponse.json(
        { reply: "พิมพ์คำถามสั้น ๆ ให้ผมหน่อยครับ 🙂" },
        { status: 200 },
      );
    }

    const tenantCode = getTenantCodeBestEffort(req);
    const systemBase: ChatMsg = {
      role: "system",
      content: buildSystemPrompt(tenantCode),
    };
    const question = lastUserText(userMessages);

    const help = await runHelp({
      question,
      role: null,
      universityId: null,
      // allowedDocKeys: ["BOOKING_HOWTO_TH"], // ถ้าอยากบังคับเฉพาะบางเอกสารค่อยเปิดใช้
    });

    if (help.blocked) {
      return NextResponse.json(
        { reply: help.reply, blocked: true, debug: help.meta },
        { status: 200 },
      );
    }

    // ถ้า runHelp ตอบเป็น reply (กรณี question ว่าง) ก็คืนเลย
    if (help.reply && !help.kbText) {
      return NextResponse.json(
        { reply: help.reply, debug: help.meta },
        { status: 200 },
      );
    }

    const kbMsg: ChatMsg | null = help.kbText
      ? {
          role: "system",
          content:
            `ข้อมูลอ้างอิงจากเอกสารระบบ (ให้ยึดตามนี้ก่อน)\n` +
            `ถ้าหาไม่เจอให้บอกว่า "ไม่พบในเอกสาร" และแนะนำทางเลือก\n\n` +
            help.kbText,
        }
      : null;

    const baseURL = (
      process.env.AI_BASE_URL || "http://localhost:11434"
    ).replace(/\/+$/, "");
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
            messages: [systemBase, ...(kbMsg ? [kbMsg] : []), ...userMessages],
            options: { temperature: 0.2 },
          }),
        },
        20000,
      );
    } catch (err: any) {
      const isAbort = String(err?.name) === "AbortError";
      return NextResponse.json(
        {
          reply: isAbort
            ? "ตอนนี้ระบบตอบช้ากว่าปกติ ลองใหม่อีกครั้งนะครับ 🙏"
            : "เชื่อมต่อ AI ไม่สำเร็จ ลองใหม่อีกครั้งนะครับ",
          debug: { ...help.meta, timeout: isAbort },
        },
        { status: 200 },
      );
    }

    if (!r.ok) {
      const text = await r.text().catch(() => "");
      return NextResponse.json(
        {
          reply: "ขอโทษครับ ตอนนี้ตอบไม่ได้ ลองใหม่อีกครั้ง",
          debug: {
            ...help.meta,
            providerStatus: r.status,
            detail: text.slice(0, 300),
          },
        },
        { status: 200 },
      );
    }

    const data = await r.json().catch(() => ({}) as any);
    const content =
      (data?.message?.content ?? "").trim() ||
      "ขอโทษครับ ตอนนี้ตอบไม่ได้ ลองใหม่อีกครั้ง";

    return NextResponse.json(
      { reply: content, debug: help.meta },
      { status: 200 },
    );
  } catch (e: any) {
    return NextResponse.json(
      {
        reply: "ระบบมีปัญหาเล็กน้อย ลองใหม่อีกครั้งนะครับ",
        detail: String(e?.message ?? e).slice(0, 300),
      },
      { status: 200 },
    );
  }
}
