import type { ProfileInclude, ProfileMeDTO } from "./types";

function buildIncludeQuery(include?: ProfileInclude) {
  if (!include) return "";
  const keys = Object.entries(include)
    .filter(([, v]) => Boolean(v))
    .map(([k]) => k);

  return keys.length ? `?include=${encodeURIComponent(keys.join(","))}` : "";
}

export async function fetchMyProfile(include?: ProfileInclude): Promise<ProfileMeDTO> {
  const qs = buildIncludeQuery(include);

  const res = await fetch(`/api/v2/me/profile${qs}`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    headers: { "Cache-Control": "no-cache" },
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error ?? "โหลดโปรไฟล์ไม่สำเร็จ");
  if (!json?.data) throw new Error("รูปแบบข้อมูลไม่ถูกต้อง (data หาย)");
  return json.data as ProfileMeDTO;
}
