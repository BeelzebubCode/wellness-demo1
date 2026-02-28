"use client";

import { HEAD_DEPARTMENT_NAV } from "@/lib/constants/head-department-nav";
import { BaseSidebar } from "./BaseSidebar";
import type { SidebarConfig } from "./types";

const HD_CONFIG: SidebarConfig = {
    logo: {
        title: "NU Wellness",
        subtitle: "Head Dept. Portal",
        href: "/head-department",
    },
    items: HEAD_DEPARTMENT_NAV,
    theme: "light",
};

interface HeadDepartmentSidebarProps {
    isOpen: boolean;
    isCollapsed: boolean;
    onCloseMobile: () => void;
    onToggleCollapse: () => void;
}

export function HeadDepartmentSidebar(props: HeadDepartmentSidebarProps) {
    return <BaseSidebar config={HD_CONFIG} {...props} />;
}
