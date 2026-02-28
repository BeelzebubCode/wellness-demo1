// src/features/auth/login/login-utils.ts

export type TenantItem = { universityId: number; code: string };

export type LoginResponse = {
  success: boolean;
  error?: string;

  tenant?: {
    universityId?: number | null;
    universityCode?: string;
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
  } catch { }
  return true;
}

export function isAdminPath(path: string) {
  return path.startsWith("/admin");
}

/** ✅ เพิ่ม role/ปรับ route ทำที่เดียว */
export const ROLE_CONFIG: Record<
  string,
  { defaultPath: string; isAdmin?: boolean }
> = {
  SUPER_ADMIN: { defaultPath: "/super-admin/ai-kb", isAdmin: true },
  MINISTRY: { defaultPath: "/ministry", isAdmin: true },
  RECTOR: { defaultPath: "/rector", isAdmin: true },
  HEAD_CONSULTANT: { defaultPath: "/head-consultant", isAdmin: true },
  DEAN: { defaultPath: "/dean", isAdmin: true },

  ADVISOR: { defaultPath: "/advisor", isAdmin: false },
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
