// src/app/api/v2/platform/ai-kb/versions/[versionId]/publish/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/platformGuard";
import { publishVersion } from "@/services/aiKb/versions/publishVersion";

function parseId(params: { versionId: string }) {
  const id = Number(params.versionId);
  return Number.isFinite(id) ? id : null;
}

export async function POST(req: NextRequest, ctx: { params: { versionId: string } }) {
  const g = await requireSuperAdmin(req);
  if (!g.ok) return NextResponse.json({ success: false, error: g.error }, { status: g.status });

  const versionId = parseId(ctx.params);
  if (!versionId) return NextResponse.json({ success: false, error: "versionId ไม่ถูกต้อง" }, { status: 400 });

  const result = await publishVersion(versionId);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true, document: result.document, version: result.version });
}
