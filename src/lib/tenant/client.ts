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
 * ✅ FIX: โดเมนกลาง (ไม่มี subdomain) ต้องเป็น DEFAULT เสมอ
 * - wellness.local → DEFAULT
 * - nu.wellness.local → ใช้ค่าที่ save ไว้ (หรือค่าที่ detect)
 */
export function initTenantTheme() {
  if (typeof window === "undefined") return "DEFAULT";

  const hostname = window.location.hostname.toLowerCase();

  // localhost / ip ถือว่าเป็นโดเมนกลาง
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    clearTenantTheme();
    return "DEFAULT";
  }

  const parts = hostname.split(".");
  const hasSubdomain = parts.length >= 3; // nu.wellness.local => true, wellness.local => false

  // ✅ ถ้าไม่มี subdomain -> บังคับ DEFAULT และล้างที่เคยจำ
  if (!hasSubdomain) {
    clearTenantTheme();
    return "DEFAULT";
  }

  // มี subdomain -> ใช้ค่าที่เคยบันทึกไว้
  const code = loadTenantTheme();
  applyTenantTheme(code);
  return code;
}
