// components/layout/sidebar/types.ts
export type SidebarTheme = "light" | "primary" | "dark";

export type SidebarLogoConfig = {
  title: string;
  subtitle?: string;
  href?: string; // default "/"
  variant?: "default" | "white"; // ส่งให้ BrandLogo
};

export interface SidebarItem {
  href: string;
  label: string;
  icon: any; // (ของเดิมใช้ LucideIcon) ถ้าไฟล์เดิมมี LucideIcon อยู่ก็ใช้เหมือนเดิมได้
  exact?: boolean;
  badge?: number;
}

export interface SidebarConfig {
  logo: SidebarLogoConfig;
  items: SidebarItem[];
  theme?: SidebarTheme;
  backLink?: { href: string; label: string };
}

export interface BaseSidebarProps {
  config: SidebarConfig;
  isOpen: boolean;
  isCollapsed: boolean;
  onCloseMobile: () => void;
  onToggleCollapse: () => void;
}
