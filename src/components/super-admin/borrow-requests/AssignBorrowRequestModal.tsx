"use client";

import { useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type AssignItem = {
  consultantId: number;
  consultantUniversityId: number;
  startAt: string; // ISO
  endAt: string; // ISO
  note?: string;
};

export function AssignBorrowRequestModal({
  open,
  onOpenChange,
  neededCount,
  onConfirm,
  loading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  neededCount: number;
  onConfirm: (items: AssignItem[]) => Promise<void> | void;
  loading?: boolean;
}) {
  const [items, setItems] = useState<AssignItem[]>([
    { consultantId: 0, consultantUniversityId: 0, startAt: "", endAt: "", note: "" },
  ]);

  const can = useMemo(() => {
    if (!items.length) return false;
    if (items.length < (neededCount || 1)) return false;
    return items.every(
      (it) =>
        Number.isFinite(it.consultantId) &&
        it.consultantId > 0 &&
        Number.isFinite(it.consultantUniversityId) &&
        it.consultantUniversityId > 0 &&
        String(it.startAt || "").trim() &&
        String(it.endAt || "").trim(),
    );
  }, [items, neededCount]);

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Assign Consultants">
      <div className="space-y-3">
        <div className="text-sm text-slate-600">
          ต้อง assign อย่างน้อย: <b>{neededCount || 1}</b> คน
        </div>

        <div className="space-y-2">
          {items.map((it, idx) => (
            <div key={idx} className="rounded-xl border border-slate-200 p-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-xs text-slate-500 mb-1">consultantId</div>
                  <Input
                    type="number"
                    value={it.consultantId || ""}
                    onChange={(e) => {
                      const v = Number(e.target.value || 0);
                      setItems((p) => p.map((x, i) => (i === idx ? { ...x, consultantId: v } : x)));
                    }}
                  />
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">consultantUniversityId</div>
                  <Input
                    type="number"
                    value={it.consultantUniversityId || ""}
                    onChange={(e) => {
                      const v = Number(e.target.value || 0);
                      setItems((p) =>
                        p.map((x, i) => (i === idx ? { ...x, consultantUniversityId: v } : x)),
                      );
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-xs text-slate-500 mb-1">startAt (ISO)</div>
                  <Input
                    value={it.startAt}
                    onChange={(e) =>
                      setItems((p) => p.map((x, i) => (i === idx ? { ...x, startAt: e.target.value } : x)))
                    }
                    placeholder="2026-01-26T10:00:00.000Z"
                  />
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">endAt (ISO)</div>
                  <Input
                    value={it.endAt}
                    onChange={(e) =>
                      setItems((p) => p.map((x, i) => (i === idx ? { ...x, endAt: e.target.value } : x)))
                    }
                    placeholder="2026-01-26T12:00:00.000Z"
                  />
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-500 mb-1">note</div>
                <Input
                  value={it.note || ""}
                  onChange={(e) =>
                    setItems((p) => p.map((x, i) => (i === idx ? { ...x, note: e.target.value } : x)))
                  }
                />
              </div>

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setItems((p) => p.filter((_, i) => i !== idx))}
                  disabled={items.length <= 1}
                >
                  ลบ
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() =>
              setItems((p) => [
                ...p,
                { consultantId: 0, consultantUniversityId: 0, startAt: "", endAt: "", note: "" },
              ])
            }
          >
            + เพิ่มคน
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              ปิด
            </Button>
            <Button disabled={!can || loading} onClick={() => onConfirm(items)}>
              ยืนยัน Assign
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
