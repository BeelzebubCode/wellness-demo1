// src/lib/tenant/client.ts
import { normalizeTenant, type TenantCode } from "@/config/tenants";

const STORAGE_KEY = "tenant_code";

export function applyTenantTheme(code: TenantCode) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-tenant", code);
}

export function saveTenantTheme(code: TenantCode) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, code);
}

export function loadTenantTheme(): TenantCode {
  if (typeof window === "undefined") return "DEFAULT";
  return normalizeTenant(window.localStorage.getItem(STORAGE_KEY));
}

export function clearTenantTheme() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  applyTenantTheme("DEFAULT");
}

export function setTenantTheme(input?: string | null) {
  const code = normalizeTenant(input);
  applyTenantTheme(code);
  saveTenantTheme(code);
  return code;
}

/**
 * ✅ Init theme — ไม่ต้องดู subdomain อีกต่อไป
 * อ่านจาก localStorage (ซึ่งถูกเซ็ตตอน login จาก account_home_university_id)
 */
export function initTenantTheme() {
  if (typeof window === "undefined") return "DEFAULT";

  const code = loadTenantTheme();
  applyTenantTheme(code);
  return code;
}
