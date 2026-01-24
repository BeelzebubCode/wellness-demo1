// src/app/api/v2/platform/ai-kb/documents/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/platformGuard";
import { uploadDocument } from "@/services/aiKb/documents/uploadDocument";

export const runtime = "nodejs";

function bad(msg: string, status = 400) {
  return NextResponse.json(
    { success: false, error: msg, code: "BAD_REQUEST" },
    { status },
  );
}

export async function POST(req: NextRequest) {
  try {
    const g = await requireSuperAdmin(req);
    if (!g.ok) {
      return NextResponse.json(
        { success: false, error: g.error, code: "UNAUTHORIZED" },
        { status: g.status },
      );
    }

    const form = await req.formData();

    // scope
    const scope = String(form.get("scope") ?? "GLOBAL").toUpperCase();
    if (scope !== "GLOBAL" && scope !== "TENANT") {
      return bad("scope ไม่ถูกต้อง (GLOBAL|TENANT)");
    }

    // universityId (บังคับเฉพาะ TENANT)
    const universityIdRaw = form.get("universityId");
    const universityId =
      universityIdRaw === null ||
      universityIdRaw === "" ||
      universityIdRaw === "null"
        ? null
        : Number(universityIdRaw);

    if (scope === "TENANT" && !Number.isFinite(universityId)) {
      return bad("TENANT ต้องระบุ universityId");
    }

    // file
    const file = form.get("file");
    if (!(file instanceof File)) {
      return bad("ต้องส่งไฟล์ด้วย field ชื่อ file");
    }

    if (file.size > 10 * 1024 * 1024) {
      return bad("ไฟล์ใหญ่เกินไป (สูงสุด 10MB)");
    }

    // ✅ อัปโหลดอย่างเดียว ไม่ต้องกรอกอะไร
    const created = await uploadDocument({
      universityId: scope === "GLOBAL" ? null : universityId,
      file,
    });

    return NextResponse.json({ success: true, data: created }, { status: 200 });
  } catch (e: any) {
    console.error("[AI_KB_DOCS_UPLOAD]", e);

    // ✅ dev-friendly (ชั่วคราว)
    const msg = String(e?.message || e);

    // Prisma table missing / migrate not ready
    if (
      msg.includes("P2021") ||
      msg.includes("does not exist") ||
      msg.includes("relation")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "DB ยังไม่พร้อม (ยังไม่ได้ migrate ตาราง AI KB)",
          code: "AI_KB_NOT_READY",
        },
        { status: 503 },
      );
    }

    // JSON parse fail
    if (msg.includes("Unexpected token") || msg.includes("JSON")) {
      return NextResponse.json(
        {
          success: false,
          error: "ไฟล์ JSON ไม่ถูกต้อง (parse ไม่ได้)",
          code: "BAD_JSON",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, error: msg, code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
