'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import useConsultantAuth from '@/features/auth/hooks/useConsultantAuth';
import { LoadingSpinner } from '@/components/ui';

export default function ConsultantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const { user, isLoading, isAuthenticated } = useConsultantAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      const next =
        pathname && pathname !== '/login'
          ? pathname
          : '/consultant/my-jobs';

      router.replace(`/login?next=${encodeURIComponent(next)}`);
      return;
    }

    if (user?.role !== 'CONSULTANT') {
      router.replace('/'); // หรือ /403
    }
  }, [isLoading, isAuthenticated, user, pathname, router]);

  // ⛔ block render จนกว่า auth จะพร้อม
  if (isLoading || !isAuthenticated || user?.role !== 'CONSULTANT') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="xl" label="กำลังตรวจสอบสิทธิ์..." />
      </div>
    );
  }

  return <>{children}</>;
}
