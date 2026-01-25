// src/app/api/v2/platform/ai-kb/documents/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/platformGuard";
import { getDocument } from "@/services/aiKb/documents/getDocument";
import { deleteDocument } from "@/services/aiKb/documents/deleteDocument";

function parseId(params: { id: string }) {
  const id = Number(params.id);
  return Number.isFinite(id) ? id : null;
}

function mapDoc(d: any) {
  return {
    id: d.ai_kb_document_id,
    universityId: d.university_id,
    key: d.ai_kb_document_key,
    title: d.ai_kb_document_title,
    category: d.ai_kb_document_category,
    urlHint: d.ai_kb_document_url_hint,
    isActive: d.ai_kb_document_is_active,
    publishedVersionId: d.ai_kb_published_version_id,
    updatedAt: d.ai_kb_document_updated_at,
  };
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
    return NextResponse.json(
      { success: false, error: g.error },
      { status: g.status },
    );

  const id = parseId(ctx.params);
  if (!id)
    return NextResponse.json(
      { success: false, error: "id ไม่ถูกต้อง" },
      { status: 400 },
    );

  const data = await getDocument(id);
  if (!data)
    return NextResponse.json(
      { success: false, error: "NOT_FOUND" },
      { status: 404 },
    );

  return NextResponse.json(
    {
      success: true,
      data: {
        doc: mapDoc(data.document),
        versions: (data.versions ?? []).map(mapVersion),
      },
    },
    { status: 200 },
  );
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: { id: string } },
) {
  const g = await requireSuperAdmin(req);
  if (!g.ok)
    return NextResponse.json(
      { success: false, error: g.error },
      { status: g.status },
    );

  const id = parseId(ctx.params);
  if (!id)
    return NextResponse.json(
      { success: false, error: "id ไม่ถูกต้อง" },
      { status: 400 },
    );

  const result = await deleteDocument(id);
  if (!result.ok) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json({ success: true, data: { deleted: true } });
}
