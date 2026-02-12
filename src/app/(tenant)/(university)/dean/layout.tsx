"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AdminHeader } from "@/components/layout/header/AdminHeader";
import { DeanSidebar } from "@/components/layout/sidebar/DeanSidebar";
import { LoadingSpinner } from "@/components/ui";
import { useRoleAuth } from "@/features/auth/hooks/useRoleAuth";

export default function DeanLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLoginPage = pathname === "/login";

    const { isLoading, isAuthenticated, user } = useRoleAuth({
        redirectTo: "/login",
        allowedRoles: ["DEAN"] as const,
        loginToastKey: "toast_login_required_dean",
        guard: !isLoginPage,
        requireTenant: true,
    });

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    if (isLoginPage) return <>{children}</>;

    if (isLoading || !isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <LoadingSpinner size="xl" label="กำลังตรวจสอบสิทธิ์..." />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans">
            <DeanSidebar
                isOpen={isMobileMenuOpen}
                isCollapsed={isSidebarCollapsed}
                onCloseMobile={() => setIsMobileMenuOpen(false)}
                onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
            />

            <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
                <AdminHeader
                    adminName={(user as any)?.name || "Dean"}
                    adminRole="คณบดี"
                    onMenuClick={() => setIsMobileMenuOpen(true)}
                />

                <main className="flex-1 overflow-x-hidden overflow-y-auto pb-20 md:pb-6">
                    <div className="animate-fade-in">{children}</div>
                </main>
            </div>
        </div>
    );
}
