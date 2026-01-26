"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { BorrowRequestDetail } from "@/features/borrow-requests/types";

export function BorrowRequestDetailPanel({ data }: { data: BorrowRequestDetail }) {
  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-semibold text-slate-800">{data.borrowRequestTitle}</div>
          <div className="text-xs text-slate-500">
            fromUniversityId: {data.fromUniversityId} / requestedBy:{" "}
            {data.requestedByAccountId}
          </div>
        </div>
        <Badge>{data.borrowRequestStatus}</Badge>
      </div>

      <div className="text-sm text-slate-700 whitespace-pre-wrap">
        {data.borrowRequestReason}
      </div>

      {data.borrowRejectReason ? (
        <div className="text-sm text-red-700 whitespace-pre-wrap">
          Reject reason: {data.borrowRejectReason}
        </div>
      ) : null}

      <div className="text-sm font-semibold text-slate-800 pt-2 border-t border-slate-100">
        Assignments
      </div>

      {data.assignments?.length ? (
        <div className="space-y-2">
          {data.assignments.map((a) => (
            <div
              key={a.borrowAssignmentId}
              className="rounded-xl border border-slate-200 p-3 text-sm"
            >
              <div className="font-medium text-slate-800">
                consultantId: {a.consultantId} (uni {a.consultantUniversityId})
              </div>
              <div className="text-xs text-slate-500">
                {a.borrowAssignStartAt} → {a.borrowAssignEndAt}
              </div>
              {a.borrowAssignmentNote ? (
                <div className="text-sm text-slate-600 mt-1">
                  {a.borrowAssignmentNote}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-slate-500">ยังไม่มีการ Assign</div>
      )}
    </Card>
  );
}
