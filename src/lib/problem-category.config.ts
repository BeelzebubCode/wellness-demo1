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
} from 'lucide-react';

export const PROBLEM_CATEGORY_CONFIG = {
  ACADEMIC: {
    icon: BookOpen,
    color: 'text-emerald-500',
  },
  STRESS: {
    icon: Brain,
    color: 'text-primary-500',
  },
  RELATIONSHIP: {
    icon: Heart,
    color: 'text-rose-500',
  },
  CAREER: {
    icon: BriefcaseBusiness,
    color: 'text-amber-600',
  },
  MENTAL_HEALTH: {
    icon: SmilePlus,
    color: 'text-sky-500',
  },
  ADJ: {
    icon: Users,
    color: 'text-purple-500',
  },
  FIN: {
    icon: BriefcaseBusiness,
    color: 'text-green-600',
  },
  OTHER: {
    icon: Home,
    color: 'text-gray-500',
  },
} as const;

export type ProblemCategoryCode = keyof typeof PROBLEM_CATEGORY_CONFIG;
