//src\components\super-admin\borrow-requests\BorrowRequestTable.tsx

"use client";

import { useMemo, useState } from "react";
import { MapPin, Users, Eye, CheckCircle, UserPlus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui";
import { FilterBar } from "@/components/filters/FilterBar";
import {
  BORROW_REQUESTS_FILTER_DEFS,
  type BorrowRequestsFilters,
} from "@/features/borrow-requests/filters/defs";
import type { BorrowRequest } from "@/features/borrow-requests/types";

function getStatusColor(status: string) {
  switch (status) {
    case "SUBMITTED":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "APPROVED":
      return "bg-green-100 text-green-800 border-green-200";
    case "ASSIGNED":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "COMPLETED":
      return "bg-gray-100 text-gray-800 border-gray-200";
    default:
      return "bg-gray-100 text-gray-600 border-gray-200";
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "SUBMITTED":
      return "รอดำเนินการ";
    case "APPROVED":
      return "อนุมัติแล้ว";
    case "ASSIGNED":
      return "มอบหมายแล้ว";
    case "COMPLETED":
      return "เสร็จสิ้น";
    default:
      return status;
  }
}

export function BorrowRequestsTable({
  rows,
  loading,
  onView,
  onApprove,
  onAssign,
}: {
  rows: BorrowRequest[];
  loading?: boolean;
  onView: (id: number) => void;
  onApprove: (id: number) => void;
  onAssign: (id: number) => void;
}) {
  const [filters, setFilters] = useState<BorrowRequestsFilters>({
    status: "ALL",
    q: "",
  });

  const safeRows = Array.isArray(rows) ? rows : [];

  const filtered = useMemo(() => {
    let list = safeRows;
    if (filters.status && filters.status !== "ALL") {
      list = list.filter((r) => r.borrowRequestStatus === filters.status);
    }
    const q = (filters.q || "").trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          r.borrowRequestTitle.toLowerCase().includes(q) ||
          r.borrowRequestReason.toLowerCase().includes(q),
      );
    }
    return list;
  }, [safeRows, filters]);

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="font-semibold text-slate-800">Borrow Requests</div>
        {loading ? <LoadingSpinner /> : null}
      </div>

      <FilterBar
        defs={BORROW_REQUESTS_FILTER_DEFS}
        value={filters}
        onChange={setFilters}
        searchKey="q"
        searchPlaceholder="ค้นหา title/reason..."
      />

      <div className="overflow-auto">
        <table className="min-w-full w-full text-sm">
          <thead className="bg-slate-50 border-b-2 border-slate-200">
            <tr>
              <th className="py-3 px-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">ID</th>
              <th className="py-3 px-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">หัวข้อคำขอ</th>
              <th className="py-3 px-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">จำนวน</th>
              <th className="py-3 px-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">สถานะ</th>
              <th className="py-3 px-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">การดำเนินการ</th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-slate-100">
            {filtered.map((r) => {
              const canApprove = r.borrowRequestStatus === "SUBMITTED";
              const canAssign = r.borrowRequestStatus === "APPROVED";

              return (
                <tr
                  key={r.borrowRequestId}
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => onView(r.borrowRequestId)}
                >
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-slate-900">#{r.borrowRequestId}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="max-w-md">
                      <div className="text-sm font-semibold text-slate-900 mb-1">
                        {r.borrowRequestTitle}
                      </div>
                      <div className="text-xs text-slate-500 line-clamp-2 mb-1">
                        {r.borrowRequestReason}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-sm text-slate-700 font-medium">
                        {r.borrowNeededCount} คน
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(r.borrowRequestStatus)}`}>
                      {getStatusLabel(r.borrowRequestStatus)}
                    </span>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onView(r.borrowRequestId)}
                        leftIcon={<Eye className="w-4 h-4" />}
                      >
                        ดูรายละเอียด
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {!filtered.length && !loading ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-slate-500">
                  ไม่มีรายการ
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
