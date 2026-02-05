// lib/constants/head-consultant-nav.ts
import { CalendarDays, Clock, Database, BookCheck, UsersRound, LayoutDashboard } from "lucide-react";
import type { NavItem } from "@/components/layout/sidebar/types";

export const HEAD_CONSULTANT_NAV: NavItem[] = [
  {
    href: "/head-consultant",
    label: "Dashboard",
    icon: LayoutDashboard,
    exact: true,
  },

  {
    href: "/head-consultant/borrow-consultants",
    label: "ยืมที่ปรึกษา",
    icon: UsersRound,
  },
  {
    href: "/head-consultant/bookings",
    label: "มอบหมายงาน",
    icon: CalendarDays,
  },
  {
    href: "/head-consultant/schedule",
    label: "จัดการตารางเวลา",
    icon: Clock,
  },
];
