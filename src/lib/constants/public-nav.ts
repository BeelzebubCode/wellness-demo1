// src/lib/constants/public-nav.ts
import { Home, Info, Bot, CalendarPlus, BookOpen } from "lucide-react";
import type { NavItem } from "@/components/layout/sidebar/types";

export const PUBLIC_NAV: NavItem[] = [
  {
    href: "/",
    label: "หน้าแรก",
    icon: Home,
    exact: true,
  },
  {
    href: "/booking",
    label: "จองคิว",
    icon: CalendarPlus,
    exact: true,
  },
  {
    href: "/docs",
    label: "เอกสาร",
    icon: BookOpen,
  },
  {
    href: "/about",
    label: "เกี่ยวกับ",
    icon: Info,
  },
  {
    href: "/help/ai",
    label: "AI ผู้ช่วย",
    icon: Bot,
  },
];
