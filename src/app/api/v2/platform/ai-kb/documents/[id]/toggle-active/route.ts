// src/app/api/v2/platform/ai-kb/documents/[id]/toggle-active/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/platformGuard";
import { toggleActive } from "@/services/aiKb/documents/toggleActive";

function parseId(params: { id: string }) {
  const id = Number(params.id);
  return Number.isFinite(id) ? id : null;
}

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  const g = await requireSuperAdmin(req);
  if (!g.ok) return NextResponse.json({ success: false, error: g.error }, { status: g.status });

  const id = parseId(ctx.params);
  if (!id) return NextResponse.json({ success: false, error: "id ไม่ถูกต้อง" }, { status: 400 });

  const updated = await toggleActive(id);
  if (!updated) return NextResponse.json({ success: false, error: "NOT_FOUND" }, { status: 404 });

  return NextResponse.json({ success: true, document: updated });
}
