"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { CreateBorrowRequestInput } from "@/features/borrow-requests/types";

type Props = {
  loading?: boolean;
  onCancel?: () => void;
  onSubmit: (input: CreateBorrowRequestInput) => Promise<void> | void;
};

export function BorrowRequestForm({ onSubmit, onCancel, loading }: Props) {
  const [title, setTitle] = useState("");
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");
  const [neededCount, setNeededCount] = useState(1);

  const can = useMemo(
    () => title.trim().length > 0 && reason.trim().length > 0 && neededCount >= 1,
    [title, reason, neededCount]
  );

  return (
    <Card className="p-4 flex flex-col gap-3">
      <div className="font-semibold text-slate-800">สร้างคำขอยืมผู้ให้คำปรึกษา</div>

      <div className="grid gap-2">
        <label className="text-sm text-slate-600">หัวข้อ</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div className="grid gap-2">
        <label className="text-sm text-slate-600">เหตุผล</label>
        <Input value={reason} onChange={(e) => setReason(e.target.value)} />
      </div>

      <div className="grid gap-2">
        <label className="text-sm text-slate-600">รายละเอียด (optional)</label>
        <textarea
          className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:ring-2 focus:ring-primary-200"
          rows={4}
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
        />
      </div>

      <div className="grid gap-2 max-w-[160px]">
        <label className="text-sm text-slate-600">ต้องการกี่คน</label>
        <Input
          type="number"
          min={1}
          value={neededCount}
          onChange={(e) => setNeededCount(Math.max(1, Number(e.target.value || 1)))}
        />
      </div>

      <div className="flex justify-end gap-2">
        {onCancel ? (
          <Button variant="outline" disabled={loading} onClick={onCancel}>
            ยกเลิก
          </Button>
        ) : null}

        <Button
          disabled={!can || loading}
          onClick={() =>
            onSubmit({
              // ⚠️ ตรงนี้ “ต้องตรงกับ CreateBorrowRequestInput ของนาย”
              borrowRequestTitle: title.trim(),
              borrowRequestReason: reason.trim(),
              borrowRequestDetail: detail.trim() ? detail.trim() : null,
              borrowNeededCount: neededCount,
            } as any)
          }
        >
          สร้างคำขอ
        </Button>
      </div>
    </Card>
  );
}
