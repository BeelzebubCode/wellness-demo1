// src/app/api/v2/platform/ai-kb/documents/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/platformGuard";
import { getDocument } from "@/services/aiKb/documents/getDocument";
import { deleteDocument } from "@/services/aiKb/documents/deleteDocument";

function parseId(params: { id: string }) {
  const id = Number(params.id);
  return Number.isFinite(id) ? id : null;
}

export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
  const g = await requireSuperAdmin(req);
  if (!g.ok) return NextResponse.json({ success: false, error: g.error }, { status: g.status });

  const id = parseId(ctx.params);
  if (!id) return NextResponse.json({ success: false, error: "id ไม่ถูกต้อง" }, { status: 400 });

  const data = await getDocument(id);
  if (!data) return NextResponse.json({ success: false, error: "NOT_FOUND" }, { status: 404 });

  return NextResponse.json({ success: true, document: data.document, versions: data.versions });
}

export async function DELETE(req: NextRequest, ctx: { params: { id: string } }) {
  const g = await requireSuperAdmin(req);
  if (!g.ok) return NextResponse.json({ success: false, error: g.error }, { status: g.status });

  const id = parseId(ctx.params);
  if (!id) return NextResponse.json({ success: false, error: "id ไม่ถูกต้อง" }, { status: 400 });

  const result = await deleteDocument(id);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true });
}
