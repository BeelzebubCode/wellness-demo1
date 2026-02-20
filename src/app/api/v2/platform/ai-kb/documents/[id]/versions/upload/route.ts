// v2/platform/ai-kb/documents/[id]/versions/upload/route.ts

import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/platformGuard";
import { createVersionFromUpload } from "@/services/ai-kb/versions/createVersionFromUpload";

function parseId(params: { id: string }) {
  const id = Number(params.id);
  return Number.isFinite(id) ? id : null;
}

export async function POST(req: NextRequest, ctx: { params: { id: string } }) {
  const g = await requireSuperAdmin(req);
  if (!g.ok) {
    return NextResponse.json({ success: false, error: g.error }, { status: g.status });
  }

  const docId = parseId(ctx.params);
  if (!docId) {
    return NextResponse.json({ success: false, error: "id ไม่ถูกต้อง" }, { status: 400 });
  }

  const fd = await req.formData();
  const file = fd.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ success: false, error: "ต้องแนบไฟล์" }, { status: 400 });
  }

  // optional: บังคับชนิด
  const contentTypeRaw = String(fd.get("contentType") ?? "").toUpperCase();
  const contentType = contentTypeRaw === "JSON" ? "JSON" : "MARKDOWN"; // default MARKDOWN

  const r = await createVersionFromUpload({ docId, file, contentType });
  if (!r.ok) {
    return NextResponse.json({ success: false, error: r.error }, { status: r.status });
  }

  return NextResponse.json({ success: true, data: { version: r.version } }, { status: 200 });
}
