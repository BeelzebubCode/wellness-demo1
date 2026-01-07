// src/app/(public)/layout.tsx
'use client';

import { useRouter } from 'next/navigation';
import { PublicHeader, PublicFooter } from '@/components/layout';
import { useStudentAuth } from '@/features/auth/hooks/useStudentAuth';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user } = useStudentAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader
        userName={user?.displayName || user?.username}
        onLogin={() => router.push('/login')}
      />

      <main className="flex-1">{children}</main>

      <PublicFooter />
    </div>
  );
}