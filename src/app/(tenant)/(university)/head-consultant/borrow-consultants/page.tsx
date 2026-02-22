"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui";
import { FilterBar } from "@/components/filters/FilterBar";
import type { FilterDef } from "@/components/filters/types";
import { BorrowRequestListCard } from "@/components/head-consultant/borrow-requests";
import { useBorrowRequests } from "@/features/borrow-requests/hooks/useBorrowRequests";
import { borrowRequestsApi } from "@/features/borrow-requests/api";
import { RefreshCw, PlusCircle, HandCoins } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";

export default function BorrowConsultantsPage() {
  const router = useRouter();
  const { rows, loading, refetch } = useBorrowRequests();

  const [filters, setFilters] = useState({ q: "", status: "ALL" });

  const filterDefs: FilterDef<typeof filters>[] = useMemo(
    () => [
      {
        key: "status",
        label: "สถานะ",
        type: "select",
        options: [
          { label: "ทั้งหมด", value: "ALL" },
          { label: "ร่าง (Draft)", value: "DRAFT" },
          { label: "ส่งแล้ว (Submitted)", value: "SUBMITTED" },
          { label: "อนุมัติแล้ว (Approved)", value: "APPROVED" },
          { label: "มอบหมายแล้ว (Assigned)", value: "ASSIGNED" },
          { label: "เสร็จสิ้น (Completed)", value: "COMPLETED" },
          { label: "ยกเลิก (Cancelled)", value: "CANCELLED" },
        ],
      },
    ],
    []
  );

  const filteredRows = useMemo(() => {
    if (!rows) return [];
    return rows.filter((r) => {
      // Filter by status
      if (filters.status !== "ALL" && r.borrowRequestStatus !== filters.status) {
        return false;
      }
      // Filter by search query
      if (filters.q) {
        const query = filters.q.toLowerCase();
        const titleMatch = r.borrowRequestTitle?.toLowerCase().includes(query);
        const reasonMatch = r.borrowRequestReason?.toLowerCase().includes(query);
        if (!titleMatch && !reasonMatch) return false;
      }
      return true;
    });
  }, [rows, filters]);

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

      <FilterBar
        defs={filterDefs}
        value={filters}
        onChange={setFilters}
        searchKey="q"
        searchPlaceholder="ค้นหาคำขอ, หัวข้อ..."
      />

      {loading ? (
        <div className="py-16 flex justify-center">
          <LoadingSpinner />
        </div>
      ) : null}

      <BorrowRequestListCard
        rows={filteredRows}
        loading={loading}
        onView={(id) => router.push(`/head-consultant/borrow-consultants/${id}`)}
      />
    </div>
  );
}
