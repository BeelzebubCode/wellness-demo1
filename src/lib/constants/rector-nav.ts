// lib/constants/rector-nav.ts
import { LayoutDashboard, FileText, School } from "lucide-react";
import type { NavItem } from "@/components/layout/sidebar/types";

export const RECTOR_NAV: NavItem[] = [
  {
    href: "/rector",
    label: "Dashboard",
    icon: LayoutDashboard,
    exact: true,
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
