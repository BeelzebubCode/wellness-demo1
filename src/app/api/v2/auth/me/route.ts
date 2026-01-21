// src/app/api/v2/auth/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAccountFromRequest } from "@/lib/jwt";

export async function GET(req: NextRequest) {
  try {
    const account = await getAccountFromRequest(req);
    if (!account) return NextResponse.json({ valid: false }, { status: 401 });

    return NextResponse.json({
      valid: true,
      account: {
        id: account.accountId,
        username: account.username,
        role: account.role,
        consultantId: account.consultantId ?? null,
        studentId: account.studentId ?? null,
        homeUniversityId: account.homeUniversityId ?? null,
        activeUniversityId: account.activeUniversityId ?? null,
        allowedUniversityIds: account.allowedUniversityIds ?? [],
      },
    });
  } catch (e) {
    console.error("[AUTH_ME_V2]", e);
    return NextResponse.json({ valid: false }, { status: 401 });
  }
}
