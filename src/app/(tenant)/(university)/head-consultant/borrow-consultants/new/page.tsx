// src/app/(tenant)/(university)/head-consultant/borrow-consultants/new/page.tsx

"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { BorrowRequestForm } from "@/components/head-consultant/borrow-requests";
import { useNotification } from "@/components/notification/useNotification";
import type { CreateBorrowRequestInput } from "@/features/borrow-requests/types";

export default function Page() {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const notify = useNotification();

  const onSubmit = async (input: CreateBorrowRequestInput) => {
    setLoading(true);
    try {
      const res = await fetch("/api/v2/head-consultant/borrow-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(input),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "สร้างคำขอไม่สำเร็จ");

      // ✅ แจ้งสำเร็จ
      notify.success("สร้างคำขอยืมตัวที่ปรึกษาเรียบร้อยแล้ว");

      // ✅ ไปหน้า detail ของคำขอที่เพิ่งสร้าง
      const newId = data?.data?.borrow_request_id;
      if (newId) {
        router.push(pathname.replace(/\/new$/, `/${newId}`));
      } else {
        router.back();
      }
    } catch (e: any) {
      notify.error(e?.message ?? "สร้างคำขอไม่สำเร็จ");
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
