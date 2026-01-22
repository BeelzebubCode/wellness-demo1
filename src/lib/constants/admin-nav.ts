// lib/constants/admin-nav.ts
import { CalendarDays, Clock, Database, BookCheck } from "lucide-react";
import type { NavItem } from "@/components/layout/sidebar/types";

export const ADMIN_NAV: NavItem[] = [
  {
    href: "/counseling-admin/data-center",
    label: "ศูนย์ข้อมูล",
    icon: Database,
  },
  {
    href: "/counseling-admin/bookings",
    label: "มอบหมายงาน",
    icon: CalendarDays,
  },
  {
    href: "/counseling-admin/schedule",
    label: "จัดการตารางเวลา",
    icon: Clock,
  },
  {
    href: "/counseling-admin/my-jobs",
    label: "งานของฉัน",
    icon: BookCheck,
  },
];
