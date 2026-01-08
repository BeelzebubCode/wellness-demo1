// src/app/(auth)/layout.tsx
"use client";

import { useRouter } from "next/navigation";
import { PublicHeader, PublicFooter } from "@/components/layout";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader onLogin={() => router.push("/login")} />

      <main className="flex-1">{children}</main>

      <PublicFooter />
    </div>
  );
}
