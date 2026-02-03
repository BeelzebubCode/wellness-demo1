// src/app/api/v2/ai/agent/help

import { NextRequest, NextResponse } from "next/server";
import { coerceMessages, lastUserText, type ChatMsg } from "@/services/aiAgent/core/http/request";
import { runHelpChat } from "@/services/aiAgent/help";

export const runtime = "nodejs";

function getTenantCodeBestEffort(req: NextRequest) {
  return (
    req.cookies.get("tenant_code")?.value ||
    req.headers.get("x-tenant-code") ||
    req.headers.get("x-tenant") ||
    undefined
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const { messages, message } = body ?? {};

    let userMessages: ChatMsg[] = [];
    if (Array.isArray(messages)) {
      userMessages = coerceMessages(messages).filter((m) => m.role !== "system");
    } else if (typeof message === "string" && message.trim()) {
      userMessages = [{ role: "user", content: message.trim() }];
    } else {
      return NextResponse.json({ reply: "พิมพ์คำถามสั้น ๆ ให้ผมหน่อยครับ 🙂" }, { status: 200 });
    }

    // กันว่างแบบชัวร์
    if (!lastUserText(userMessages).trim()) {
      return NextResponse.json({ reply: "พิมพ์คำถามสั้น ๆ ให้ผมหน่อยครับ 🙂" }, { status: 200 });
    }

    const tenantCode = getTenantCodeBestEffort(req);
    const out = await runHelpChat({ tenantCode, messages: userMessages });

    return NextResponse.json(out, { status: 200 });
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
