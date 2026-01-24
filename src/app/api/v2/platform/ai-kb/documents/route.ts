// src/app/api/v2/platform/ai-kb/documents/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/platformGuard";
import { listDocuments } from "@/services/aiKb/documents/listDocuments";

export async function GET(req: NextRequest) {
  try {
    const g = await requireSuperAdmin(req);
    if (!g.ok) {
      return NextResponse.json(
        { success: false, error: g.error, code: "UNAUTHORIZED" },
        { status: g.status },
      );
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const scope = (searchParams.get("scope") || "ALL").toUpperCase();
    const active = (searchParams.get("active") || "ALL").toUpperCase();

    const universityIdRaw = searchParams.get("universityId");
    const take = Math.min(Math.max(Number(searchParams.get("take") || 20), 1), 100);
    const skip = Math.max(Number(searchParams.get("skip") || 0), 0);

    const universityId =
      universityIdRaw === null || universityIdRaw === undefined || universityIdRaw === "ALL"
        ? undefined
        : universityIdRaw === "null"
          ? null
          : Number(universityIdRaw);

    const result = await listDocuments({
      q,
      scope: scope as any,
      active: active as any,
      universityId: universityId as any,
      take,
      skip,
    });

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (e) {
    console.error("[AI_KB_DOCS_GET]", e);
    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาดชั่วคราว", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
