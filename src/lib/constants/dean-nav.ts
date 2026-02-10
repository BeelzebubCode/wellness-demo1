
import { LayoutDashboard, School } from "lucide-react";
import type { NavItem } from "@/components/layout/sidebar/types";

export const DEAN_NAV: NavItem[] = [
    {
        href: "/dean",
        label: "Dashboard",
        icon: LayoutDashboard,
        exact: true,
    },
    {
        href: "/dean/faculties",
        label: "ข้อมูลคณะ",
        icon: School,
    },
];
