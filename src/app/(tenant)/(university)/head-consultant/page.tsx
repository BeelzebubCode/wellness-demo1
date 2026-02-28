import { cookies } from "next/headers";
import { HeadConsultantDashboard } from "@/features/dashboard/head-consultant/components/HeadConsultantDashboard";
import { TENANTS, type TenantCode, normalizeTenant } from "@/config/tenants";

export default function HeadConsultantDashboardPage() {
  // ✅ อ่าน tenant จาก cookie (ซึ่งตั้งจาก account_home_university_id ตอน login)
  const cookieStore = cookies();
  const tenantCode = normalizeTenant(cookieStore.get("tenant_code")?.value) as TenantCode;
  const tenant = TENANTS[tenantCode] || TENANTS.DEFAULT;

  return <HeadConsultantDashboard universityName={tenant.nameTh} />;
}
