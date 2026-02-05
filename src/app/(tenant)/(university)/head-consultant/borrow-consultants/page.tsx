"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui";
import { BorrowRequestListCard } from "@/components/head-consultant/borrow-requests";
import { useBorrowRequests } from "@/features/borrow-requests/hooks/useBorrowRequests";
import { borrowRequestsApi } from "@/features/borrow-requests/api";

export default function BorrowConsultantsPage() {
  const router = useRouter();
  const { rows, loading, refetch } = useBorrowRequests();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-lg font-semibold text-slate-800">คำขอยืมที่ปรึกษา</div>
          <div className="text-sm text-slate-500">สร้าง/ติดตามคำขอของหน่วยงานคุณ</div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch?.()}>
            รีเฟรช
          </Button>
          <Button onClick={() => router.push("/head-consultant/borrow-consultants/new")}>สร้างคำขอ</Button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center">
          <LoadingSpinner />
        </div>
      ) : null}

      <BorrowRequestListCard
        rows={rows || []}
        loading={loading}
        onView={(id) => router.push(`/head-consultant/borrow-consultants/${id}`)}
      />
    </div>
  );
}
