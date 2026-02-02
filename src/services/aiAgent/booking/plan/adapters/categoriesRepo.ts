// src/services/aiAgent/booking/plan/adapters/categoriesRepo.ts
import prisma from "@/lib/prisma";

export type ProblemCatRow = {
  problem_category_id: number;
  problem_category_code: string;
  problem_category_name_th: string;
};

export async function loadProblemCategories(): Promise<ProblemCatRow[]> {
  return prisma.problemCategory.findMany({
    orderBy: { problem_category_name_th: "asc" },
    select: {
      problem_category_id: true,
      problem_category_code: true,
      problem_category_name_th: true,
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

    if (b.includes(nameNorm)) score += 5;

    const tokens = nameNorm.split(/[^a-z0-9ก-๙]+/i);
    for (const tk of tokens) if (tk && b.includes(tk)) score += 1;

    if (!best || score > best.score) best = { cat: c, score };
  }

  if (!best || best.score <= 0) return null;
  return best.cat;
}
