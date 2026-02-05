// lib/constants/rector-nav.ts
import { LayoutDashboard, FileText, School, UserCheck } from "lucide-react";
import type { NavItem } from "@/components/layout/sidebar/types";

export const RECTOR_NAV: NavItem[] = [
  {
    href: "/rector",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/rector/faculties",
    label: "ข้อมูลคณะ",
    icon: School,
  },
  {
    href: "/rector/reports",
    label: "รายงานสรุป",
    icon: FileText,
  },
];
