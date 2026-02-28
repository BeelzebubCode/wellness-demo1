import { Building2, Bot } from "lucide-react";
import type { NavItem } from "@/components/layout/sidebar/types";

export const HEAD_DEPARTMENT_NAV: NavItem[] = [
    {
        href: "/head-department",
        label: "Dashboard",
        icon: Building2,
        exact: true,
    },
    {
        href: "/head-department/ai-insight",
        label: "AI สรุปผล",
        icon: Bot,
    },
];
