// lib/constants/head-consultant-nav.ts
import { CalendarDays, Clock, Database, BookCheck, UsersRound, LayoutDashboard, History } from "lucide-react";
import type { NavItem } from "@/components/layout/sidebar/types";

export const HEAD_CONSULTANT_NAV: NavItem[] = [
  {
    href: "/head-consultant",
    label: "Dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/head-consultant/bookings",
    label: "มอบหมายงาน",
    icon: CalendarDays,
  },
  {
    href: "/head-consultant/assignment-history",
    label: "ประวัติการแจกงาน",
    icon: History,
  },
  {
    href: "/head-consultant/borrow-consultants",
    label: "ยืมตัวนักจิตบำบัด",
    icon: UsersRound,
  },
  {
    href: "/head-consultant/schedule",
    label: "จัดการตารางเวลา",
    icon: Clock,
  },
  {
    href: "/head-consultant/exception-requests",
    label: "ขอยกเว้นโทษ (นศ)",
    icon: BookCheck,
  },
];
