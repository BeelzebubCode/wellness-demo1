"use client";

import { DEAN_NAV } from "@/lib/constants/dean-nav";
import { BaseSidebar } from "./BaseSidebar";
import type { SidebarConfig } from "./types";

const DEAN_CONFIG: SidebarConfig = {
    logo: {
        title: "NU Wellness",
        subtitle: "Dean Portal",
        href: "/dean",
    },
    items: DEAN_NAV,
    theme: "light",
};

interface DeanSidebarProps {
    isOpen: boolean;
    isCollapsed: boolean;
    onCloseMobile: () => void;
    onToggleCollapse: () => void;
}

export function DeanSidebar(props: DeanSidebarProps) {
    return <BaseSidebar config={DEAN_CONFIG} {...props} />;
}
