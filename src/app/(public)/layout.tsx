// src/app/(public)/layout.tsx

'use client';

import { useRouter } from 'next/navigation';
import { PublicHeader, PublicFooter } from '@/components/layout';
import { logout } from '@/features/auth/logout';
import { useStudentAuth } from '@/features/auth/hooks/useStudentAuth';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user } = useStudentAuth(); // ✅ เปลี่ยนตรงนี้

  const handleLogout = async () => {
    if (!confirm('ต้องการออกจากระบบ?')) return;

    await logout();
    router.replace('/login');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader
        userName={user?.name}
        onLogin={() => router.push('/login')}
        onLogout={user ? handleLogout : undefined}
      />

      <main className="flex-1">{children}</main>

      <PublicFooter />
    </div>
  );
}
