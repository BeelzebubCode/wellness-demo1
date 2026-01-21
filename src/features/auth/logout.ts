// src/features/auth/logout.ts
const SUPPRESS_TOAST_KEY = "suppress_login_toast_once";

export async function logout() {
  try {
    sessionStorage.setItem(SUPPRESS_TOAST_KEY, "1");
  } catch {}

  // ✅ ยิง logout ให้ server ลบ cookie
  try {
    await fetch("/api/v2/auth/logout", {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch {}

  // ✅ ล้าง storage ฝั่ง client
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
