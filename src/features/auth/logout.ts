// src/features/auth/logout.ts
const SUPPRESS_TOAST_KEY = "suppress_login_toast_once";

function expireCookie(name: string) {
  try {
    document.cookie = `${name}=; Path=/; Max-Age=0`;
  } catch { }
}

export async function logout() {
  // 1) suppress toast
  try {
    sessionStorage.setItem(SUPPRESS_TOAST_KEY, "1");
  } catch { }

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
    // (ทำได้เฉพาะ cookie ที่ไม่ httpOnly เท่านั้น — host-only cookie)
    expireCookie("tenant_code");

    // 4) 🔥 ล้าง storage ฝั่ง client ทั้งหมด (แก้ปัญหาบัญชีผี!)
    try {
      localStorage.clear(); // ล้างทุกอย่างเพื่อกันบัญชีผี
      sessionStorage.clear();
    } catch { }
  }
}
