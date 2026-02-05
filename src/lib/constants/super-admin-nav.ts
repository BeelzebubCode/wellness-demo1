// src/lib/constants/super-admin-nav.ts
import { BookOpen, Shield, Building2, Settings, Handshake, LayoutDashboard } from "lucide-react";
import type { NavItem } from "@/components/layout/sidebar/types";

export const SUPER_ADMIN_NAV: NavItem[] = [
  {
    href: "/super-admin",
    label: "Dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/super-admin/ai-kb",
    label: "AI Knowledge Base",
    icon: BookOpen,
  },
  {
    href: "/super-admin/borrow-requests",
    label: "คำขอยืมที่ปรึกษา",
    icon: Handshake,
  },
  {
    href: "/super-admin/universities",
    label: "มหาลัย",
    icon: Building2,
  },
  {
    href: "/super-admin/security",
    label: "ความปลอดภัย",
    icon: Shield,
  },
  {
    href: "/super-admin/settings",
    label: "ตั้งค่าระบบ",
    icon: Settings,
  },
];
