// src/features/auth/logout.ts
const SUPPRESS_TOAST_KEY = "suppress_login_toast_once";

function expireCookie(name: string, domain?: string) {
  // ลบ cookie เฉพาะกรณีที่มันไม่ใช่ httpOnly (tenant_code มักจะเป็นแบบนี้)
  try {
    document.cookie = `${name}=; Path=/; Max-Age=0`;
    if (domain) {
      document.cookie = `${name}=; Path=/; Max-Age=0; Domain=${domain}`;
    }
  } catch {}
}

function getRootDomainDot(): string | undefined {
  // คืนค่า ".wellness.local" จาก "kku.wellness.local"
  // ถ้าเป็น localhost / ip จะคืน undefined
  try {
    const hostname = window.location.hostname.toLowerCase();
    if (hostname === "localhost" || hostname === "127.0.0.1") return undefined;
    const parts = hostname.split(".");
    if (parts.length < 3) return undefined;
    return `.${parts.slice(1).join(".")}`; // .wellness.local
  } catch {
    return undefined;
  }
}

export async function logout() {
  // 1) suppress toast
  try {
    sessionStorage.setItem(SUPPRESS_TOAST_KEY, "1");
  } catch {}

  // 2) ยิง logout ให้ server ลบ cookie (ต้องเช็ค status)
  try {
    const res = await fetch("/api/v2/auth/logout", {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "application/json",
      },
    });

    // ถ้า server ตอบ error ให้ throw เพื่อให้ UI จัดการได้
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Logout failed: ${res.status} ${text}`);
    }
  } catch (e) {
    // โยนต่อให้ปุ่ม logout ไปโชว์ toast error ได้
    throw e;
  } finally {
    // 3) เคลียร์ tenant ฝั่ง client ให้กลับ DEFAULT
    // (ทำได้เฉพาะ cookie ที่ไม่ httpOnly เท่านั้น)
    const rootDot = getRootDomainDot(); // ".wellness.local"
    expireCookie("tenant_code", rootDot);

    // 4) ล้าง storage ฝั่ง client (ของนายเดิม)
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("auth_user");
      localStorage.removeItem("adminToken");
      localStorage.removeItem("admin_user");
      localStorage.removeItem("active_university_id");
      localStorage.removeItem("selectedUniversityId");
    } catch {}

    try {
      sessionStorage.removeItem("toast_login_required_student");
      sessionStorage.removeItem("toast_login_required_admin");
      sessionStorage.removeItem("toast_login_required_consultant");
    } catch {}
  }
}
