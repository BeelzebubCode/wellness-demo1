// src/lib/constants/super-admin-nav.ts
import { BookOpen, Building2, Handshake, LayoutDashboard, FileText, MessageSquareWarning, Settings2, ClipboardList } from "lucide-react";
import type { NavItem } from "@/components/layout/sidebar/types";

export const SUPER_ADMIN_NAV: NavItem[] = [
  {
    href: "/super-admin",
    label: "Dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/super-admin/borrow-requests",
    label: "คำขอยืมที่ปรึกษา",
    icon: Handshake,
  },
  // {
  //   href: "/super-admin/universities",
  //   label: "มหาลัย",
  //   icon: Building2,
  // },
  {
    href: "/super-admin/docs",
    label: "จัดการหน้าเอกสาร",
    icon: FileText,
  },
  {
    href: "/super-admin/ai-kb",
    label: "AI Knowledge Base",
    icon: BookOpen,
  },
  {
    href: "/super-admin/ai-feedback",
    label: "AI Feedback",
    icon: MessageSquareWarning,
  },
  {
    href: "/super-admin/channels",
    label: "จัดการช่องทางออนไลน์",
    icon: Settings2,
  },
  {
    href: "/super-admin/problem-categories",
    label: "จัดการประเภทปัญหา",
    icon: ClipboardList,
  },
];
