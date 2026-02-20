
import { NextRequest, NextResponse } from "next/server";
import { requireTenant, assertRole } from "@/lib/tenant/server";
import { processAnalystQuery } from "@/services/ai-agent/analyst/query-agent";

export async function POST(req: NextRequest) {
  try {
    const { account, activeUniversityId } = await requireTenant(req);
    
    // Allow Rector and higher roles (Ministry, SuperAdmin)
    assertRole(account.role, ["RECTOR", "MINISTRY", "SUPER_ADMIN"]); 

    const body = await req.json();
    const { query, universityId } = body;

    let targetUniversityId = universityId;

    // Security Enforcement
    if (account.role === "RECTOR") {
      // Rector can ONLY query their own university
      targetUniversityId = activeUniversityId;
    } 
    // Ministry/SuperAdmin can query any university (passed in body) or all (undefined)

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const result = await processAnalystQuery({
      query,
      universityId: targetUniversityId,
    });

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("[AI Analyst]", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: error.status || 500 }
    );
  }
}
