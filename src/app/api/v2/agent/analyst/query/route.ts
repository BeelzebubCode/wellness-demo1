
import { NextRequest, NextResponse } from "next/server";
import { requireTenant, assertRole } from "@/lib/tenant/server";
import { processAnalystQuery } from "@/services/ai-agent/analyst/query-agent";

export async function POST(req: NextRequest) {
  try {
    const { account, activeUniversityId } = await requireTenant(req);
    
    // Allow all roles except Consultant / Head Consultant
    assertRole(account.role, ["STUDENT", "PERSONNEL", "ADMIN", "DEAN", "RECTOR", "MINISTRY", "SUPER_ADMIN"]); 

    const body = await req.json();
    const { query, messages, universityId } = body;

    let targetQuery = query;
    if (!targetQuery && messages && Array.isArray(messages)) {
      // Find the last user message
      const lastUserMsg = [...messages].reverse().find((m: any) => m.role === "user");
      if (lastUserMsg) targetQuery = lastUserMsg.content;
    }

    let targetUniversityId = universityId;

    // Security Enforcement
    if (account.role === "RECTOR") {
      // Rector can ONLY query their own university
      targetUniversityId = activeUniversityId;
    } 
    // Ministry/SuperAdmin can query any university (passed in body) or all (undefined)

    if (!targetQuery) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const result = await processAnalystQuery({
      query: targetQuery,
      universityId: targetUniversityId,
      role: account.role,
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
