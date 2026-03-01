// components/layout/sidebar/AdminSidebar.tsx
"use client";

import { useMemo } from "react";
import { HEAD_CONSULTANT_NAV } from "@/lib/constants/head-consultant-nav";
import { BaseSidebar } from "./BaseSidebar";
import type { SidebarConfig } from "./types";
import { usePendingAssignmentsCount } from "@/features/head-consultant/bookings/hook/usePendingAssignmentsCount";

const ADMIN_CONFIG_BASE: SidebarConfig = {
  logo: {
    title: "NU Wellness",
    subtitle: "Admin Panel",
    href: "/admin",
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
  const { data: pendingCount } = usePendingAssignmentsCount();

  const config = useMemo<SidebarConfig>(() => {
    return {
      ...ADMIN_CONFIG_BASE,
      items: ADMIN_CONFIG_BASE.items.map(item => {
        if (item.href === "/head-consultant/bookings") {
          return { ...item, badge: pendingCount };
        }
        return item;
      })
    };
  }, [pendingCount]);

  return <BaseSidebar config={config} {...props} />;
}
