// src/features/auth/login/login-utils.ts

export type TenantItem = { universityId: number; code: string };

export type LoginResponse = {
  success: boolean;
  error?: string;

  tenant?: {
    universityId?: number | null;
    universityCode?: string;
    suggestedSubdomain?: string | null;
  };

  tenants?: TenantItem[];

  account?: {
    id?: number;
    username?: string;
    name?: string;
    role?: string;

    homeUniversityId?: number | null;
    activeUniversityId?: number | null;
    allowedUniversityIds?: number[];
  };
};

export function isSafeNextPath(next: string | null): next is string {
  if (!next) return false;
  if (!next.startsWith("/")) return false;
  if (next.startsWith("//")) return false;
  try {
    const decoded = decodeURIComponent(next);
    if (decoded.startsWith("//")) return false;
  } catch {}
  return true;
}

export function isAdminPath(path: string) {
  // ของคุณมี /admin/... อยู่จริง
  return path.startsWith("/admin");
}

/** ✅ เพิ่ม role/ปรับ route ทำที่เดียว */
export const ROLE_CONFIG: Record<
  string,
  { defaultPath: string; isAdmin?: boolean }
> = {
  SUPER_ADMIN: { defaultPath: "/admin/super", isAdmin: true },
  RECTOR: { defaultPath: "/admin/rector", isAdmin: true },
  HEAD_CONSULTANT: { defaultPath: "/admin/data-center", isAdmin: true },

  CONSULTANT: { defaultPath: "/consultant/my-jobs" },
  STUDENT: { defaultPath: "/booking" },
};

/** เพิ่ม role ใหม่ จะไม่ต้องไปแก้หลายฟังก์ชัน */
export function isAdminRole(role?: string) {
  if (!role) return false;
  return Boolean(ROLE_CONFIG[role]?.isAdmin);
}

export function roleDefaultPath(role?: string) {
  if (!role) return "/";
  return ROLE_CONFIG[role]?.defaultPath ?? "/";
}

/** ✅ map tenantCode -> subdomain (เพิ่มมหาลัย เพิ่มแค่นี้) */
export const TENANT_SUBDOMAIN_MAP: Record<string, string> = {
  NU: "nu",
  KKU: "kku",
  CU: "cu",
};

export function buildTargetHostFromTenantCode(tenantCode: string) {
  const sub = TENANT_SUBDOMAIN_MAP[String(tenantCode || "").toUpperCase()];
  const protocol = window.location.protocol;
  const hostname = window.location.hostname.toLowerCase();
  const port = window.location.port;

  // nu.wellness.local -> wellness.local
  const parts = hostname.split(".");
  const baseDomain = parts.length >= 3 ? parts.slice(1).join(".") : hostname;
  const baseHost = port ? `${baseDomain}:${port}` : baseDomain;

  const targetHost = sub ? `${sub}.${baseHost}` : baseHost;
  const currentHost = port ? `${hostname}:${port}` : hostname;

  return { protocol, targetHost, currentHost };
}

/** URL helper: ใส่ toast params แบบเดิม */
export function withToastUrl(
  protocol: string,
  targetHost: string,
  path: string,
  toastName: string,
  username?: string
) {
  const url = new URL(`${protocol}//${targetHost}${path}`);
  url.searchParams.set("toast", toastName);
  url.searchParams.set("name", username || "");
  url.searchParams.set("toastId", String(Date.now()));
  return url.toString();
}
