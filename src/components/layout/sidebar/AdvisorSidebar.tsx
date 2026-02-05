// components/layout/sidebar/AdvisorSidebar.tsx
"use client";

import { ADVISOR_NAV } from "@/lib/constants/advisor-nav";
import { BaseSidebar } from "./BaseSidebar";
import type { SidebarConfig } from "./types";

const ADVISOR_CONFIG: SidebarConfig = {
  logo: {
    title: "NU Wellness",
    subtitle: "Advisor Portal",
    href: "/advisor",
  },
  items: ADVISOR_NAV,
  theme: "light", // Assuming white variant for Advisor
};

interface AdvisorSidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onCloseMobile: () => void;
  onToggleCollapse: () => void;
}

export function AdvisorSidebar(props: AdvisorSidebarProps) {
  return <BaseSidebar config={ADVISOR_CONFIG} {...props} />;
}
