// ==========================================
// 📌 Public Layout (Route Group)
// ==========================================

'use client';

import { PublicHeader, PublicFooter } from '@/components/layout';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
