// src/app/(tenant)/(public)/layout.tsx
"use client";

import { useRouter, usePathname } from "next/navigation";
import { PublicHeader, PublicFooter } from "@/components/layout";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const showFooter = pathname === "/";

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader onLogin={() => router.push("/login")} />

      {/* ✅ ดันเนื้อหาลงเท่าความสูง header */}
      <main className="flex-1 pt-16">
        {children}
      </main>

      {showFooter && <PublicFooter />}
    </div>
  );
}
