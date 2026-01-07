'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useStudentAuth } from '@/features/auth/hooks/useStudentAuth';

export default function BookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useStudentAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, user, pathname, router]);

  if (isLoading || !user) return null;

  return <>{children}</>;
}
