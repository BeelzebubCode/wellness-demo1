"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, SlidersHorizontal, X, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { DataCenterFilter } from "@/types/data-center";

// ==============================
// Types (ภายใน FilterBar เท่านั้น)
// ==============================
type FilterGroupKey = "STUDENT" | "CONSULTANT" | "TOPIC" | "BOOKING";

type FilterItemType =
  | "select"
  | "multiSelect"
  | "text"
  | "numberMin"
  | "boolean"
  | "date";

type FilterDef = {
  key: keyof DataCenterFilter;
  group: FilterGroupKey;
  label: string;
  type: FilterItemType;
  options?: { label: string; value: any }[];
  placeholder?: string;
};

type ActiveFilter = {
  key: keyof DataCenterFilter;
  group: FilterGroupKey;
};

// ==============================
// 1) Filter Definitions (ให้ key ตรงกับ src/types/data-center.ts)
// ==============================
const FILTER_DEFS: FilterDef[] = [
  // ===== Student
  {
    key: "facultyId",
    group: "STUDENT",
    label: "คณะ",
    type: "select",
    options: [
      { label: "ทั้งหมด", value: "" },
      { label: "วิทยาการคอมพิวเตอร์", value: 1 },
      { label: "วิศวกรรมศาสตร์", value: 2 },
      { label: "บริหารธุรกิจ", value: 3 },
    ],
  },
  {
    key: "departmentId",
    group: "STUDENT",
    label: "สาขาวิชา/ภาควิชา",
    type: "select",
    options: [
      { label: "ทั้งหมด", value: "" },
      { label: "CS", value: 11 },
      { label: "IT", value: 12 },
      { label: "SE", value: 13 },
    ],
  },
  {
    key: "year",
    group: "STUDENT",
    label: "ชั้นปี",
    type: "select",
    options: [
      { label: "ทั้งหมด", value: "" },
      { label: "ปี 1", value: 1 },
      { label: "ปี 2", value: 2 },
      { label: "ปี 3", value: 3 },
      { label: "ปี 4", value: 4 },
    ],
  },
  {
    key: "degree",
    group: "STUDENT",
    label: "ระดับการศึกษา",
    type: "select",
    options: [
      { label: "ทั้งหมด", value: "" },
      { label: "ปริญญาตรี", value: "BACHELOR" },
      { label: "ปริญญาโท", value: "MASTER" },
      { label: "ปริญญาเอก", value: "PHD" },
    ],
  },
  { key: "studentCode", group: "STUDENT", label: "รหัสนิสิต", type: "text", placeholder: "เช่น 66012345" },
  { key: "bookingCountMin", group: "STUDENT", label: "จำนวนครั้งที่จอง ≥", type: "numberMin", placeholder: "เช่น 3" },
  { key: "noShowCountMin", group: "STUDENT", label: "จำนวนครั้งที่ไม่มาตามนัด ≥", type: "numberMin", placeholder: "เช่น 1" },
  { key: "isRepeatTopic", group: "STUDENT", label: "จองซ้ำในเรื่องเดิม", type: "boolean" },

  // ===== Consultant
  { key: "consultantName", group: "CONSULTANT", label: "ชื่อผู้ให้คำปรึกษา", type: "text", placeholder: "ค้นหาชื่อ" },
  {
    key: "specialization",
    group: "CONSULTANT",
    label: "ความเชี่ยวชาญ",
    type: "select",
    options: [
      { label: "ทั้งหมด", value: "" },
      { label: "สุขภาพจิต", value: "MENTAL" },
      { label: "การเรียน", value: "ACADEMIC" },
      { label: "การเงิน", value: "FINANCE" },
      { label: "ครอบครัว", value: "FAMILY" },
    ],
  },
  {
    key: "organizationId",
    group: "CONSULTANT",
    label: "สังกัดหน่วยงาน",
    type: "select",
    options: [
      { label: "ทั้งหมด", value: "" },
      { label: "ศูนย์สุขภาวะนิสิต", value: 1 },
      { label: "กองกิจการนิสิต", value: 2 },
    ],
  },
  { key: "activeQueueMin", group: "CONSULTANT", label: "จำนวนคิวที่รับอยู่ ≥", type: "numberMin" },
  { key: "workloadMin", group: "CONSULTANT", label: "ภาระงานรวม ≥", type: "numberMin" },
  { key: "avgDurationMin", group: "CONSULTANT", label: "ระยะเวลาเฉลี่ย (นาที) ≥", type: "numberMin" },
  { key: "ratingMin", group: "CONSULTANT", label: "คะแนนความพึงพอใจ ≥", type: "numberMin" },

  // ===== Topic
  {
    key: "problemCategoryId",
    group: "TOPIC",
    label: "ประเภทเรื่องที่ขอรับคำปรึกษา",
    type: "select",
    options: [
      { label: "ทั้งหมด", value: "" },
      { label: "ความเครียด/สุขภาพจิต", value: 101 },
      { label: "การเรียน", value: 102 },
      { label: "ความสัมพันธ์", value: 103 },
      { label: "การเงิน", value: 104 },
    ],
  },

  // ===== Booking
  { key: "startDate", group: "BOOKING", label: "วันที่เริ่มต้น", type: "date" },
  { key: "endDate", group: "BOOKING", label: "วันที่สิ้นสุด", type: "date" },
  {
    key: "timeRange",
    group: "BOOKING",
    label: "ช่วงเวลา",
    type: "select",
    options: [
      { label: "ทั้งหมด", value: "" },
      { label: "เช้า", value: "MORNING" },
      { label: "บ่าย", value: "AFTERNOON" },
      { label: "เย็น", value: "EVENING" },
    ],
  },
];

const GROUPS: { key: FilterGroupKey; label: string; desc: string }[] = [
  { key: "STUDENT", label: "ผู้จองคิว", desc: "กรองข้อมูลนิสิต/ผู้จอง" },
  { key: "CONSULTANT", label: "ผู้ให้คำปรึกษา", desc: "กรองข้อมูลผู้ให้คำปรึกษา" },
  { key: "TOPIC", label: "ประเภทเรื่อง", desc: "กรองประเภทคำปรึกษา" },
  { key: "BOOKING", label: "การจองคิว", desc: "กรองวัน/เวลา/สถานะ" },
];

const INITIAL: DataCenterFilter = { status: "ALL" };

export default function FilterBar({
  onFilterChange,
  onExport,
  isLoading,
}: {
  onFilterChange: (f: DataCenterFilter) => void;
  onExport?: () => void;
  isLoading?: boolean;
}) {
  const [filters, setFilters] = useState<DataCenterFilter>(INITIAL);

  const [open, setOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState<FilterGroupKey>("STUDENT");
  const [selected, setSelected] = useState<ActiveFilter[]>([]);
  const popRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!open) return;
      const t = e.target as Node;
      if (popRef.current && !popRef.current.contains(t)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  // debounce ส่งค่าออก
  const lastSentRef = useRef<string>("");

  useEffect(() => {
    const t = setTimeout(() => {
      const cleaned = cleanFilters(filters);
      const serialized = JSON.stringify(cleaned);

      if (serialized === lastSentRef.current) return;

      lastSentRef.current = serialized;
      onFilterChange(cleaned);
    }, 350);

    return () => clearTimeout(t);
  }, [filters]);

  const defsByGroup = useMemo(() => {
    const map = new Map<FilterGroupKey, FilterDef[]>();
    for (const g of GROUPS) map.set(g.key, []);
    for (const d of FILTER_DEFS) map.get(d.group)!.push(d);
    return map;
  }, []);

  const selectedSet = useMemo(() => new Set(selected.map((s) => String(s.key))), [selected]);

  const set = <K extends keyof DataCenterFilter>(k: K, v: DataCenterFilter[K]) =>
    setFilters((prev) => ({ ...prev, [k]: v }));

  const toggleFilter = (key: keyof DataCenterFilter, group: FilterGroupKey) => {
    setSelected((prev) => {
      const exists = prev.some((p) => p.key === key);
      if (exists) {
        setFilters((f) => {
          const copy = { ...f } as any;
          delete copy[key];
          return copy;
        });
        return prev.filter((p) => p.key !== key);
      }
      return [...prev, { key, group }];
    });
  };

  const clearAll = () => {
    setSelected([]);
    setFilters(INITIAL);
  };

  const removeChip = (key: keyof DataCenterFilter) => {
    setSelected((prev) => prev.filter((p) => p.key !== key));
    setFilters((f) => {
      const copy = { ...f } as any;
      delete copy[key];
      return copy;
    });
  };

  const activeDefs = useMemo(() => {
    const map = new Map<string, FilterDef>();
    for (const d of FILTER_DEFS) map.set(String(d.key), d);
    return selected.map((s) => map.get(String(s.key))).filter(Boolean) as FilterDef[];
  }, [selected]);

  return (
    <div className="bg-white border rounded-xl p-4 space-y-3">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            placeholder="ค้นหา ชื่อ / รหัสนิสิต / ผู้ให้คำปรึกษา"
            className="bg-transparent outline-none text-sm w-full"
            value={filters.search ?? ""}
            onChange={(e) => set("search", e.target.value)}
          />
        </div>

        {/* ✅ status type ถูกแล้ว */}
        <select
          className="border rounded-lg px-3 py-2 text-sm"
          value={filters.status ?? "ALL"}
          onChange={(e) => set("status", e.target.value as DataCenterFilter["status"])}
        >
          <option value="ALL">ทุกสถานะ</option>
          <option value="PENDING_ASSIGNMENT">รอพิจารณา</option>
          <option value="ASSIGNED">อนุมัติแล้ว</option>
          <option value="IN_PROGRESS">กำลังดำเนินการ</option>
          <option value="COMPLETED">เสร็จสิ้น</option>
          <option value="CANCELLED">ยกเลิก</option>
          <option value="NO_SHOW">ไม่มาตามนัด</option>
          <option value="CONFIRMED">ยืนยันแล้ว</option>
        </select>

        <div className="relative flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setOpen((o) => !o)}>
            <SlidersHorizontal className="w-4 h-4 mr-1" />
            Filters
            <ChevronDown className="w-4 h-4 ml-1 opacity-70" />
          </Button>

          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport} disabled={isLoading}>
              Export
            </Button>
          )}

          {open && (
            <div
              ref={popRef}
              className="absolute right-0 mt-2 w-[860px] max-w-[92vw] z-50 bg-white border shadow-lg rounded-2xl overflow-hidden"
            >
              <div className="grid grid-cols-[260px,1fr]">
                <div className="border-r bg-gray-50 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-semibold text-gray-800">หมวดหมู่</div>
                    <button className="p-1 rounded hover:bg-gray-200" onClick={() => setOpen(false)} aria-label="close">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    {GROUPS.map((g) => (
                      <button
                        key={g.key}
                        onClick={() => setActiveGroup(g.key)}
                        className={[
                          "w-full text-left px-3 py-2 rounded-xl transition",
                          activeGroup === g.key ? "bg-white border shadow-sm" : "hover:bg-white/70",
                        ].join(" ")}
                      >
                        <div className="text-sm font-medium text-gray-900">{g.label}</div>
                        <div className="text-xs text-gray-500">{g.desc}</div>
                      </button>
                    ))}
                  </div>

                  <div className="mt-3 pt-3 border-t">
                    <Button variant="outline" size="sm" onClick={clearAll} className="w-full">
                      ล้างตัวกรองทั้งหมด
                    </Button>
                  </div>
                </div>

                <div className="p-3">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {activeDefs.length === 0 ? (
                      <div className="text-sm text-gray-500">เลือกตัวกรองจากฝั่งซ้าย แล้วติ๊กหมวดย่อยที่ต้องการ</div>
                    ) : (
                      activeDefs.map((d) => (
                        <div
                          key={String(d.key)}
                          className="flex items-center gap-2 border rounded-full px-3 py-1.5 text-sm bg-white shadow-sm"
                        >
                          <span className="font-medium text-gray-800">{d.label}</span>
                          <button className="p-1 rounded-full hover:bg-gray-100" onClick={() => removeChip(d.key)} aria-label="remove">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="border rounded-2xl p-3">
                      <div className="text-sm font-semibold text-gray-800 mb-2">เลือกหมวดย่อย</div>
                      <div className="space-y-1 max-h-[360px] overflow-auto pr-1">
                        {(defsByGroup.get(activeGroup) ?? []).map((d) => {
                          const checked = selectedSet.has(String(d.key));
                          return (
                            <button
                              key={String(d.key)}
                              onClick={() => toggleFilter(d.key, d.group)}
                              className={[
                                "w-full flex items-center justify-between px-3 py-2 rounded-xl border text-left",
                                checked ? "bg-gray-900 text-white border-gray-900" : "hover:bg-gray-50",
                              ].join(" ")}
                            >
                              <span className="text-sm">{d.label}</span>
                              {checked ? <Check className="w-4 h-4" /> : null}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="border rounded-2xl p-3">
                      <div className="text-sm font-semibold text-gray-800 mb-2">ตั้งค่าตัวกรอง</div>

                      {activeDefs.length === 0 ? (
                        <div className="text-sm text-gray-500">ยังไม่ได้เลือกตัวกรอง</div>
                      ) : (
                        <div className="space-y-3 max-h-[360px] overflow-auto pr-1">
                          {activeDefs.map((d) => (
                            <FilterValueRow
                              key={String(d.key)}
                              def={d}
                              value={(filters as any)[d.key]}
                              onChange={(v: any) => set(d.key as any, v)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t pt-3">
                    <div className="text-xs text-gray-500">* ปรับค่าแล้วตารางจะกรองให้อัตโนมัติ (มี debounce)</div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
                        ปิด
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {activeDefs.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeDefs.map((d) => (
            <div
              key={String(d.key)}
              className="flex items-center gap-2 bg-gray-50 border rounded-full px-3 py-1 text-xs"
            >
              <span className="font-medium text-gray-700">{d.label}:</span>
              <span className="text-gray-600">{renderValuePreview(d, (filters as any)[d.key])}</span>
              <button className="p-1 hover:bg-gray-100 rounded-full" onClick={() => removeChip(d.key)}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==============================
// Row
// ==============================
function FilterValueRow({
  def,
  value,
  onChange,
}: {
  def: FilterDef;
  value: any;
  onChange: (v: any) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="text-xs text-gray-500">{def.label}</div>

      {def.type === "select" && (
        <select
          className="border rounded-xl px-3 py-2 text-sm w-full bg-white"
          value={value ?? ""}
          onChange={(e) => onChange(normalizeSelect(e.target.value))}
        >
          {(def.options ?? []).map((op) => (
            <option key={String(op.value)} value={String(op.value)}>
              {op.label}
            </option>
          ))}
        </select>
      )}

      {def.type === "text" && (
        <input
          className="border rounded-xl px-3 py-2 text-sm w-full"
          placeholder={def.placeholder ?? ""}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {def.type === "numberMin" && (
        <input
          type="number"
          className="border rounded-xl px-3 py-2 text-sm w-full"
          placeholder={def.placeholder ?? "0"}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
        />
      )}

      {def.type === "date" && (
        <input
          type="date"
          className="border rounded-xl px-3 py-2 text-sm w-full"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value || undefined)}
        />
      )}

      {def.type === "boolean" && (
        <label className="flex items-center gap-2 text-sm border rounded-xl px-3 py-2">
          <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
          <span className="text-gray-800">เปิดใช้งาน</span>
        </label>
      )}
    </div>
  );
}

// ==============================
// Helpers
// ==============================
function cleanFilters(f: DataCenterFilter) {
  const x: any = { ...f };
  Object.keys(x).forEach((k) => {
    if (x[k] === "") delete x[k];
    if (x[k] === undefined) delete x[k];
  });
  return x as DataCenterFilter;
}

function normalizeSelect(v: string) {
  if (v === "") return "";
  if (/^\d+$/.test(v)) return Number(v);
  return v;
}

function renderValuePreview(def: FilterDef, value: any) {
  if (value === undefined || value === "") return "ทั้งหมด";
  if (def.type === "boolean") return value ? "ใช่" : "ไม่";
  if (def.type === "date") return value;
  if (def.type === "select") {
    const hit = def.options?.find((o) => String(o.value) === String(value));
    return hit?.label ?? String(value);
  }
  return String(value);
}
