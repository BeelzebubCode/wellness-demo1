// src/features/auth/hooks/useConsultantAuth.ts
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authApi } from '../api';
import type { AuthUser } from '../types';

type ConsultantUser = AuthUser & {
  role: 'CONSULTANT';
  consultantId: number; // consultant ต้องมีจริง
};

export default function useConsultantAuth(
  redirectTo = '/login'
) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<ConsultantUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const redirectLogin = () => {
      if (pathname === '/login') return;
      const next = pathname && pathname !== '/login' ? pathname : '/consultant/my-jobs';
      router.replace(`${redirectTo}?next=${encodeURIComponent(next)}`);
    };

    const verify = async () => {
      try {
        const data = await authApi.verifyConsultant();

        if (!isMounted) return;

        // ต้อง valid + มี account
        if (!data?.valid || !data?.account) {
          setUser(null);
          redirectLogin();
          return;
        }

        // ต้องเป็น CONSULTANT และมี consultantId
        const acc = data.account as AuthUser;
        if (acc.role !== 'CONSULTANT' || !acc.consultantId) {
          setUser(null);
          router.replace('/'); // หรือ redirectLogin() ตาม flow ที่อยากได้
          return;
        }

        setUser(acc as ConsultantUser);
      } catch {
        if (!isMounted) return;
        setUser(null);
        redirectLogin();
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    verify();
    return () => {
      isMounted = false;
    };
  }, [router, pathname, redirectTo]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
