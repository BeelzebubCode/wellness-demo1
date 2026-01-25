// src/app/api/v2/ai/help/route.ts
import { NextRequest, NextResponse } from "next/server";
import { runHelp } from "@/services/aiHelp/runHelp";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

type ChatMsg = { role: "system" | "user" | "assistant"; content: string };

// 🔧 IMPORTANT: ต้องให้ตรงกับ ai_kb_document_key ใน DB ของนายจริงๆ
const POLICY_DOC_KEY = "CHAT_NO_PROFANITY_TH";

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
    .filter((m) => m && typeof m.role === "string" && typeof m.content === "string")
    .filter((m) => m.role === "user" || m.role === "assistant" || m.role === "system")
    .map((m) => ({ role: m.role, content: m.content } as ChatMsg));
}

function lastUserText(msgs: ChatMsg[]) {
  for (let i = msgs.length - 1; i >= 0; i--) if (msgs[i]?.role === "user") return msgs[i].content || "";
  return "";
}

// โหลด policy banned words จาก DB (published JSON)
async function loadBannedWords() {
  const doc = await prisma.aiKbDocument.findFirst({
    where: {
      ai_kb_document_key: POLICY_DOC_KEY,
      ai_kb_document_is_active: true,
      ai_kb_published_version_id: { not: null },
    },
    select: { ai_kb_published_version_id: true },
  });
  if (!doc?.ai_kb_published_version_id) return [];

  const ver = await prisma.aiKbDocumentVersion.findUnique({
    where: { ai_kb_document_version_id: doc.ai_kb_published_version_id },
    select: { ai_kb_content_type: true, ai_kb_source_json: true },
  });
  if (!ver || ver.ai_kb_content_type !== "JSON") return [];

  const rules = Array.isArray((ver.ai_kb_source_json as any)?.rules)
    ? (ver.ai_kb_source_json as any).rules
    : [];

  const bannedRule = rules.find((r: any) => r?.type === "banned_words");
  const banned = Array.isArray(bannedRule?.banned_words) ? bannedRule.banned_words : [];
  return banned.map((x: any) => String(x));
}

export async function POST(req: NextRequest) {
  try {
    const { messages, message } = await req.json().catch(() => ({} as any));

    let userMessages: ChatMsg[] = [];
    if (Array.isArray(messages)) userMessages = coerceUserMessages(messages).filter((m) => m.role !== "system");
    else if (typeof message === "string" && message.trim()) userMessages = [{ role: "user", content: message.trim() }];
    else return NextResponse.json({ error: "Missing message/messages" }, { status: 400 });

    const tenantCode = getTenantCodeBestEffort(req);
    const systemBase: ChatMsg = { role: "system", content: buildSystemPrompt(tenantCode) };

    const question = lastUserText(userMessages).trim();
    if (!question) return NextResponse.json({ reply: "พิมพ์คำถามสั้น ๆ ให้ผมหน่อยครับ 🙂" }, { status: 400 });

    const bannedWords = await loadBannedWords();

    // ✅ runHelp จะคืน kbText + usedDocs
    const help = await runHelp({
      question,
      tenantCode,
      role: null,
      universityId: null,
      bannedWords,
    });

    if (help.blocked) {
      return NextResponse.json({ reply: help.reply, blocked: true, debug: { usedDocs: help.usedDocs } });
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

    const baseURL = (process.env.AI_BASE_URL || "http://localhost:11434").replace(/\/+$/, "");
    const model = process.env.AI_MODEL || "qwen2.5:7b";

    const r = await fetch(`${baseURL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        stream: false,
        messages: [systemBase, ...(kbMsg ? [kbMsg] : []), ...userMessages],
        options: { temperature: 0.2 },
      }),
    });

    if (!r.ok) {
      const text = await r.text().catch(() => "");
      return NextResponse.json({ error: "AI provider error", status: r.status, detail: text.slice(0, 2000) }, { status: 500 });
    }

    const data = await r.json().catch(() => ({} as any));
    const content = (data?.message?.content ?? "").trim() || "ขอโทษครับ ตอนนี้ตอบไม่ได้ ลองใหม่อีกครั้ง";

    return NextResponse.json({
      reply: content,
      debug: {
        usedDocs: help.usedDocs,     // ✅ สำคัญ: ดูเลยว่าดึง doc ไหน
        kbLen: help.kbText?.length ?? 0,
        bannedWordsLoaded: bannedWords.length,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: "Internal error", detail: String(e?.message ?? e).slice(0, 2000) }, { status: 500 });
  }
}
