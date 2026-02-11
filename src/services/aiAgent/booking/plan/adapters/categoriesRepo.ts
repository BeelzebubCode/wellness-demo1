// src/services/aiAgent/booking/plan/adapters/categoriesRepo.ts
import prisma from "@/lib/prisma";

export type ProblemCatRow = {
  problem_category_id: number;
  problem_category_code: string;
  problem_category_name_th: string;
  problem_category_description: string | null; // ✅ Added
};

export async function loadProblemCategories(): Promise<ProblemCatRow[]> {
  return prisma.problemCategory.findMany({
    orderBy: { problem_category_name_th: "asc" },
    select: {
      problem_category_id: true,
      problem_category_code: true,
      problem_category_name_th: true,
      problem_category_description: true, // ✅ Added
    },
    take: 200,
  });
}

export function categoriesJsonForPrompt(cats: ProblemCatRow[]) {
  return JSON.stringify(
    cats.map((c) => ({
      id: c.problem_category_id,
      code: c.problem_category_code,
      name: c.problem_category_name_th,
      desc: c.problem_category_description, // ✅ Added for AI context
    })),
    null,
    2,
  );
}

export function allowedCategoryCodes(cats: ProblemCatRow[]) {
  return new Set(cats.map((c) => String(c.problem_category_code)));
}

export function findCategoryByCode(cats: ProblemCatRow[], code: string | null | undefined) {
  if (!code) return null;
  const cc = String(code);
  return cats.find((c) => String(c.problem_category_code) === cc) ?? null;
}

export function mapCategoriesForUi(cats: ProblemCatRow[]) {
  return cats.map((c) => ({
    id: c.problem_category_id,
    code: c.problem_category_code,
    name: c.problem_category_name_th,
  }));
}

export function categoryOptions(cats: ProblemCatRow[]) {
  return cats.map((c) => ({
    value: c.problem_category_id,
    code: c.problem_category_code,
    label: c.problem_category_name_th,
  }));
}

// --- heuristics (เดิมของคุณ) ---
function norm(s: string) {
  return String(s || "").toLowerCase().replace(/\s+/g, "").trim();
}

export function detectCategoryFromText(cats: ProblemCatRow[], text: string): ProblemCatRow | null {
  const t = String(text || "").trim();
  if (!t) return null;

  let best: ProblemCatRow | null = null;
  for (const c of cats) {
    if (t.includes(c.problem_category_name_th)) {
      if (!best || c.problem_category_name_th.length > best.problem_category_name_th.length) {
        best = c;
      }
    }
  }
  return best;
}

export function guessCategoryFromBrief(cats: ProblemCatRow[], brief: string): ProblemCatRow | null {
  const b = norm(brief);
  if (!b) return null;

  let best: { cat: ProblemCatRow; score: number } | null = null;

  for (const c of cats) {
    const nameNorm = norm(c.problem_category_name_th);
    let score = 0;

    // 1. Name exact/partial match
    if (b.includes(nameNorm)) score += 10;
    
    // 2. Name tokens
    const nameTokens = nameNorm.split(/[^a-z0-9ก-๙]+/i).filter((t) => t.length > 2);
    for (const tk of nameTokens) {
      if (b.includes(tk)) score += 3;
      
      // ✅ Special Text Matching: Strip "ความ", "การ" prefix
      // e.g. "ความเครียด" -> "เครียด". If user says "เครียด", match it!
      const stripped = tk.replace(/^(ความ|การ)/, "");
      if (stripped.length > 2 && stripped !== tk && b.includes(stripped)) {
        score += 5; // High confidence for core word match
      }
    }

    // 3. Description tokens (✅ New)
    if (c.problem_category_description) {
      const descNorm = norm(c.problem_category_description);
      const descTokens = descNorm.split(/[^a-z0-9ก-๙]+/i).filter((t) => t.length > 2);
      
      for (const tk of descTokens) {
        if (["เช่น", "การ", "ความ", "และ", "หรือ", "จาก", "ของ"].includes(tk)) continue;
        if (b.includes(tk)) score += 2;
      }
    }

    if (score > 0) {
      if (!best || score > best.score) best = { cat: c, score };
    }
  }

  if (!best || best.score <= 0) return null;
  return best.cat;
}
