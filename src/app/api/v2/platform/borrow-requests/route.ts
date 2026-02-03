//src\app\api\v2\platform\borrow-requests\route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireTenant, assertRole } from "@/lib/tenant/server";
import { platformListBorrowRequests } from "@/services/borrowRequests";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { accountId, role } = await requireTenant(req);
    assertRole(role, ["SUPER_ADMIN"]);

    const { searchParams } = new URL(req.url);

    const status = searchParams.get("status") || undefined;
    const fromUniversityId = searchParams.get("fromUniversityId");
    const q = searchParams.get("q") || undefined;

    const page = Number(searchParams.get("page") || 1);
    const pageSize = Number(searchParams.get("pageSize") || 20);

    const data = await platformListBorrowRequests({
      accountId,
      status: status as any,
      fromUniversityId: fromUniversityId ? Number(fromUniversityId) : undefined,
      q,
      page,
      pageSize,
    });

    return NextResponse.json({ ok: true, data });
  } catch (err) {
    console.error("❌ platform borrow-requests GET error:", err);

    return NextResponse.json(
      {
        ok: false,
        error: "Internal Server Error",
        // ✅ DEV debug (ปลอดภัยใน local)
        debug:
          process.env.NODE_ENV !== "production"
            ? {
                name: (err as any)?.name,
                code: (err as any)?.code,
                message: (err as any)?.message,
                meta: (err as any)?.meta,
              }
            : undefined,
      },
      { status: 500 }
    );
  }
}
