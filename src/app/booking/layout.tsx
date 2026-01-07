// app/booking/layout.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useStudentAuth } from '@/features/auth/hooks/useStudentAuth';
import { BookingSidebar } from '@/components/layout/sidebar';
import { BookingHeader } from '@/components/layout/header';
import { LoadingSpinner } from '@/components/ui';

export default function BookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useStudentAuth();
  const router = useRouter();
  const pathname = usePathname();

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
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, user, pathname, router]);

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner label="กำลังตรวจสอบสิทธิ์..." />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <BookingSidebar
        isOpen={isSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        onCloseMobile={handleCloseMobile}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* ✅ แก้ตรงนี้ - ใช้ props แบบใหม่ */}
        <BookingHeader
          userName={user.displayName || user.username}
          userRole="นักศึกษา"
          onMenuClick={handleOpenMobile}
        />

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
