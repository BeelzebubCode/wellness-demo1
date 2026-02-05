// components/layout/sidebar/RectorSidebar.tsx
"use client";

import { RECTOR_NAV } from "@/lib/constants/rector-nav";
import { BaseSidebar } from "./BaseSidebar";
import type { SidebarConfig } from "./types";

const RECTOR_CONFIG: SidebarConfig = {
  logo: {
    title: "NU Wellness",
    subtitle: "Rector Portal",
    href: "/rector",
  },
  items: RECTOR_NAV,
  theme: "light", // or dark, or Rector specific theme
};

interface RectorSidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onCloseMobile: () => void;
  onToggleCollapse: () => void;
}

export function RectorSidebar(props: RectorSidebarProps) {
  return <BaseSidebar config={RECTOR_CONFIG} {...props} />;
}
