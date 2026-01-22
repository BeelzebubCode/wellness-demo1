// src/features/auth/login/login-utils.ts

export type LoginResponse = {
  success: boolean;
  error?: string;
  tenant?: { universityCode?: string };
  account?: {
    username?: string;
    name?: string;
    role?: string;
    homeUniversityId?: number | null;
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
  return path.startsWith("/admin");
}

export function isAdminRole(role?: string) {
  return role === "SUPER_ADMIN" || role === "RECTOR" || role === "HEAD_CONSULTANT";
}

export function roleDefaultPath(role?: string) {
  return role === "SUPER_ADMIN"
    ? "/admin/super"
    : role === "RECTOR"
      ? "/admin/rector"
      : role === "HEAD_CONSULTANT"
        ? "/admin/data-center"
        : role === "CONSULTANT"
          ? "/consultant/my-jobs"
          : role === "STUDENT"
            ? "/booking"
            : "/";
}

export function buildTargetHostFromTenant(tenantCode: string) {
  const subdomainMap: Record<string, string> = {
    NU: "nu",
    KKU: "kku",
    CU: "cu",
  };

  const sub = subdomainMap[tenantCode];
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
