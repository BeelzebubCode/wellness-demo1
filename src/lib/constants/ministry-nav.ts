// src/lib/constants/ministry-nav.ts
import { LayoutDashboard, Building2, Map, Users, FileText } from "lucide-react";
import type { NavItem } from "@/components/layout/sidebar/types";

export const MINISTRY_NAV: NavItem[] = [
  {
    href: "/ministry",
    label: "ภาพรวมระดับประเทศ",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/ministry/universities",
    label: "มหาวิทยาลัยทั้งหมด",
    icon: Building2,
  },
  {
    href: "/ministry/heat-map",
    label: "แผนที่ความเสี่ยง",
    icon: Map,
  },
  {
    href: "/ministry/students",
    label: "สถิตินิสิต",
    icon: Users,
  },
  {
    href: "/ministry/reports",
    label: "รายงานประจำปี",
    icon: FileText,
  },
];
