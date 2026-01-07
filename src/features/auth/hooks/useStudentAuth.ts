// src/features/auth/hooks/useStudentAuth.ts
'use client';

import { useEffect, useState } from 'react';

export function useStudentAuth() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await fetch('/api/v1/auth/verify', {
          credentials: 'include',
        });

        if (!res.ok) throw new Error('unauthorized');

        const data = await res.json();
        setUser(data.account ?? data.user);
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    verify();
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
