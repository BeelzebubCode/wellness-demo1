// src/app/api/v2/platform/ai-kb/documents/[id]/versions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/platformGuard";
import { getDocument } from "@/services/ai-kb/documents/getDocument";
import { createVersion } from "@/services/ai-kb/versions/createVersion";

export const runtime = "nodejs";

function parseId(params: { id: string }) {
  const id = Number(params.id);
  return Number.isFinite(id) ? id : null;
}

function mapVersion(v: any) {
  return {
    id: v.ai_kb_document_version_id,
    documentId: v.ai_kb_document_id,
    versionNo: v.ai_kb_version_no,
    contentType: v.ai_kb_content_type,
    status: v.ai_kb_version_status,
    indexStatus: v.ai_kb_index_status,
    sourceMd: v.ai_kb_source_md ?? null,
    sourceJson: v.ai_kb_source_json ?? null,
    sourcePath: v.ai_kb_source_path ?? null,
    updatedAt: v.ai_kb_version_updated_at,
  };
}

export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
  const g = await requireSuperAdmin(req);
  if (!g.ok)
    return NextResponse.json({ success: false, error: g.error }, { status: g.status });

  const docId = parseId(ctx.params);
  if (!docId)
    return NextResponse.json({ success: false, error: "id ไม่ถูกต้อง" }, { status: 400 });

  const data = await getDocument(docId);
  if (!data)
    return NextResponse.json({ success: false, error: "NOT_FOUND" }, { status: 404 });

  const versions = (data.versions ?? []).map(mapVersion);

  return NextResponse.json({
    success: true,
    data: { versions },
  });
}

export async function POST(req: NextRequest, ctx: { params: { id: string } }) {
  const g = await requireSuperAdmin(req);
  if (!g.ok)
    return NextResponse.json({ success: false, error: g.error }, { status: g.status });

  const docId = parseId(ctx.params);
  if (!docId)
    return NextResponse.json({ success: false, error: "id ไม่ถูกต้อง" }, { status: 400 });

  const body = await req.json().catch(() => null);

  const contentType = String(body?.contentType || "").toUpperCase();

  // ✅ รองรับทั้ง sourceMd และ markdown
  const sourceMd =
    body?.sourceMd != null
      ? String(body.sourceMd)
      : body?.markdown != null
        ? String(body.markdown)
        : null;

  // ✅ รองรับทั้ง sourceJson และ json
  const sourceJson =
    body?.sourceJson != null
      ? body.sourceJson
      : body?.json != null
        ? body.json
        : null;

  const sourcePath = body?.sourcePath == null ? null : String(body.sourcePath);

  if (contentType !== "MARKDOWN" && contentType !== "JSON") {
    return NextResponse.json({ success: false, error: "contentType ไม่ถูกต้อง" }, { status: 400 });
  }
  if (contentType === "MARKDOWN" && sourceMd === null) {
    return NextResponse.json({ success: false, error: "MARKDOWN ต้องมี sourceMd" }, { status: 400 });
  }
  if (contentType === "JSON" && sourceJson === null) {
    return NextResponse.json({ success: false, error: "JSON ต้องมี sourceJson" }, { status: 400 });
  }

  const created = await createVersion({
    documentId: docId,
    contentType: contentType as any,
    sourceMd,
    sourceJson,
    sourcePath,
  });

  if (!created.ok) {
    return NextResponse.json({ success: false, error: created.error }, { status: created.status });
  }

  // ✅ สำคัญ: map ให้ FE ได้ shape เดียวกับ GET
  return NextResponse.json({
    success: true,
    data: { version: mapVersion(created.version) },
  });
}
