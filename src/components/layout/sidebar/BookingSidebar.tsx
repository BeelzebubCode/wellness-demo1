// components/layout/sidebar/BookingSidebar.tsx
"use client";

import { useMemo } from "react";
import { BOOKING_NAV } from "@/lib/constants/booking-nav";
import { BaseSidebar } from "./BaseSidebar";
import type { SidebarConfig } from "./types";
import { useTheme } from "@/contexts/ThemeContext";
import { TENANTS } from "@/config/tenants";

interface BookingSidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onCloseMobile: () => void;
  onToggleCollapse: () => void;
}

export function BookingSidebar(props: BookingSidebarProps) {
  const { tenant } = useTheme();

  const config: SidebarConfig = useMemo(() => {
    const t = TENANTS[tenant] ?? TENANTS.DEFAULT;

    return {
      logo: {
        title: t.code === "DEFAULT" ? "Wellness" : `${t.code} Wellness`,
        subtitle: "Student Portal",
        href: "/",
        // ถ้ามีโลโก้: ใส่เพิ่มตาม types ที่เธอใช้ (เช่น src)
        // src: t.logo,
      },
      items: BOOKING_NAV,
      theme: "primary",
      backLink: {
        href: "/",
        label: "กลับหน้าหลัก",
      },
    };
  }, [tenant]);

  return <BaseSidebar config={config} {...props} />;
}
