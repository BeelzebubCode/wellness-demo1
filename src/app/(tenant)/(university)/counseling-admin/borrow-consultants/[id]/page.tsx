"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui";
import { BorrowRequestDetailPanel } from "@/components/counseling-admin/borrow-requests";
import { useBorrowRequest } from "@/features/borrow-requests/hooks/useBorrowRequest";

export default function BorrowRequestDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = useMemo(() => Number(params?.id), [params]);

  const { data, loading, submit, cancel, refetch } = useBorrowRequest(id);

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" onClick={() => router.back()}>
          กลับ
        </Button>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch?.()}>
            รีเฟรช
          </Button>
        </div>
      </div>

      <BorrowRequestDetailPanel
        data={data}
        onSubmit={async () => {
          await submit(); // POST /api/v2/borrow-requests/[id]/submit
          await refetch?.();
        }}
        onCancel={async () => {
          await cancel?.(); // (ถ้าคุณทำ PATCH cancel)
          router.replace("../borrow-consultants");
        }}
      />
    </div>
  );
}
