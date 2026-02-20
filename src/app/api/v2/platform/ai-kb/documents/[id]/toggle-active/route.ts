// src/app/api/v2/platform/ai-kb/documents/[id]/toggle-active/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/platformGuard";
import { toggleActive } from "@/services/ai-kb/documents/toggleActive";

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

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  const g = await requireSuperAdmin(req);
  if (!g.ok)
    return NextResponse.json(
      { success: false, error: g.error, code: "FORBIDDEN" },
      { status: g.status },
    );

  const id = parseId(ctx.params);
  if (!id)
    return NextResponse.json(
      { success: false, error: "id ไม่ถูกต้อง", code: "BAD_REQUEST" },
      { status: 400 },
    );

  const updated = await toggleActive(id);
  if (!updated)
    return NextResponse.json(
      { success: false, error: "NOT_FOUND", code: "NOT_FOUND" },
      { status: 404 },
    );

  return NextResponse.json({ success: true, data: { doc: mapDoc(updated) } });
}
