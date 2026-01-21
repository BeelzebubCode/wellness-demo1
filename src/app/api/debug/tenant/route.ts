import { NextResponse } from "next/server";
import { headers, cookies } from "next/headers";
import { tenantFromHost } from "@/config/tenant-domains";

export async function GET() {
  const h = headers();
  const c = cookies();

  const host = h.get("host") || "";
  const xTenant = h.get("x-tenant");
  const cookieTenant = c.get("tenant_code")?.value || null;

  return NextResponse.json({
    host,
    xTenant,
    cookieTenant,
    tenantFromHost: tenantFromHost(host),
    allHeadersHint: {
      "x-forwarded-host": h.get("x-forwarded-host"),
      "x-forwarded-proto": h.get("x-forwarded-proto"),
    },
  });
}
