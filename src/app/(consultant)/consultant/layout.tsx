// app/consultant/layout.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import useConsultantAuth from '@/features/auth/hooks/useConsultantAuth';
import { ConsultantSidebar } from '@/components/layout/sidebar';
import { ConsultantHeader } from '@/components/layout/header';
import { LoadingSpinner } from '@/components/ui';

export default function ConsultantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isAuthenticated } = useConsultantAuth();

  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Handlers
  const handleCloseMobile = useCallback(() => setIsSidebarOpen(false), []);
  const handleToggleCollapse = useCallback(() => setIsSidebarCollapsed((prev) => !prev), []);
  const handleOpenMobile = useCallback(() => setIsSidebarOpen(true), []);

  // Auth guard
  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      const next = pathname && pathname !== '/login' ? pathname : '/consultant/my-jobs';
      router.replace(`/login?next=${encodeURIComponent(next)}`);
      return;
    }

    if (user?.role !== 'CONSULTANT') {
      router.replace('/');
    }
  }, [isLoading, isAuthenticated, user, pathname, router]);

  // Loading state
  if (isLoading || !isAuthenticated || user?.role !== 'CONSULTANT') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="xl" label="กำลังตรวจสอบสิทธิ์..." />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <ConsultantSidebar
        isOpen={isSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        onCloseMobile={handleCloseMobile}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <ConsultantHeader
          user={{
            username: user.username,
            displayName: user.displayName,
            avatar: user.avatar,
          }}
          onMenuClick={handleOpenMobile}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}