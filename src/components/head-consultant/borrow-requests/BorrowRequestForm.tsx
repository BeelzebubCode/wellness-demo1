// src/components/head-consultant/borrow-requests/BorrowRequestForm.tsx

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
  initialValues?: Partial<CreateBorrowRequestInput>;
};

function toIsoOrNull(dtLocal: string) {
  const v = (dtLocal || "").trim();
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function isoToDatetimeLocal(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  // ใช้เวลาตาม local timezone เพื่อให้ input แสดงเป็นเวลาที่ user คุ้นเคย
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export function BorrowRequestForm({
  onSubmit,
  onCancel,
  loading,
  initialValues,
}: Props) {
  const isEdit = !!initialValues;

  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [reason, setReason] = useState(initialValues?.reason ?? "");
  const [detail, setDetail] = useState(initialValues?.detail ?? "");
  const [neededCount, setNeededCount] = useState<number>(initialValues?.neededCount ?? 1);

  const [neededFrom, setNeededFrom] = useState<string>(() =>
    isoToDatetimeLocal(initialValues?.neededFrom ?? null),
  );
  const [neededTo, setNeededTo] = useState<string>(() =>
    isoToDatetimeLocal(initialValues?.neededTo ?? null),
  );

  const can = useMemo(() => {
    if (title.trim().length === 0) return false;
    if (reason.trim().length === 0) return false;
    if (!(neededCount >= 1)) return false;

    if (neededFrom && neededTo) {
      const from = new Date(neededFrom);
      const to = new Date(neededTo);
      if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return false;
      if (to.getTime() < from.getTime()) return false;
    }
    return true;
  }, [title, reason, neededCount, neededFrom, neededTo]);

  const timeHint = useMemo(() => {
    if (!neededFrom || !neededTo) return null;
    const from = new Date(neededFrom);
    const to = new Date(neededTo);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return "รูปแบบวันเวลาไม่ถูกต้อง";
    if (to.getTime() < from.getTime()) return "วัน/เวลาสิ้นสุดต้องไม่ก่อนวัน/เวลาเริ่มต้น";
    return null;
  }, [neededFrom, neededTo]);

  const handleSubmit = () => {
    const payload: CreateBorrowRequestInput = {
      title: title.trim(),
      reason: reason.trim(),
      detail: detail.trim() ? detail.trim() : null,
      neededCount,
      neededFrom: toIsoOrNull(neededFrom),
      neededTo: toIsoOrNull(neededTo),
    };
    onSubmit(payload);
  };

  return (
    <Card className="p-4 flex flex-col gap-3">
      <div className="font-semibold text-slate-800">
        {isEdit ? "แก้ไขคำขอยืมผู้ให้คำปรึกษา" : "สร้างคำขอยืมผู้ให้คำปรึกษา"}
      </div>

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="grid gap-2">
          <label className="text-sm text-slate-600">ต้องการตั้งแต่ (optional)</label>
          <Input type="datetime-local" value={neededFrom} onChange={(e) => setNeededFrom(e.target.value)} />
        </div>

        <div className="grid gap-2">
          <label className="text-sm text-slate-600">ถึง (optional)</label>
          <Input type="datetime-local" value={neededTo} onChange={(e) => setNeededTo(e.target.value)} />
        </div>
      </div>

      {timeHint ? <div className="text-xs text-red-600">{timeHint}</div> : null}

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

        <Button disabled={!can || loading} onClick={handleSubmit}>
          {isEdit ? "บันทึก" : "สร้างคำขอ"}
        </Button>
      </div>
    </Card>
  );
}
