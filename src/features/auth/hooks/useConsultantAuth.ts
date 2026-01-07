// src/features/auth/hooks/useConsultantAuth.ts
'use client';

import { useEffect, useState } from 'react';

export type ConsultantUser = {
  id: number;
  username: string;
  role: 'CONSULTANT';
  consultantId: number | null;
};

export default function useConsultantAuth() {
  const [user, setUser] = useState<ConsultantUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await fetch('/api/v1/auth/verify-consultant', {
          credentials: 'include',
        });

        if (!res.ok) throw new Error('unauthorized');

        const data = await res.json();
        setUser(data.account);
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
