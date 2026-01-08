// components/layout/sidebar/ConsultantSidebar.tsx
"use client";

import { CONSULTANT_NAV } from "@/lib/constants/consultant-nav";
import { BaseSidebar } from "./BaseSidebar";
import type { SidebarConfig } from "./types";

const CONSULTANT_CONFIG: SidebarConfig = {
  logo: {
    title: "NU Wellness",
    subtitle: "Consultant Portal",
    href: "/consultant",
    // theme = dark → BaseSidebar auto ใช้ variant="white"
  },
  items: CONSULTANT_NAV,
  theme: "dark",
  backLink: {
    href: "/",
    label: "กลับหน้าหลัก",
  },
};

interface ConsultantSidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onCloseMobile: () => void;
  onToggleCollapse: () => void;
}

export function ConsultantSidebar(props: ConsultantSidebarProps) {
  return <BaseSidebar config={CONSULTANT_CONFIG} {...props} />;
}
