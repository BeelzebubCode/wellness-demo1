// src/lib/problem-category.config.ts
import type { LucideIcon } from "lucide-react";
import {
  Brain,
  Heart,
  BookOpen,
  BriefcaseBusiness,
  Users,
  SmilePlus,
  CigaretteOff,
  Sparkles,
  Home,
  ShieldAlert,
  Scale,
  Stethoscope,
} from "lucide-react";

// ✅ ให้ตรงกับ prisma/seed-data/categories.ts
export type ProblemCategoryCode =
  | "ACAD"
  | "STRESS"
  | "REL"
  | "ADJ"
  | "FIN"
  | "MENTAL"
  | "SUBST"
  | "FAM"
  | "HEALTH"
  | "CAREER"
  | "BULLY"
  | "SEX"
  | "LEGAL"
  | "OTHER";

export type ProblemCategoryUi = {
  icon: LucideIcon;
  color: string; // tailwind class
};

// ✅ fallback กัน code ใหม่จาก DB ในอนาคต
export const PROBLEM_CATEGORY_DEFAULT: ProblemCategoryUi = {
  icon: Sparkles,
  color: "text-gray-500",
};

export const PROBLEM_CATEGORY_CONFIG = {
  ACAD: { icon: BookOpen, color: "text-emerald-600" },
  STRESS: { icon: Brain, color: "text-primary-500" },
  REL: { icon: Heart, color: "text-rose-500" },
  ADJ: { icon: Users, color: "text-purple-500" },
  FIN: { icon: BriefcaseBusiness, color: "text-green-600" },
  MENTAL: { icon: SmilePlus, color: "text-sky-500" },
  SUBST: { icon: CigaretteOff, color: "text-orange-600" },
  FAM: { icon: Home, color: "text-amber-600" },
  HEALTH: { icon: Stethoscope, color: "text-teal-600" },
  CAREER: { icon: BriefcaseBusiness, color: "text-yellow-600" },
  BULLY: { icon: ShieldAlert, color: "text-red-600" },
  SEX: { icon: Sparkles, color: "text-fuchsia-600" },
  LEGAL: { icon: Scale, color: "text-slate-600" },
  OTHER: { icon: Home, color: "text-gray-500" },
} satisfies Record<ProblemCategoryCode, ProblemCategoryUi>;

/** ✅ ใช้ตัวนี้ใน UI ทุกที่: กัน undefined/เคส code แปลก */
export function getProblemCategoryUi(code: unknown): ProblemCategoryUi {
  const k = String(code ?? "").trim().toUpperCase() as ProblemCategoryCode;
  return (PROBLEM_CATEGORY_CONFIG as any)[k] ?? PROBLEM_CATEGORY_DEFAULT;
}
