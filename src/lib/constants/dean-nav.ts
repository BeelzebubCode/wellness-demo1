import { School } from "lucide-react";
import type { NavItem } from "@/components/layout/sidebar/types";

export const DEAN_NAV: NavItem[] = [
    {
        href: "/dean",
        label: "Dashboard",
        icon: School,
        exact: true,
    },
    {
        href: "/dean/subject-group",
        label: "Subject Group",
        icon: School,
    },
    {
        href: "/dean/filter",
        label: "Filter",
        icon: School,
    },
];
