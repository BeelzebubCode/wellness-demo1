// lib/constants/booking-nav.ts
import { CalendarPlus, CalendarCheck, History, User, Bot } from "lucide-react";
import type { NavItem } from "@/components/layout/sidebar/types";

export const BOOKING_NAV: NavItem[] = [
  {
    href: "/booking",
    label: "จองคิว",
    icon: CalendarPlus,
    exact: true,
  },
  {
    href: "/booking/my-appointments",
    label: "ตารางนัดของฉัน",
    icon: CalendarCheck,
  },
  {
    href: "/booking/history",
    label: "ประวัติการจอง",
    icon: History,
  },
  {
    href: "/help/ai",
    label: "AI ผู้ช่วย",
    icon: Bot,
  },
  {
    href: "/booking/profile",
    label: "โปรไฟล์",
    icon: User,
  },
];
