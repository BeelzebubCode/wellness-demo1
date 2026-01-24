// src/components/layout/sidebar/SuperAdminSidebar.tsx
"use client";

import { SUPER_ADMIN_NAV } from "@/lib/constants/super-admin-nav";
import { BaseSidebar } from "./BaseSidebar";
import type { SidebarConfig } from "./types";

const SUPER_ADMIN_CONFIG: SidebarConfig = {
  logo: {
    title: "Wellness System",
    subtitle: "Super Admin",
    href: "/super-admin",
  },
  items: SUPER_ADMIN_NAV,
  theme: "light",
};

interface SuperAdminSidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onCloseMobile: () => void;
  onToggleCollapse: () => void;
}

export function SuperAdminSidebar(props: SuperAdminSidebarProps) {
  return <BaseSidebar config={SUPER_ADMIN_CONFIG} {...props} />;
}
