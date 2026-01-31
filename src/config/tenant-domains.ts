// src/config/tenant-domains.ts

/**
 * ดึง university_code จาก host
 * - nu.wellness.local        -> NU
 * - wellness.nu.ac.th        -> NU
 * - wellness.local / localhost -> DEFAULT
 */
export function tenantFromHost(host?: string | null): string {
  if (!host) return "DEFAULT";

  const h = host.toLowerCase().split(":")[0]; // ตัด port

  // pattern 1: {tenant}.wellness.local
  if (h.endsWith(".wellness.local")) {
    const sub = h.split(".")[0];
    return sub.toUpperCase();
  }

  // pattern 2: wellness.{tenant}.ac.th
  if (h.endsWith(".ac.th")) {
    const parts = h.split(".");
    // ["wellness","nu","ac","th"]
    if (parts.length >= 4 && parts[0] === "wellness") {
      return parts[1].toUpperCase();
    }
  }

  // domain หลัก
  return "DEFAULT";
}
