"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { BorrowRequestDetail } from "@/features/borrow-requests/types";

export function BorrowRequestDetailPanel({ data }: { data: BorrowRequestDetail }) {
  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="font-semibold text-slate-800">{data.borrowRequestTitle}</div>
        <Badge>{data.borrowRequestStatus}</Badge>
      </div>

      <div className="text-sm text-slate-600 whitespace-pre-wrap">
        {data.borrowRequestReason}
      </div>

      {data.borrowRequestDetail ? (
        <div className="text-sm text-slate-600 whitespace-pre-wrap">
          {data.borrowRequestDetail}
        </div>
      ) : null}

      <div className="text-xs text-slate-500">
        ต้องการ {data.borrowNeededCount} คน
      </div>

      <div className="pt-2 border-t border-slate-100">
        <div className="text-sm font-semibold text-slate-800 mb-2">
          รายการที่ถูก Assign
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
      </div>
    </Card>
  );
}
