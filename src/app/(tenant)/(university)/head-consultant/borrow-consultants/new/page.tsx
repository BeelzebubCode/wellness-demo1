// src/app/(tenant)/(university)/head-consultant/borrow-consultants/new/page.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BorrowRequestForm } from "@/components/head-consultant/borrow-requests";
import type { CreateBorrowRequestInput } from "@/features/borrow-requests/types";

export default function Page() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (input: CreateBorrowRequestInput) => {
    setLoading(true);
    try {
      const res = await fetch("/api/v2/borrow-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(input),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "สร้างคำขอไม่สำเร็จ");

      // ✅ กลับ list แบบปลอดภัย
      router.push("..");
    } catch (e: any) {
      alert(e?.message ?? "สร้างคำขอไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <BorrowRequestForm loading={loading} onCancel={() => router.back()} onSubmit={onSubmit} />
    </div>
  );
}
