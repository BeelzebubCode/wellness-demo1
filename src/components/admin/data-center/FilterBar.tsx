"use client";

import { useEffect, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { DataCenterFilter } from "@/types/data-center";

const INITIAL: DataCenterFilter = {
  status: "ALL",
};

export default function FilterBar({
  onFilterChange,
}: {
  onFilterChange: (f: DataCenterFilter) => void;
}) {
  const [filters, setFilters] = useState<DataCenterFilter>(INITIAL);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => onFilterChange(filters), 400);
    return () => clearTimeout(t);
  }, [filters]);

  const set = <K extends keyof DataCenterFilter>(
    k: K,
    v: DataCenterFilter[K]
  ) => setFilters(p => ({ ...p, [k]: v }));

  return (
    <div className="bg-white border rounded-xl p-4 space-y-4">

      {/* ================= Quick Row ================= */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            placeholder="ค้นหา ชื่อ / รหัสนิสิต / ผู้ให้คำปรึกษา"
            className="bg-transparent outline-none text-sm w-full"
            onChange={e => set("search", e.target.value)}
          />
        </div>

        <select
          className="border rounded-lg px-3 py-2 text-sm"
          onChange={e => set("status", e.target.value as any)}
        >
          <option value="ALL">ทุกสถานะ</option>
          <option value="PENDING_ASSIGNMENT">รอพิจารณา</option>
          <option value="ASSIGNED">อนุมัติแล้ว</option>
          <option value="IN_PROGRESS">กำลังดำเนินการ</option>
          <option value="COMPLETED">เสร็จสิ้น</option>
          <option value="CANCELLED">ยกเลิก</option>
        </select>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(o => (o ? null : "student"))}
        >
          <SlidersHorizontal className="w-4 h-4 mr-1" />
          ตัวกรองขั้นสูง
        </Button>
      </div>

      {/* ================= Facets ================= */}
      <div className="grid md:grid-cols-4 gap-4">

        {/* ===== Student ===== */}
        <Facet title="ผู้จองคิว">
          <Input label="รหัสนิสิต" onChange={v => set("studentCode", v)} />
          <Input label="ชั้นปี" type="number" onChange={v => set("year", Number(v))} />
          <Input label="จำนวนครั้งที่จอง ≥" type="number" onChange={v => set("bookingCountMin", Number(v))} />
          <Checkbox label="เคยไม่มาตามนัด" onChange={v => set("noShowCountMin", v ? 1 : undefined)} />
          <Checkbox label="จองเรื่องเดิมซ้ำ" onChange={v => set("isRepeatTopic", v)} />
        </Facet>

        {/* ===== Consultant ===== */}
        <Facet title="ผู้ให้คำปรึกษา">
          <Input label="ชื่อผู้ให้คำปรึกษา" onChange={v => set("consultantName", v)} />
          <Input label="ความเชี่ยวชาญ" onChange={v => set("specialization", v)} />
          <Input label="คะแนน ≥" type="number" onChange={v => set("ratingMin", Number(v))} />
        </Facet>

        {/* ===== Problem ===== */}
        <Facet title="ประเภทเรื่อง">
          <Input label="Problem Category ID" type="number" onChange={v => set("problemCategoryId", Number(v))} />
        </Facet>

        {/* ===== Booking ===== */}
        <Facet title="การจองคิว">
          <Input type="date" label="ตั้งแต่" onChange={v => set("startDate", v)} />
          <Input type="date" label="ถึง" onChange={v => set("endDate", v)} />
        </Facet>
      </div>
    </div>
  );
}

/* ---------- Helpers ---------- */

function Facet({ title, children }: any) {
  return (
    <div className="border rounded-lg p-3 space-y-2">
      <h4 className="font-semibold text-sm text-gray-700">{title}</h4>
      {children}
    </div>
  );
}

function Input({ label, type = "text", onChange }: any) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-gray-500">{label}</label>
      <input
        type={type}
        className="border rounded px-2 py-1 w-full text-sm"
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}

function Checkbox({ label, onChange }: any) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" onChange={e => onChange(e.target.checked)} />
      {label}
    </label>
  );
}
