// src/services/aiAgent/bookingPlan/categories.ts
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
  // ส่งเป็น JSON list ให้ LLM เลือก code ได้แม่นกว่า text bullet
  return JSON.stringify(
    cats.map((c) => ({
      id: c.problem_category_id,
      code: c.problem_category_code,
      name: c.problem_category_name_th,
    })),
    null,
    2
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
