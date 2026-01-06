// src/features/auth/hooks/useAdminAuth.ts
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '../api';
import type { AuthUser } from '../types';

interface UseAdminAuthReturn {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAdminAuth(
  redirectTo = '/admin/login'
): UseAdminAuthReturn {
  
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const response = await authApi.verify(); // 👈 เช็คจาก cookie

        if (!isMounted) return;

        if (response.valid && response.account) {
          setUser(response.account);
          setIsAuthenticated(true);
        } else {
          router.replace(redirectTo);
        }
      } catch (error) {
        if (isMounted) router.replace(redirectTo);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    checkAuth();
    return () => { isMounted = false; };
  }, [router, redirectTo]);

  return { user, isLoading, isAuthenticated };
}


export default useAdminAuth;