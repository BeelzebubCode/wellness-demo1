//src\components\head-consultant\borrow-requests\BorrowRequestForm.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DateCalendarPopover } from "@/components/filters/inputs/DateCalendarPopover";
import type { CreateBorrowRequestInput } from "@/features/borrow-requests/types";
import { Calendar, Clock, RotateCcw, ArrowRight, AlertCircle, Trash2, FileText, Info } from "lucide-react";

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
    <Card className="border border-slate-200 shadow-sm rounded-2xl">
      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-5 text-white rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm shadow-sm">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">
              {isEdit ? "แก้ไขคำขอยืมผู้ให้คำปรึกษา" : "สร้างคำขอยืมผู้ให้คำปรึกษา"}
            </h2>
            <p className="text-sm text-white/75 mt-0.5">
              เลือกประเภทปัญหา + ระบุเหตุผล และช่วงเวลาที่ต้องการ
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 flex flex-col gap-6">
        {/* ── 1. ประเภทปัญหา ── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary-100 text-primary-600">
              <span className="text-xs font-bold">1</span>
            </div>
            <label className="text-sm font-semibold text-slate-700">
              ประเภทปัญหา <span className="text-red-400">*</span>
            </label>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 bg-white transition-all"
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

            {selectedCat && (
              <div className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                {selectedCat.description || `เช่น ${selectedCat.nameTh}`}
              </div>
            )}
          </div>
        </div>

        {/* ── 2. เหตุผล ── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-100 text-blue-600">
              <span className="text-xs font-bold">2</span>
            </div>
            <label className="text-sm font-semibold text-slate-700">
              เหตุผล <span className="text-red-400">*</span>
            </label>
          </div>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="ระบุเหตุผลในการขอยืมตัวที่ปรึกษา"
            className="rounded-lg"
          />
        </div>

        {/* ── 3. รายละเอียด ── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-slate-500">
              <span className="text-xs font-bold">3</span>
            </div>
            <label className="text-sm font-semibold text-slate-700">
              รายละเอียดเพิ่มเติม
              <span className="text-xs font-normal text-slate-400 ml-1.5">(ไม่บังคับ)</span>
            </label>
          </div>
          <textarea
            className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 bg-white transition-all resize-none"
            rows={3}
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="เล่ารายละเอียดเพิ่มเติม เช่น ช่วงเวลาที่อยากให้ช่วย/ข้อจำกัด/บริบท"
          />
        </div>

        {/* ── 4. วันเวลา ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-100 text-amber-600">
                <span className="text-xs font-bold">4</span>
              </div>
              <label className="text-sm font-semibold text-slate-700">
                ช่วงเวลาที่ต้องการ <span className="text-red-400">*</span>
              </label>
            </div>

            {(neededFrom || neededTo) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-slate-400 hover:text-red-500 hover:bg-red-50"
                disabled={loading}
                onClick={() => {
                  setNeededFrom("");
                  setNeededTo("");
                }}
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                ล้างค่า
              </Button>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 shadow-sm">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  เริ่มวันที่
                </label>
                <DateCalendarPopover
                  valueYMD={neededFrom}
                  onChangeYMD={(v) => {
                    setNeededFrom(v);
                    if (!neededTo || neededTo <= v) {
                      const next = new Date(v);
                      next.setDate(next.getDate() + 1);
                      setNeededTo(toDateInputValue(next));
                    }
                  }}
                  placeholder="วว/ดด/ปปปป"
                  formatLabel={prettyLocal}
                  className="w-full"
                  minDate={new Date()}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5" />
                  ถึงวันที่
                </label>
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
              <div className="flex items-start gap-2 mt-3 p-2.5 bg-red-50 border border-red-100 rounded-lg text-red-600 text-xs">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>{timeHint}</span>
              </div>
            )}

            {neededFrom && neededTo && !timeHint && (
              <div className="mt-3 p-2.5 bg-primary-50 border border-primary-100 rounded-lg text-primary-700 text-xs flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                ระยะเวลา: <b>{prettyLocal(neededFrom)}</b> — <b>{prettyLocal(neededTo)}</b>
              </div>
            )}
          </div>
        </div>

        {/* ── 5. จำนวนคน ── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-green-100 text-green-600">
              <span className="text-xs font-bold">5</span>
            </div>
            <label className="text-sm font-semibold text-slate-700">
              จำนวนที่ปรึกษาที่ต้องการ <span className="text-red-400">*</span>
            </label>
          </div>
          <div className="max-w-[160px]">
            <Input
              type="number"
              min={1}
              value={neededCount}
              onChange={(e) => setNeededCount(Math.max(1, Number(e.target.value || 1)))}
              className="rounded-lg text-center font-semibold"
            />
          </div>
        </div>
      </div>

      {/* ── Action Footer ── */}
      <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex justify-end gap-2">
        {onCancel ? (
          <Button size="sm" variant="outline" disabled={loading} onClick={onCancel} className="rounded-xl shadow-sm bg-white">
            ยกเลิก
          </Button>
        ) : null}

        <Button
          size="sm"
          disabled={!can || loading}
          onClick={handleSubmit}
          className="rounded-xl shadow-sm"
        >
          {isEdit ? "บันทึก" : "สร้างคำขอ"}
        </Button>
      </div>
    </Card>
  );
}
