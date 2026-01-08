// src/features/auth/hooks/useStudentAuth.ts
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authApi } from '../api';
import type { AuthUser } from '../types';

type StudentUser = AuthUser & {
  role: 'STUDENT';
};

export function useStudentAuth(redirectTo = '/login') {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<StudentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const redirectLogin = () => {
      if (pathname === '/login') return;
      const next = pathname && pathname !== '/login' ? pathname : '/booking';
      router.replace(`${redirectTo}?next=${encodeURIComponent(next)}`);
    };

    const verify = async () => {
      try {
        // จะใช้ verify() กลางก็ได้ แต่ถ้าอยาก strict student ใช้ verifyStudent()
        const data = await authApi.verifyStudent();

        if (!isMounted) return;

        if (!data?.valid || !data?.account) {
          setUser(null);
          redirectLogin();
          return;
        }

        if (data.account.role !== 'STUDENT') {
          setUser(null);
          router.replace('/'); // กันคน role อื่นหลุดเข้าหน้า student
          return;
        }

        setUser(data.account as StudentUser);
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
