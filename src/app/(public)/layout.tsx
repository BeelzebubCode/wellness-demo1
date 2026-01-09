// src/app/(public)/layout.tsx
"use client";

import { useRouter } from "next/navigation";
import { PublicHeader, PublicFooter } from "@/components/layout";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col">
      {/* header เป็น fixed แล้ว */}
      <PublicHeader onLogin={() => router.push("/login")} />

      {/* ✅ ดันเนื้อหาลงเท่าความสูง header (h-16 = 64px) */}
      <main className="flex-1 pt-50">
        {children}
      </main>

      <PublicFooter />
    </div>
  );
}
