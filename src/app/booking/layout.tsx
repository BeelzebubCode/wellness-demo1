// app/booking/layout.tsx
'use client';

import { useState, useCallback } from 'react';
import { useStudentAuth } from '@/features/auth/hooks/useStudentAuth';
import { BookingSidebar } from '@/components/layout/sidebar';
import { BookingHeader } from '@/components/layout/header';
import { LoadingSpinner } from '@/components/ui';

export default function BookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ✅ hook จะ redirect เองถ้าไม่ผ่าน
  const { user, isLoading, isAuthenticated } = useStudentAuth('/login');

  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Handlers
  const handleCloseMobile = useCallback(() => setIsSidebarOpen(false), []);
  const handleToggleCollapse = useCallback(
    () => setIsSidebarCollapsed((prev) => !prev),
    []
  );
  const handleOpenMobile = useCallback(() => setIsSidebarOpen(true), []);

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner label="กำลังตรวจสอบสิทธิ์..." />
      </div>
    );
  }

  // ✅ ถ้าไม่ auth: hook จะพาไป /login แล้ว ดังนั้น render null ได้เลย
  if (!isAuthenticated || !user) return null;

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
        <BookingHeader
          // ✅ กัน field ไม่มี
          userName={(user as any).displayName ?? user.username}
          userRole="นักศึกษา"
          onMenuClick={handleOpenMobile}
        />

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
