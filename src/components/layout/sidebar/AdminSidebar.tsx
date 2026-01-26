// components/layout/sidebar/AdminSidebar.tsx
"use client";

import { HEAD_CONSULTANT_NAV } from "@/lib/constants/head-consultant-nav";
import { BaseSidebar } from "./BaseSidebar";
import type { SidebarConfig } from "./types";

const ADMIN_CONFIG: SidebarConfig = {
  logo: {
    title: "NU Wellness",
    subtitle: "Admin Panel",
    href: "/admin",
    // variant ไม่ใส่ก็ได้ เดี๋ยว BaseSidebar auto ให้ตามธีม
  },
  items: HEAD_CONSULTANT_NAV,
  theme: "light",
};

interface AdminSidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onCloseMobile: () => void;
  onToggleCollapse: () => void;
}

export function AdminSidebar(props: AdminSidebarProps) {
  return <BaseSidebar config={ADMIN_CONFIG} {...props} />;
}
