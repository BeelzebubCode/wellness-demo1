// src/app/api/v2/platform/ai-kb/documents/[id]/versions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/platformGuard";
import { getDocument } from "@/services/aiKb/documents/getDocument";
import { createVersion } from "@/services/aiKb/versions/createVersion";

function parseId(params: { id: string }) {
  const id = Number(params.id);
  return Number.isFinite(id) ? id : null;
}

export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
  const g = await requireSuperAdmin(req);
  if (!g.ok) return NextResponse.json({ success: false, error: g.error }, { status: g.status });

  const docId = parseId(ctx.params);
  if (!docId) return NextResponse.json({ success: false, error: "id ไม่ถูกต้อง" }, { status: 400 });

  const data = await getDocument(docId);
  if (!data) return NextResponse.json({ success: false, error: "NOT_FOUND" }, { status: 404 });

  return NextResponse.json({ success: true, versions: data.versions });
}

export async function POST(req: NextRequest, ctx: { params: { id: string } }) {
  const g = await requireSuperAdmin(req);
  if (!g.ok) return NextResponse.json({ success: false, error: g.error }, { status: g.status });

  const docId = parseId(ctx.params);
  if (!docId) return NextResponse.json({ success: false, error: "id ไม่ถูกต้อง" }, { status: 400 });

  const body = await req.json().catch(() => null);

  const contentType = String(body?.contentType || "").toUpperCase();
  const sourceMd = body?.sourceMd == null ? null : String(body.sourceMd);
  const sourceJson = body?.sourceJson == null ? null : body.sourceJson;
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

  return NextResponse.json({ success: true, version: created.version });
}
