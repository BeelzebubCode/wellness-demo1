// src/lib/constants/ministry-nav.ts
import { LayoutDashboard, Building2, Map, Users, FileText, Bot } from "lucide-react";
import type { NavItem } from "@/components/layout/sidebar/types";

export const MINISTRY_NAV: NavItem[] = [
  {
    href: "/ministry",
    label: "ภาพรวมระดับประเทศ",
    icon: Map,
    exact: true,
  },
  {
    href: "/ministry/dashboard",
    label: "แดชบอร์ดส่วนกลาง",
    icon: LayoutDashboard,
  },
  {
    href: "/ministry/universities",
    label: "มหาวิทยาลัย",
    icon: Building2,
  },
  // {
  //   href: "/ministry/students",
  //   label: "สถิตินิสิต",
  //   icon: Users,
  // },
  {
    href: "/ministry/ai-insight",
    label: "AI สรุปผล",
    icon: Bot,
  },
];
