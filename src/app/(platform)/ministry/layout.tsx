// src/app/(platform)/ministry/layout.tsx
"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AdminHeader } from "@/components/layout";
import { MinistrySidebar } from "@/components/layout/sidebar/MinistrySidebar";
import { LoadingSpinner } from "@/components/ui";
import { useRoleAuth } from "@/features/auth/hooks/useRoleAuth";

export default function MinistryLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  const { isLoading, isAuthenticated, user } = useRoleAuth({
    redirectTo: "/login",
    allowedRoles: ["MINISTRY"], // Only Ministry role allowed
    loginToastKey: "toast_login_required_ministry",
    guard: !isLoginPage,
    requireTenant: false,
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // ✅ Check if we are on the main dashboard (3D Map) OR University Detail (Immersive)
  const is3DDashboard = pathname === "/ministry";
  const isUniversityDetail = pathname.startsWith("/ministry/universities/");
  
  // Immersive Pages disable default container/padding
  const isImmersive = is3DDashboard || isUniversityDetail; 

  if (isLoginPage) return <>{children}</>;

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="xl" label="Checking ministry access..." />
      </div>
    );
  }

  // ✅ Immersive Layout (No default padding/constraints)
  if (isImmersive) {
     if (is3DDashboard) return <>{children}</>; // 3D Map often handles its own layout entirely
     
     // University Detail uses Sidebar/Header but needs full width content area
     return (
        <div className="min-h-screen bg-gray-50 flex font-sans">
          <MinistrySidebar
            isOpen={isMobileMenuOpen}
            isCollapsed={isSidebarCollapsed}
            onCloseMobile={() => setIsMobileMenuOpen(false)}
            onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          />
    
          <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
            <AdminHeader
              adminName={(user as any)?.name || "ท่านรัฐมนตรี"}
              adminRole="Ministry of Higher Education"
              onMenuClick={() => setIsMobileMenuOpen(true)}
            />
    
            <main className="flex-1 overflow-x-hidden overflow-y-auto p-0"> 
               {/* 🚀 No Padding, No Max-Width for Immersive Detail Page */}
               {children}
            </main>
          </div>
        </div>
     );
  }

  // Standard Layout for other pages (Tables, Settings, etc.)
  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      <MinistrySidebar
        isOpen={isMobileMenuOpen}
        isCollapsed={isSidebarCollapsed}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <AdminHeader
          adminName={(user as any)?.name || "ท่านรัฐมนตรี"}
          adminRole="Ministry of Higher Education"
          onMenuClick={() => setIsMobileMenuOpen(true)}
        />

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          <div className="max-w-7xl mx-auto animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}
