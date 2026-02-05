// lib/constants/advisor-nav.ts
import { Users, Calendar, LayoutDashboard, MessageSquare } from "lucide-react";
import type { NavItem } from "@/components/layout/sidebar/types";

export const ADVISOR_NAV: NavItem[] = [
  {
    href: "/advisor",
    label: "หน้าแรก",
    icon: LayoutDashboard,
  },
  {
    href: "/advisor/my-students",
    label: "นิสิตในที่ปรึกษา",
    icon: Users,
  },
  {
    href: "/advisor/appointments",
    label: "นัดหมาย",
    icon: Calendar,
  },
];
