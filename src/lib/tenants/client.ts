// src/lib/tenant/client.ts
import { normalizeTenant, type TenantCode } from "@/config/tenants";

const STORAGE_KEY = "tenant_code";

/**
 * ตั้งค่า data-tenant ที่ <html> เพื่อให้ CSS theme เปลี่ยนทั้งเว็บ
 * - DEFAULT => ลบ attribute ออก
 * - อื่น ๆ => set data-tenant="NU|CU|KKU|..."
 */
export function applyTenantTheme(code: TenantCode) {
  if (typeof document === "undefined") return;
  const html = document.documentElement;

  if (code === "DEFAULT") {
    html.removeAttribute("data-tenant");
  } else {
    html.setAttribute("data-tenant", code);
  }
}

/** บันทึก tenant ไว้เพื่อให้ refresh แล้วยังเป็นธีมเดิม */
export function saveTenantTheme(code: TenantCode) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, code);
}

/** โหลด tenant ที่เคยบันทึกไว้ */
export function loadTenantTheme(): TenantCode {
  if (typeof window === "undefined") return "DEFAULT";
  return normalizeTenant(window.localStorage.getItem(STORAGE_KEY));
}

/** ล้างค่า (เช่นตอน logout) */
export function clearTenantTheme() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  applyTenantTheme("DEFAULT");
}

/**
 * helper: รับ string (เช่น university_code จาก backend) แล้ว normalize + apply + save
 * ใช้หลัง login ได้เลย
 */
export function setTenantTheme(input?: string | null) {
  const code = normalizeTenant(input);
  applyTenantTheme(code);
  saveTenantTheme(code);
  return code;
}

/**
 * helper: เรียกครั้งเดียวตอนเปิดเว็บ (เช่นใน ThemeProvider useEffect)
 * จะโหลดค่าที่เคย save และ apply ให้ทันที
 */
export function initTenantTheme() {
  const code = loadTenantTheme();
  applyTenantTheme(code);
  return code;
}
