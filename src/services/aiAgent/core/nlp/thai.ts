// src/services/aiAgent/core/nlp/thai.ts
export function normalizeThaiLoose(input: string) {
  let s = String(input ?? "").trim();

  // normalize whitespace
  s = s.replace(/\s+/g, " ");

  // ลดอาการลากตัวอักษร: "ยกเลิกกกก" -> "ยกเลิก"
  s = s.replace(/([ก-๙a-zA-Z])\1{2,}/g, "$1$1");

  // normalize common keyboard typos ที่เจอบ่อย (ปรับเพิ่มได้)
  // NOTE: ไม่ควร aggressive เกินไป เดี๋ยวความหมายเพี้ยน
  const map: Array<[RegExp, string]> = [
    [/ยดเลิก/g, "ยกเลิก"],
    [/ยกเลก/g, "ยกเลิก"],
    [/ยกเลิกนัด/g, "ยกเลิก"],
  ];
  for (const [re, to] of map) s = s.replace(re, to);

  return s;
}

// Damerau–Levenshtein แบบสั้น ๆ (ใช้กับคำสั้น เช่น intent keywords)
function damerauLevenshtein(a: string, b: string) {
  const al = a.length, bl = b.length;
  if (!al) return bl;
  if (!bl) return al;

  const dp: number[][] = Array.from({ length: al + 1 }, () => Array(bl + 1).fill(0));
  for (let i = 0; i <= al; i++) dp[i][0] = i;
  for (let j = 0; j <= bl; j++) dp[0][j] = j;

  for (let i = 1; i <= al; i++) {
    for (let j = 1; j <= bl; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );

      // transposition
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + cost);
      }
    }
  }
  return dp[al][bl];
}

// fuzzy contains สำหรับ intent/keywords
export function fuzzyIncludes(text: string, keyword: string, maxDist = 1) {
  const t = String(text ?? "");
  const k = String(keyword ?? "");
  if (!t || !k) return false;

  if (t.includes(k)) return true;
  if (k.length <= 6) {
    // ลองเทียบกับ token รอบ ๆ แบบง่าย ๆ
    const tokens = t.split(/[\s,./!?()"']+/).filter(Boolean);
    for (const w of tokens) {
      if (Math.abs(w.length - k.length) > maxDist) continue;
      if (damerauLevenshtein(w, k) <= maxDist) return true;
    }
  }
  return false;
}

export function safeText(v: any, fallback: string) {
  const s = typeof v === "string" ? v : v == null ? "" : String(v);
  return s.trim().length ? s : fallback;
}

