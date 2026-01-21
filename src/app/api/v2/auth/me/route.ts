// src/app/api/v2/auth/me/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = await getAuth(req);
    if (!payload) return NextResponse.json({ valid: false }, { status: 401 });

    return NextResponse.json({
      valid: true,
      account: {
        id: payload.accountId,
        username: payload.username,
        role: payload.role,
        consultantId: payload.consultantId ?? null,
        homeUniversityId: payload.homeUniversityId ?? null,
        allowedUniversityIds: payload.allowedUniversityIds ?? [],
      },
    });
  } catch {
    return NextResponse.json({ valid: false }, { status: 401 });
  }
}
