// components/layout/sidebar/types.ts
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean; // true = exact match, false = startsWith
  badge?: number;  // optional notification badge
}

export type SidebarTheme = "light" | "primary" | "dark";

export interface SidebarLogoConfig {
  icon?: LucideIcon;                 // (optional) เดิมใช้ icon
  title: string;
  subtitle?: string;
  href?: string;                     // default "/"
  variant?: "default" | "white";     // สำหรับพื้นหลังเข้ม/อ่อน
}

export interface SidebarConfig {
  logo: SidebarLogoConfig;
  items: NavItem[];
  theme?: SidebarTheme;
  backLink?: {
    href: string;
    label: string;
  };
}

export interface BaseSidebarProps {
  config: SidebarConfig;
  isOpen: boolean;
  isCollapsed: boolean;
  onCloseMobile: () => void;
  onToggleCollapse: () => void;
}
