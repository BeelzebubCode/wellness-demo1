"use client";

import { useMemo, useState } from "react";
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

export function BorrowRequestsTable({
  rows,
  loading,
  onView,
  onApprove,
  onReject,
  onAssign,
}: {
  rows: BorrowRequest[];
  loading?: boolean;
  onView: (id: number) => void;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  onAssign: (id: number) => void;
}) {
  const [filters, setFilters] = useState<BorrowRequestsFilters>({
    status: "ALL",
    q: "",
  });

  const filtered = useMemo(() => {
    let list = rows || [];
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
  }, [rows, filters]);

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
        <table className="min-w-[900px] w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr>
              <th className="py-2">ID</th>
              <th>หัวข้อ</th>
              <th>ต้องการ</th>
              <th>สถานะ</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="text-slate-700">
            {filtered.map((r) => {
              const canApprove = r.borrowRequestStatus === "SUBMITTED";
              const canReject = r.borrowRequestStatus === "SUBMITTED";
              const canAssign = r.borrowRequestStatus === "APPROVED";

              return (
                <tr key={r.borrowRequestId} className="border-t border-slate-100">
                  <td className="py-3">{r.borrowRequestId}</td>
                  <td className="py-3">
                    <div className="font-medium">{r.borrowRequestTitle}</div>
                    <div className="text-xs text-slate-500 line-clamp-1">
                      {r.borrowRequestReason}
                    </div>
                  </td>
                  <td className="py-3">{r.borrowNeededCount} คน</td>
                  <td className="py-3">
                    <Badge>{r.borrowRequestStatus}</Badge>
                  </td>
                  <td className="py-3">
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => onView(r.borrowRequestId)}>
                        ดู
                      </Button>
                      <Button
                        disabled={!canApprove}
                        onClick={() => onApprove(r.borrowRequestId)}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        disabled={!canReject}
                        onClick={() => onReject(r.borrowRequestId)}
                      >
                        Reject
                      </Button>
                      <Button
                        disabled={!canAssign}
                        onClick={() => onAssign(r.borrowRequestId)}
                      >
                        Assign
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
