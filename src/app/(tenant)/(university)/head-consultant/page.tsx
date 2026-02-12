import { headers } from "next/headers";
import { HeadConsultantDashboard } from "@/features/dashboard/head-consultant/components/HeadConsultantDashboard";
import { TENANTS, type TenantCode } from "@/config/tenants";
import { tenantFromHost } from "@/config/tenant-domains";

export default function HeadConsultantDashboardPage() {
  const headersList = headers();
  const host = headersList.get("host");
  const tenantCode = tenantFromHost(host) as TenantCode;
  const tenant = TENANTS[tenantCode] || TENANTS.DEFAULT;

  return <HeadConsultantDashboard universityName={tenant.nameTh} />;
}
