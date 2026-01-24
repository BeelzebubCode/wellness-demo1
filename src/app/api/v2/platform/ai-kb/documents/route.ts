// src/app/api/v2/platform/ai-kb/documents/route.ts

import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/platformGuard";
import { listDocuments } from "@/services/aiKb/documents/listDocuments";
import { createDocument } from "@/services/aiKb/documents/createDocument";

/**
 * แปลง error ให้เป็นข้อความที่ user อ่านรู้เรื่อง
 * - 503: ระบบ/ฐานข้อมูลยังไม่พร้อม (เช่นยังไม่ได้ migrate ตาราง)
 * - 500: ข้อผิดพลาดภายใน
 */
function toPublicError(e: any): { status: number; code: string; error: string } {
  const msg = String(e?.message || "");

  // Prisma: table not exist / migrate ยังไม่ลง / DB schema ยังไม่พร้อม
  if (
    msg.includes("P2021") || // prisma: table does not exist
    msg.includes("does not exist") ||
    msg.includes('relation "ai_kb_document"') ||
    msg.includes('relation "ai_kb_document_version"') ||
    msg.includes('relation "ai_kb_chunk"') ||
    msg.includes("ai_kb_document") ||
    msg.includes("ai_kb_document_version") ||
    msg.includes("ai_kb_chunk")
  ) {
    return {
      status: 503,
      code: "AI_KB_NOT_READY",
      error: "คลังความรู้ยังไม่พร้อมใช้งาน (กำลังติดตั้ง/อัปเดตฐานข้อมูล) กรุณาลองใหม่อีกครั้ง",
    };
  }

  // Prisma schema mismatch / query field ผิด
  if (msg.includes("Unknown argument") || msg.includes("PrismaClientValidationError")) {
    return {
      status: 500,
      code: "AI_KB_SCHEMA_MISMATCH",
      error: "คลังความรู้มีข้อผิดพลาดภายใน (รูปแบบข้อมูลไม่ตรงกัน) กรุณาแจ้งผู้ดูแลระบบ",
    };
  }

  // default
  return {
    status: 500,
    code: "INTERNAL_ERROR",
    error: "เกิดข้อผิดพลาดชั่วคราว กรุณาลองใหม่อีกครั้ง",
  };
}

export async function GET(req: NextRequest) {
  try {
    const g = await requireSuperAdmin(req);
    if (!g.ok) {
      return NextResponse.json({ success: false, error: g.error, code: "UNAUTHORIZED" }, { status: g.status });
    }

    const { searchParams } = new URL(req.url);

    const q = searchParams.get("q") || "";
    const scope = (searchParams.get("scope") || "ALL").toUpperCase(); // ALL | GLOBAL | TENANT
    const active = (searchParams.get("active") || "ALL").toUpperCase(); // ALL | ACTIVE | INACTIVE

    const universityIdRaw = searchParams.get("universityId"); // number | "ALL" | "null"
    const takeRaw = searchParams.get("take");
    const skipRaw = searchParams.get("skip");

    const take = Math.min(Math.max(Number(takeRaw || 20), 1), 100);
    const skip = Math.max(Number(skipRaw || 0), 0);

    const universityId =
      !universityIdRaw || universityIdRaw === "ALL"
        ? null
        : universityIdRaw === "null"
          ? null
          : Number(universityIdRaw);

    if (
      universityIdRaw &&
      universityIdRaw !== "ALL" &&
      universityIdRaw !== "null" &&
      !Number.isFinite(universityId)
    ) {
      return NextResponse.json({ success: false, error: "universityId ไม่ถูกต้อง", code: "BAD_REQUEST" }, { status: 400 });
    }

    const result = await listDocuments({
      q,
      scope: scope as any,
      active: active as any,
      universityId,
      take,
      skip,
    });

    // ✅ ถ้าไม่มีข้อมูล ให้ result.items เป็น [] (อันนี้ต้องทำใน listDocuments ด้วย)
    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (e: any) {
    console.error("[AI_KB_DOCS_GET]", e);
    const pe = toPublicError(e);
    return NextResponse.json({ success: false, error: pe.error, code: pe.code }, { status: pe.status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const g = await requireSuperAdmin(req);
    if (!g.ok) {
      return NextResponse.json({ success: false, error: g.error, code: "UNAUTHORIZED" }, { status: g.status });
    }

    const body = await req.json().catch(() => null);

    const universityId =
      body?.universityId === null || body?.universityId === undefined
        ? null
        : Number(body?.universityId);

    if (body?.universityId !== null && body?.universityId !== undefined && !Number.isFinite(universityId)) {
      return NextResponse.json({ success: false, error: "universityId ไม่ถูกต้อง", code: "BAD_REQUEST" }, { status: 400 });
    }

    const key = String(body?.key || "").trim();
    const title = String(body?.title || "").trim();
    const category = body?.category == null ? null : String(body.category).trim() || null;
    const urlHint = body?.urlHint == null ? null : String(body.urlHint).trim() || null;

    const contentType = String(body?.contentType || "").toUpperCase();

    // ✅ รองรับทั้ง 2 ชื่อ (FE ส่ง markdown/json, route เก่าใช้ sourceMd/sourceJson)
    const sourceMd =
      body?.sourceMd != null ? String(body.sourceMd)
      : body?.markdown != null ? String(body.markdown)
      : null;

    const sourceJson =
      body?.sourceJson != null ? body.sourceJson
      : body?.json != null ? body.json
      : null;

    if (!key || !title) {
      return NextResponse.json({ success: false, error: "กรุณากรอก key และ title", code: "BAD_REQUEST" }, { status: 400 });
    }

    if (contentType !== "MARKDOWN" && contentType !== "JSON") {
      return NextResponse.json({ success: false, error: "contentType ไม่ถูกต้อง", code: "BAD_REQUEST" }, { status: 400 });
    }

    if (contentType === "MARKDOWN" && sourceMd === null) {
      return NextResponse.json({ success: false, error: "MARKDOWN ต้องมี markdown/sourceMd", code: "BAD_REQUEST" }, { status: 400 });
    }

    if (contentType === "JSON" && sourceJson === null) {
      return NextResponse.json({ success: false, error: "JSON ต้องมี json/sourceJson", code: "BAD_REQUEST" }, { status: 400 });
    }

    const created = await createDocument({
      universityId,
      key,
      title,
      category,
      urlHint,
      contentType: contentType as any,
      sourceMd,
      sourceJson,
    });

    return NextResponse.json({ success: true, data: created }, { status: 200 });
  } catch (e: any) {
    console.error("[AI_KB_DOCS_POST]", e);
    const pe = toPublicError(e);
    return NextResponse.json({ success: false, error: pe.error, code: pe.code }, { status: pe.status });
  }
}
