// src/features/auth/logout.ts

const SUPPRESS_TOAST_KEY = "suppress_login_toast_once";

export async function logout() {
  // ✅ กัน toast login 1 ครั้ง (ต้อง set ก่อน clear)
  try {
    sessionStorage.setItem(SUPPRESS_TOAST_KEY, "1");
  } catch {
    // ignore
  }

  try {
    await fetch("/api/v1/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // ✅ logout ควรเงียบ ไม่ throw
  }

  // ✅ clear เฉพาะของที่เกี่ยวกับ auth (อย่าล้างหมดทั้งเว็บ)
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("auth_user");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin_user");
  } catch {
    // ignore
  }

  // ❌ ห้าม sessionStorage.clear() เพราะจะล้าง flag กัน toast + state อื่น ๆ
  // ถ้าต้องการลบ auth flags ให้ remove เฉพาะ key ที่เกี่ยวข้องแทน
  try {
    sessionStorage.removeItem("toast_login_required_student");
    sessionStorage.removeItem("toast_login_required_admin");
    sessionStorage.removeItem("toast_login_required_consultant");
    // ✅ SUPPRESS_TOAST_KEY ไม่ลบที่นี่ ให้ useStudentAuth เป็นคนลบ “หลังใช้ 1 ครั้ง”
  } catch {
    // ignore
  }
}
