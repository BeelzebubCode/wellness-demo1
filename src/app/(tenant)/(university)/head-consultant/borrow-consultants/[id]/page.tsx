"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui";
import { BorrowRequestDetailPanel } from "@/components/head-consultant/borrow-requests";
import { useBorrowRequest } from "@/features/borrow-requests/hooks/useBorrowRequest";

export default function BorrowRequestDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = useMemo(() => Number(params?.id), [params]);

  const { data, loading, submit, cancel, refetch, error } = useBorrowRequest(id);

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
    return (
      <div className="space-y-3">
        <Button variant="outline" onClick={() => router.back()}>
          กลับ
        </Button>
        <div className="text-sm text-slate-600">
          {error ? `โหลดไม่สำเร็จ: ${error}` : "ไม่พบข้อมูล"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Button size="sm" variant="outline" onClick={() => router.back()} className="shadow-sm bg-white hover:bg-gray-50">
          กลับ
        </Button>

        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => refetch?.()} className="shadow-sm bg-white hover:bg-gray-50">
            รีเฟรช
          </Button>
        </div>
      </div>

      <BorrowRequestDetailPanel
        data={data}
        loading={loading}
        onEdit={() => router.push(`/head-consultant/borrow-consultants/${id}/edit`)}
        onSubmit={async () => {
          await submit();
          await refetch?.();
        }}
        onCancel={async () => {
          await cancel?.();
          router.replace(`/head-consultant/borrow-consultants`);
        }}
      />
    </div>
  );
}
