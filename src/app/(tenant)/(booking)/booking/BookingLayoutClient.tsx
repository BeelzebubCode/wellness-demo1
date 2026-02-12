"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { BookingSidebar } from "@/components/layout/sidebar";
import { BookingHeader } from "@/components/layout/header";

// ✅ Dynamic imports - load only when needed (reduces initial bundle by ~50kB)
const AiChatModal = dynamic(
    () => import("@/features/ai").then(mod => ({ default: mod.AiChatModal })),
    {
        ssr: false,
        loading: () => null // No loading state needed, renders when ready
    }
);

const FloatingAiButton = dynamic(
    () => import("@/features/ai").then(mod => ({ default: mod.FloatingAiButton })),
    {
        ssr: false,
        loading: () => null
    }
);

interface User {
    name?: string;
    username?: string;
    role?: string;
}

interface BookingLayoutClientProps {
    user: User | null;
    children: React.ReactNode;
}

/**
 * Client-side interactive layout wrapper
 * Only contains stateful sidebar/modal logic
 * Much smaller bundle than full layout
 */
export function BookingLayoutClient({
    user,
    children
}: BookingLayoutClientProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const handleCloseMobile = useCallback(() => setIsSidebarOpen(false), []);
    const handleToggleCollapse = useCallback(() => setIsSidebarCollapsed((prev) => !prev), []);
    const handleOpenMobile = useCallback(() => setIsSidebarOpen(true), []);

    const isAuthenticated = !!user;
    const userName = user?.name ?? user?.username ?? "บุคคลทั่วไป";
    const userRole = isAuthenticated ? "นักศึกษา" : "Guest";

    return (
        <>
            <div className="flex min-h-screen bg-slate-50">
                <BookingSidebar
                    isOpen={isSidebarOpen}
                    isCollapsed={isSidebarCollapsed}
                    onCloseMobile={handleCloseMobile}
                    onToggleCollapse={handleToggleCollapse}
                />

                <div className="flex-1 flex flex-col min-w-0">
                    <BookingHeader
                        userName={userName}
                        userRole={userRole}
                        onMenuClick={handleOpenMobile}
                    />
                    <main className="flex-1 overflow-auto">{children}</main>
                </div>
            </div>

            {/* Floating components */}
            <AiChatModal />
            <FloatingAiButton />
        </>
    );
}
