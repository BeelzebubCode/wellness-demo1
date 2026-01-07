// src/features/auth/logout.ts

export async function logout() {
  try {
    await fetch('/api/v1/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    // ไม่ต้อง throw logout ควรเงียบ
  }

  // clear client-side state
  localStorage.clear();
  sessionStorage.clear();
}
