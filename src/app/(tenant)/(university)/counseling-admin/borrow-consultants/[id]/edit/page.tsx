"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/ui";
import { BorrowRequestForm } from "@/components/counseling-admin/borrow-requests";
import { useBorrowRequest } from "@/features/borrow-requests/hooks/useBorrowRequest";
import type { CreateBorrowRequestInput } from "@/features/borrow-requests/types";

export default function BorrowRequestEditPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = useMemo(() => Number(params?.id), [params]);

  const { data, loading, update, refetch, error } = useBorrowRequest(id);
  const [saving, setSaving] = useState(false);

  if (!Number.isFinite(id) || id <= 0) {
    return <div className="text-red-600">Borrow request id ไม่ถูกต้อง</div>;
  }

  if (loading) {
    return (
      <div className="py-16 flex justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!data) {
    return <div className="text-slate-600">{error ? `โหลดไม่สำเร็จ: ${error}` : "ไม่พบข้อมูล"}</div>;
  }

  // ✅ แก้ไขได้เฉพาะ DRAFT
  if (data.borrowRequestStatus !== "DRAFT") {
    return (
      <div className="text-slate-600">
        แก้ไขได้เฉพาะคำขอสถานะ “ร่าง” เท่านั้น
      </div>
    );
  }

  const onSubmit = async (input: CreateBorrowRequestInput) => {
    setSaving(true);
    try {
      await update({
        title: input.title,
        reason: input.reason,
        detail: input.detail ?? null,
        neededFrom: input.neededFrom ?? null,
        neededTo: input.neededTo ?? null,
        neededCount: input.neededCount ?? 1,
      });
      await refetch?.();
      router.replace(`/counseling-admin/borrow-consultants/${id}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <BorrowRequestForm
        loading={saving}
        onCancel={() => router.back()}
        initialValues={{
          title: data.borrowRequestTitle ?? "",
          reason: data.borrowRequestReason ?? "",
          detail: data.borrowRequestDetail ?? null,
          neededCount: data.borrowNeededCount ?? 1,
          neededFrom: data.borrowNeededFrom ?? null,
          neededTo: data.borrowNeededTo ?? null,
        }}
        onSubmit={onSubmit}
      />
    </div>
  );
}
