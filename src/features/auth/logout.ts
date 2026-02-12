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
  // คืนค่า ".wellness.local" จาก "nu.wellness.local" หรือ ".nu.ac.th" จาก "wellness.nu.ac.th"
  // ถ้าเป็น localhost / ip จะคืน undefined
  try {
    const hostname = window.location.hostname.toLowerCase();
    const isIp = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostname);
    if (hostname === "localhost" || hostname === "127.0.0.1" || isIp) return undefined;

    const parts = hostname.split(".");
    
    // Pattern 1: {sub}.wellness.local -> wellness.local
    if (hostname.endsWith(".wellness.local") && parts.length >= 3) {
      return `.${parts.slice(1).join(".")}`; // .wellness.local
    }

    // Pattern 2: wellness.{uni}.ac.th -> {uni}.ac.th
    if (hostname.endsWith(".ac.th") && parts.length >= 4 && parts[0] === "wellness") {
      return `.${parts.slice(1).join(".")}`; // .nu.ac.th
    }

    // Fallback: ถ้าไม่เข้าทั้ง 2 pattern ให้คืน undefined
    return undefined;
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
    expireCookie("tenant_code"); // host-only fallback

    // 4) 🔥 ล้าง storage ฝั่ง client ทั้งหมด (แก้ปัญหาบัญชีผี!)
    try {
      localStorage.clear(); // ล้างทุกอย่างเพื่อกันบัญชีผี
      sessionStorage.clear();
    } catch {}
  }
}
