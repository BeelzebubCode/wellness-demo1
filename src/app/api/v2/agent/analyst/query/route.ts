import { NextRequest, NextResponse } from "next/server";
import { requireTenant, assertRole } from "@/lib/tenant/server";
import { runAnalytics } from "@/services/ai-agent/analyst/orchestrator";

export async function POST(req: NextRequest) {
  try {
    const { account, activeUniversityId } = await requireTenant(req);
    assertRole(account.role, ["STUDENT", "PERSONNEL", "ADMIN", "DEAN", "RECTOR", "MINISTRY", "SUPER_ADMIN", "CONSULTANT", "HEAD_CONSULTANT"]);

    const body = await req.json();
    const { query, messages, universityId } = body;

    let targetQuery = query;
    if (!targetQuery && messages && Array.isArray(messages)) {
      const lastUserMsg = [...messages].reverse().find((m: any) => m.role === "user");
      if (lastUserMsg) targetQuery = lastUserMsg.content;
    }

    if (!targetQuery) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    let targetUniversityId = universityId || activeUniversityId;
    let targetFacultyId: number | null = null;
    const r = String(account.role);

    if (["RECTOR", "DEAN", "STUDENT", "PERSONNEL", "CONSULTANT", "HEAD_CONSULTANT"].includes(r)) {
      targetUniversityId = activeUniversityId;
    }

    if (r === "DEAN") {
      const prisma = (await import("@/lib/prisma")).default;
      const fac = await prisma.faculty.findFirst({
        where: { dean_account_id: account.accountId }
      });
      if (fac) targetFacultyId = fac.faculty_id;
    }

    const scope = {
      university_id: targetUniversityId,
      faculty_id: targetFacultyId ?? undefined,
      role: r,
    };

    const reply = await runAnalytics(targetQuery, scope, messages || []);

    return NextResponse.json({
      type: "text" as const,
      title: "AI Analyst",
      reply,
      data: [],
    });

  } catch (error: any) {
    console.error("[AI Analyst]", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: error.status || 500 }
    );
  }
}
