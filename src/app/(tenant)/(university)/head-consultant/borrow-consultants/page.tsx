"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui";
import { BorrowRequestListCard } from "@/components/head-consultant/borrow-requests";
import { useBorrowRequests } from "@/features/borrow-requests/hooks/useBorrowRequests";
import { borrowRequestsApi } from "@/features/borrow-requests/api";
import { RefreshCw, PlusCircle, HandCoins } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";

export default function BorrowConsultantsPage() {
  const router = useRouter();
  const { rows, loading, refetch } = useBorrowRequests();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500 text-white shadow-sm ring-4 ring-primary-50">
            <HandCoins className="h-5 w-5" />
          </div>
          <div>
            <h5 className="text-2xl font-bold tracking-tight text-gray-900">คำขอยืมที่ปรึกษา</h5>
            <p className="text-sm text-gray-500">สร้าง/ติดตามคำขอของหน่วยงานคุณ</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch?.()}
            className="shadow-sm bg-white hover:bg-gray-50"
          >
            {loading ? <Spinner /> : <RefreshCw className="w-4 h-4 mr-1.5" />}
            รีเฟรช
          </Button>
          <Button
            size="sm"
            onClick={() => router.push("/head-consultant/borrow-consultants/new")}
            className="shadow-sm"
          >
            <PlusCircle className="w-4 h-4 mr-1.5" />
            สร้างคำขอ
          </Button>
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
