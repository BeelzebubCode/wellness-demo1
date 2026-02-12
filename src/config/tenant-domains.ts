// src/config/tenant-domains.ts

/**
 * ดึง university_code จาก host
 * - nu.wellness.local        -> NU
 * - wellness.nu.ac.th        -> NU
 * - wellness.local / localhost / IP -> DEFAULT
 */
export function isLocalHostLike(domain: string) {
  return (
    domain === "localhost" ||
    domain === "127.0.0.1" ||
    domain.endsWith(".localhost") ||
    // regex for IPv4 (e.g. 10.147.19.94)
    /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(domain)
  );
}

export function tenantFromHost(host?: string | null): string {
  if (!host) return "DEFAULT";

  const h = host.toLowerCase().split(":")[0]; // ตัด port

  // ถ้าเป็น IP Address หรือ localhost ไม่ต้องหา subdomain
  if (isLocalHostLike(h)) return "DEFAULT";

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

/**
 * คำนวณ Root Domain สำหรับใช้ร่วมกัน (Shared Domain)
 * - nu.wellness.local -> wellness.local
 * - wellness.nu.ac.th -> nu.ac.th
 * - 10.147.19.94 -> 10.147.19.94
 */
export function getSharedRootDomain(host: string): string {
  const h = host.toLowerCase().split(":")[0];

  if (isLocalHostLike(h)) return h;

  const parts = h.split(".");
  // ถ้าเป็น {sub}.wellness.local
  if (h.endsWith(".wellness.local") && parts.length >= 3) {
    return parts.slice(1).join(".");
  }

  // ถ้าเป็น wellness.{uni}.ac.th
  if (h.endsWith(".ac.th") && parts.length >= 4 && parts[0] === "wellness") {
    return parts.slice(1).join(".");
  }

  // fallback ใช้ env ถ้ามี
  return (process.env.ROOT_DOMAIN || h).toLowerCase().split(":")[0];
}

/**
 * คืนค่า Domain attribute สำหรับ Cookie
 * - wellness.local -> .wellness.local
 * - 10.147.19.94 -> undefined (host-only)
 */
export function getSharedCookieDomain(host: string): string | undefined {
  const root = getSharedRootDomain(host);
  if (!root || isLocalHostLike(root)) return undefined;
  return `.${root}`;
}
