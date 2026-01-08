// components/layout/sidebar/BookingSidebar.tsx
"use client";

import { BOOKING_NAV } from "@/lib/constants/booking-nav";
import { BaseSidebar } from "./BaseSidebar";
import type { SidebarConfig } from "./types";

const BOOKING_CONFIG: SidebarConfig = {
  logo: {
    title: "NU Wellness",
    subtitle: "Student Portal",
    href: "/",
    // theme = primary → BaseSidebar จะ auto ใช้ variant="white" ให้อยู่แล้ว
    // ถ้าอยากบังคับก็ใส่: variant: "white",
  },
  items: BOOKING_NAV,
  theme: "primary",
  backLink: {
    href: "/",
    label: "กลับหน้าหลัก",
  },
};

interface BookingSidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onCloseMobile: () => void;
  onToggleCollapse: () => void;
}

export function BookingSidebar(props: BookingSidebarProps) {
  return <BaseSidebar config={BOOKING_CONFIG} {...props} />;
}
