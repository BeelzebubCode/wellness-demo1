// components/layout/sidebar/types.ts
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;   // true = exact match, false = startsWith
  badge?: number;    // optional notification badge
}

export interface SidebarConfig {
  logo: {
    icon: LucideIcon;
    title: string;
    subtitle?: string;
  };
  items: NavItem[];
  theme?: 'light' | 'primary' | 'dark';
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