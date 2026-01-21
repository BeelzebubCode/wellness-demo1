// src/config/tenant-domains.ts
export type TenantCode = "DEFAULT" | "NU" | "CU" | "KKU";

export function tenantFromHost(host: string): TenantCode {
  const h = (host || "").toLowerCase().split(":")[0]; // ตัด port

  if (h.startsWith("cu.")) return "CU";
  if (h.startsWith("nu.")) return "NU";
  if (h.startsWith("kku.")) return "KKU";

  // domain หลัก / local หลัก
  // wellness.local หรือ wellness.localhost อะไรก็แล้วแต่ -> DEFAULT
  return "DEFAULT";
}
