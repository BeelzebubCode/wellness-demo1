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

    // ✅ validate scope/active กันค่าหลุด
    const scopeRaw = (searchParams.get("scope") || "ALL").toUpperCase();
    const activeRaw = (searchParams.get("active") || "ALL").toUpperCase();

    const scope = (["ALL", "GLOBAL", "TENANT"] as const).includes(scopeRaw as any)
      ? (scopeRaw as "ALL" | "GLOBAL" | "TENANT")
      : "ALL";

    const active = (["ALL", "ACTIVE", "INACTIVE"] as const).includes(activeRaw as any)
      ? (activeRaw as "ALL" | "ACTIVE" | "INACTIVE")
      : "ALL";

    const universityIdRaw = searchParams.get("universityId");
    const take = Math.min(Math.max(Number(searchParams.get("take") || 20), 1), 100);
    const skip = Math.max(Number(searchParams.get("skip") || 0), 0);

    // ✅ parse universityId แบบกัน NaN
    let universityId: number | null | undefined;
    if (universityIdRaw == null || universityIdRaw === "" || universityIdRaw === "ALL") {
      universityId = undefined;
    } else if (universityIdRaw === "null") {
      universityId = null; // Global
    } else {
      const n = Number(universityIdRaw);
      universityId = Number.isFinite(n) ? n : undefined;
    }

    const result = await listDocuments({
      q,
      scope,
      active,
      universityId,
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
