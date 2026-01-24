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

  const r = await publishVersion(versionId);
  if (!r.ok) return NextResponse.json({ success: false, error: r.error }, { status: r.status });

  // ส่งกลับแบบ frontend อยากได้
  return NextResponse.json({ success: true, data: { document: r.document, version: r.version } });
}

