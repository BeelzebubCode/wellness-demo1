// path: src/components/filters/utils/date.ts
export function formatDateDMY(v: any) {
  const s = String(v ?? "").trim();
  if (!s) return "";

  const d = new Date(`${s}T00:00:00`);
  if (Number.isNaN(d.getTime())) return s;

  return new Intl.DateTimeFormat("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}
