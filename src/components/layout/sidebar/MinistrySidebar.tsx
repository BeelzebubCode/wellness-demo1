// src/components/layout/sidebar/MinistrySidebar.tsx
"use client";

import { MINISTRY_NAV } from "@/lib/constants/ministry-nav";
import { BaseSidebar } from "./BaseSidebar";
import type { SidebarConfig } from "./types";

const MINISTRY_CONFIG: SidebarConfig = {
  logo: {
    title: "MHESI Wellness",
    subtitle: "กระทรวงระดับประเทศ",
    href: "/ministry",
  },
  items: MINISTRY_NAV,
  theme: "primary", // Using primary theme for official look
};

interface MinistrySidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onCloseMobile: () => void;
  onToggleCollapse: () => void;
}

export function MinistrySidebar(props: MinistrySidebarProps) {
  return <BaseSidebar config={MINISTRY_CONFIG} {...props} />;
}
