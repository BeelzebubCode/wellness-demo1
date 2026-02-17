//src\components\head-consultant\borrow-requests\BorrowRequestForm.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DateCalendarPopover } from "@/components/filters/inputs/DateCalendarPopover";
import type { CreateBorrowRequestInput } from "@/features/borrow-requests/types";
import { Calendar, Clock, RotateCcw, ArrowRight, AlertCircle, Trash2 } from "lucide-react";

type ProblemCategoryV1 = {
  id: number;
  code: string;
  nameTh: string;
  nameEn?: string | null;
  description?: string | null;
};

type Props = {
  loading?: boolean;
  onCancel?: () => void;
  onSubmit: (input: CreateBorrowRequestInput) => Promise<void> | void;
  initialValues?: Partial<CreateBorrowRequestInput>;

  // ✅ ถ้าหน้านี้มี data อยู่แล้วส่งเข้ามาได้ (ไม่ต้อง fetch)
  problemCategories?: ProblemCategoryV1[];

  // ✅ default ให้ตรงกับไฟล์ route ที่นายมี
  problemCategoriesEndpoint?: string;
};

// ==============================
// datetime helpers (UX ดีขึ้น)
// ==============================
function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function toDateInputValue(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function toIsoOrNull(dateStr: string, isEnd: boolean = false) {
  const v = (dateStr || "").trim();
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;

  // Create local date at 00:00 or 23:59
  // Note: new Date("YYYY-MM-DD") is UTC, but we want local day representation usually? 
  // actually input type="date" gives YYYY-MM-DD. 
  // Let's assume we want to store it as 00:00:00 local time for that day.
  // Or just simpler: use the date string as is?
  // Backend expects ISO string probably.

  // Let's construct a date object treating input as local date
  const parts = v.split("-");
  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]) - 1;
  const day = parseInt(parts[2]);

  const localDate = new Date(year, month, day);
  if (isEnd) {
    localDate.setHours(23, 59, 59, 999);
  } else {
    localDate.setHours(0, 0, 0, 0);
  }

  return localDate.toISOString();
}

function isoToDateInputValue(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return toDateInputValue(d);
}

function prettyLocal(dtLocal: string) {
  if (!dtLocal) return "—";
  const d = new Date(dtLocal);
  if (Number.isNaN(d.getTime())) return "รูปแบบไม่ถูกต้อง";

  const day = d.getDate();
  const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  const month = months[d.getMonth()];
  const year = d.getFullYear() + 543;

  return `${day} ${month} ${year}`;
}

export function BorrowRequestForm({
  onSubmit,
  onCancel,
  loading,
  initialValues,
  problemCategories,
  problemCategoriesEndpoint = "/api/v2/master/problem-categories",
}: Props) {
  const isEdit = !!initialValues;

  // ====== problem categories ======
  const [cats, setCats] = useState<ProblemCategoryV1[]>(problemCategories ?? []);
  const [catsLoading, setCatsLoading] = useState(false);

  const [problemCategoryId, setProblemCategoryId] = useState<number>(() => 0);

  useEffect(() => {
    if (problemCategories && problemCategories.length) return;

    const run = async () => {
      setCatsLoading(true);
      try {
        const res = await fetch(problemCategoriesEndpoint, { method: "GET" });
        if (!res.ok) throw new Error("โหลดประเภทปัญหาไม่สำเร็จ");
        const json = await res.json();

        // ✅ API v1 ของนาย: { success: true, categories: [...] }
        const items: ProblemCategoryV1[] = Array.isArray(json?.categories)
          ? json.categories
          : [];

        setCats(items);

        // auto select ตัวแรกถ้ายังไม่เลือก
        if (!problemCategoryId && items?.[0]?.id) {
          setProblemCategoryId(items[0].id);
        }
      } catch (e) {
        console.error(e);
        setCats([]);
      } finally {
        setCatsLoading(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problemCategoriesEndpoint]);

  // auto select ตัวแรกเมื่อ cats มาแล้ว
  useEffect(() => {
    if (!problemCategoryId && cats.length) {
      setProblemCategoryId(cats[0].id);
    }
  }, [cats, problemCategoryId]);

  const selectedCat = useMemo(() => {
    return cats.find((c) => c.id === problemCategoryId) ?? null;
  }, [cats, problemCategoryId]);

  // ====== other fields ======
  const [reason, setReason] = useState(initialValues?.reason ?? "");
  const [detail, setDetail] = useState(initialValues?.detail ?? "");
  const [neededCount, setNeededCount] = useState<number>(initialValues?.neededCount ?? 1);

  const [neededFrom, setNeededFrom] = useState<string>(() =>
    isoToDateInputValue(initialValues?.neededFrom ?? null),
  );
  const [neededTo, setNeededTo] = useState<string>(() =>
    isoToDateInputValue(initialValues?.neededTo ?? null),
  );

  const timeHint = useMemo(() => {
    if (!neededFrom && !neededTo) return null;
    if (neededFrom && !neededTo) return "ถ้าระบุวันเริ่ม แนะนำให้ใส่วันสิ้นสุดด้วย";
    if (!neededFrom && neededTo) return "ถ้าระบุวันสิ้นสุด แนะนำให้ใส่วันเริ่มด้วย";

    const from = new Date(neededFrom);
    const to = new Date(neededTo);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()))
      return "รูปแบบวันเวลาไม่ถูกต้อง";
    if (to.getTime() < from.getTime()) return "วัน/เวลาสิ้นสุดต้องไม่ก่อนวัน/เวลาเริ่มต้น";
    if (neededFrom === neededTo) return "วันเริ่มต้นและวันสิ้นสุดต้องไม่ใช่วันเดียวกัน";
    return null;
  }, [neededFrom, neededTo]);

  const can = useMemo(() => {
    if (!selectedCat) return false;
    if (reason.trim().length === 0) return false;
    if (!(neededCount >= 1)) return false;

    if (!neededFrom || !neededTo) return false; // ✅ Require dates

    const from = new Date(neededFrom);
    const to = new Date(neededTo);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return false;
    if (to.getTime() <= from.getTime()) return false;

    return true;
  }, [selectedCat, reason, neededCount, neededFrom, neededTo]);

  const handleSubmit = () => {
    // ✅ สร้าง title จากประเภทปัญหา (เพราะ backend ยังรับ title อยู่)
    const titleFromCat = selectedCat ? selectedCat.nameTh : "";

    const payload: CreateBorrowRequestInput = {
      title: titleFromCat.trim(),
      reason: reason.trim(),
      detail: detail.trim() ? detail.trim() : null,
      neededCount,
      neededFrom: toIsoOrNull(neededFrom, false),
      neededTo: toIsoOrNull(neededTo, true),
    };

    onSubmit(payload);
  };

  return (
    <Card className="p-5 flex flex-col gap-4">
      <div>
        <div className="font-semibold text-slate-800 text-lg">
          {isEdit ? "แก้ไขคำขอยืมผู้ให้คำปรึกษา" : "สร้างคำขอยืมผู้ให้คำปรึกษา"}
        </div>
        <div className="text-sm text-slate-500 mt-1">
          เลือกประเภทปัญหา + ระบุเหตุผล และช่วงเวลาที่ต้องการ
        </div>
      </div>

      {/* ✅ ประเภทปัญหา */}
      <div className="grid gap-2">
        <label className="text-sm text-slate-600">ประเภทปัญหา</label>

        <div className="rounded-2xl border border-slate-200 bg-white p-3">
          <select
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-200 bg-white"
            value={problemCategoryId || ""}
            onChange={(e) => setProblemCategoryId(Number(e.target.value))}
            disabled={catsLoading || loading}
          >
            {!cats.length ? (
              <option value="">{catsLoading ? "กำลังโหลด..." : "ไม่พบประเภทปัญหา"}</option>
            ) : null}

            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nameTh} ({c.code})
              </option>
            ))}
          </select>

          <div className="text-xs text-slate-500 mt-2">
            {selectedCat?.description
              ? selectedCat.description
              : selectedCat
                ? `เลือกแล้ว: ${selectedCat.nameTh}`
                : "—"}
          </div>
        </div>
      </div>

      {/* เหตุผล */}
      <div className="grid gap-2">
        <label className="text-sm text-slate-600">เหตุผล</label>
        <Input value={reason} onChange={(e) => setReason(e.target.value)} />
      </div>

      {/* รายละเอียด */}
      <div className="grid gap-2">
        <label className="text-sm text-slate-600">รายละเอียด (optional)</label>
        <textarea
          className="w-full rounded-2xl border border-slate-200 p-3 text-sm outline-none focus:ring-2 focus:ring-primary-200 bg-white"
          rows={4}
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder="เล่ารายละเอียดเพิ่มเติม เช่น ช่วงเวลาที่อยากให้ช่วย/ข้อจำกัด/บริบท"
        />
      </div>

      {/* ✅ วันเวลา UX ใหม่ */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white rounded-md border border-slate-200 shadow-sm">
              <Calendar className="w-4 h-4 text-primary-600" />
            </div>
            <div>
              <div className="font-semibold text-slate-800">ช่วงเวลาที่ต้องการ <span className="text-red-500">*</span></div>
              <div className="text-xs text-slate-500">
                ระบุเวลาที่ต้องการให้ช่วยรับงาน
              </div>
            </div>
          </div>

          {(neededFrom || neededTo) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-slate-500 hover:text-red-600 hover:bg-red-50"
              disabled={loading}
              onClick={() => {
                setNeededFrom("");
                setNeededTo("");
              }}
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              ล้างค่า
            </Button>
          )}
        </div>

        {/* Inputs */}
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-slate-700">เริ่มวันที่</label>
            <DateCalendarPopover
              valueYMD={neededFrom}
              onChangeYMD={(v) => {
                setNeededFrom(v);
                // ถ้ายังไม่ได้เลือกวันสิ้นสุด หรือวันสิ้นสุดเดิม <= วันเริ่มใหม่ → ให้เป็นวันถัดไป
                if (!neededTo || neededTo <= v) {
                  const next = new Date(v);
                  next.setDate(next.getDate() + 1);
                  setNeededTo(toDateInputValue(next));
                }
              }}
              placeholder="วว/ดด/ปปปป"
              formatLabel={prettyLocal}
              className="w-full"
            />
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-slate-700">ถึงวันที่</label>
            <DateCalendarPopover
              valueYMD={neededTo}
              onChangeYMD={setNeededTo}
              placeholder="วว/ดด/ปปปป"
              formatLabel={prettyLocal}
              className="w-full"
              minDate={neededFrom ? (() => { const d = new Date(neededFrom); d.setDate(d.getDate() + 1); return d; })() : undefined}
            />
          </div>
        </div>

        {timeHint && (
          <div className="flex items-start gap-2 mt-4 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{timeHint}</span>
          </div>
        )}

        {neededFrom && neededTo && !timeHint && (
          <div className="mt-4 p-3 bg-primary-50 border border-primary-100 rounded-lg text-primary-700 text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              ระยะเวลา: <b>{prettyLocal(neededFrom)}</b> - <b>{prettyLocal(neededTo)}</b>
            </span>
          </div>
        )}
      </div>

      {/* จำนวนคน */}
      <div className="grid gap-2 max-w-[180px]">
        <label className="text-sm text-slate-600">ต้องการกี่คน</label>
        <Input
          type="number"
          min={1}
          value={neededCount}
          onChange={(e) => setNeededCount(Math.max(1, Number(e.target.value || 1)))}
        />
      </div>

      {/* actions */}
      <div className="flex justify-end gap-2 pt-1">
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
