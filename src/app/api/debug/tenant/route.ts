import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const c = cookies();
  const cookieTenant = c.get("tenant_code")?.value || null;

  return NextResponse.json({
    cookieTenant,
    note: "Tenant is resolved from activeUniversityId in auth_token, not from domain.",
  });
}
