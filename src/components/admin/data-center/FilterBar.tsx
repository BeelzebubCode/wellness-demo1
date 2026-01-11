// src/components/admin/data-center/FilterBar.tsx

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  Check,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import type {
  DataCenterFilter,
  DataCenterCategory,
} from "@/features/data-center/types";

// ==============================
// Types
// ==============================
type FilterItemType = "select" | "text" | "numberMin" | "boolean" | "date";

type FilterDef = {
  key: keyof DataCenterFilter;
  categories: DataCenterCategory[]; // แสดงใน category ไหนบ้าง
  label: string;
  type: FilterItemType;
  options?: { label: string; value: any }[];
  placeholder?: string;
};

// ==============================
// Filter Definitions
// ==============================
const FILTER_DEFS: FilterDef[] = [
  // ===== Students =====
  {
    key: "facultyId",
    categories: ["STUDENTS"],
    label: "คณะ",
    type: "select",
    options: [
      { label: "ทั้งหมด", value: "" },
      { label: "วิทยาศาสตร์", value: 1 },
      { label: "วิศวกรรมศาสตร์", value: 2 },
      { label: "บริหารธุรกิจ", value: 3 },
    ],
  },
  {
    key: "departmentId",
    categories: ["STUDENTS"],
    label: "สาขาวิชา",
    type: "select",
    options: [
      { label: "ทั้งหมด", value: "" },
      { label: "วิทยาการคอมพิวเตอร์", value: 1 },
      { label: "เทคโนโลยีสารสนเทศ", value: 2 },
      { label: "วิศวกรรมซอฟต์แวร์", value: 3 },
    ],
  },
  {
    key: "year",
    categories: ["STUDENTS"],
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
    categories: ["STUDENTS"],
    label: "ระดับการศึกษา",
    type: "select",
    options: [
      { label: "ทั้งหมด", value: "" },
      { label: "ปริญญาตรี", value: "BACHELOR" },
      { label: "ปริญญาโท", value: "MASTER" },
      { label: "ปริญญาเอก", value: "PHD" },
    ],
  },
  {
    key: "studentCode",
    categories: ["STUDENTS"],
    label: "รหัสนิสิต",
    type: "text",
    placeholder: "เช่น 66012345",
  },
  {
    key: "bookingCountMin",
    categories: ["STUDENTS"],
    label: "จำนวนครั้งที่จอง ≥",
    type: "numberMin",
    placeholder: "เช่น 3",
  },
  {
    key: "noShowCountMin",
    categories: ["STUDENTS"],
    label: "ไม่มาตามนัด ≥",
    type: "numberMin",
    placeholder: "เช่น 1",
  },

  // ===== Consultants =====
  {
    key: "organizationId",
    categories: ["CONSULTANTS"],
    label: "สังกัดหน่วยงาน",
    type: "select",
    options: [
      { label: "ทั้งหมด", value: "" },
      { label: "ศูนย์สุขภาวะนิสิต", value: 1 },
      { label: "กองกิจการนิสิต", value: 2 },
    ],
  },
  {
    key: "specialization",
    categories: ["CONSULTANTS"],
    label: "ความเชี่ยวชาญ",
    type: "select",
    options: [
      { label: "ทั้งหมด", value: "" },
      { label: "สุขภาพจิต", value: "MENTAL" },
      { label: "การเรียน", value: "ACADEMIC" },
      { label: "การเงิน", value: "FINANCE" },
    ],
  },
  {
    key: "activeQueueMin",
    categories: ["CONSULTANTS"],
    label: "คิวที่รับอยู่ ≥",
    type: "numberMin",
  },
  {
    key: "ratingMin",
    categories: ["CONSULTANTS"],
    label: "คะแนนความพึงพอใจ ≥",
    type: "numberMin",
  },

  // ===== Bookings =====
  {
    key: "status",
    categories: ["BOOKINGS"],
    label: "สถานะ",
    type: "select",
    options: [
      { label: "ทั้งหมด", value: "ALL" },
      { label: "รอมอบหมาย", value: "PENDING_ASSIGNMENT" },
      { label: "มอบหมายแล้ว", value: "ASSIGNED" },
      { label: "กำลังดำเนินการ", value: "IN_PROGRESS" },
      { label: "เสร็จสิ้น", value: "COMPLETED" },
      { label: "ยกเลิก", value: "CANCELLED" },
    ],
  },
  {
    key: "problemCategoryId",
    categories: ["BOOKINGS"],
    label: "ประเภทเรื่อง",
    type: "select",
    options: [
      { label: "ทั้งหมด", value: "" },
      { label: "ความเครียด/สุขภาพจิต", value: 1 },
      { label: "การเรียน", value: 2 },
      { label: "ความสัมพันธ์", value: 3 },
      { label: "การเงิน", value: 4 },
    ],
  },

  // ===== Common (ใช้ได้หลาย category) =====
  {
    key: "startDate",
    categories: ["STUDENTS", "CONSULTANTS", "BOOKINGS"],
    label: "ตั้งแต่วันที่",
    type: "date",
  },
  {
    key: "endDate",
    categories: ["STUDENTS", "CONSULTANTS", "BOOKINGS"],
    label: "ถึงวันที่",
    type: "date",
  },
];

// ==============================
// Props
// ==============================
interface FilterBarProps {
  category: DataCenterCategory;
  filters: DataCenterFilter;
  onFilterChange: (filters: DataCenterFilter) => void;
  onExport?: () => void;
  isLoading?: boolean;
}

export default function FilterBar({
  category,
  filters,
  onFilterChange,
  onExport,
  isLoading,
}: FilterBarProps) {
  const [open, setOpen] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<keyof DataCenterFilter>>(
    new Set()
  );
  const popRef = useRef<HTMLDivElement | null>(null);

  type Option = { label: string; value: any };

  const [facultyOptions, setFacultyOptions] = useState<Option[]>([
    { label: "ทั้งหมด", value: "" },
  ]);

  const [departmentOptions, setDepartmentOptions] = useState<Option[]>([
    { label: "ทั้งหมด", value: "" },
  ]);

  // Filter definitions for current category
  const availableFilters = useMemo(() => {
    return FILTER_DEFS.filter((f) => f.categories.includes(category));
  }, [category]);

  // Active filters (selected + has value)
  const activeFilters = useMemo(() => {
    return availableFilters.filter((f) => selectedKeys.has(f.key));
  }, [availableFilters, selectedKeys]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/data-center/lookups/faculties");
        const json = await res.json();
        setFacultyOptions([{ label: "ทั้งหมด", value: "" }, ...json]);
      } catch (e) {
        console.error("Load faculties failed", e);
      }
    })();
  }, []);

  useEffect(() => {
    // ถ้า user เปลี่ยนคณะ ให้ล้างสาขา
    if ((filters as any).departmentId) {
      onFilterChange({ ...filters, departmentId: "" as any });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [(filters as any).facultyId]);

  useEffect(() => {
    (async () => {
      try {
        const fid = (filters as any).facultyId;
        const qs = fid ? `?facultyId=${fid}` : "";
        const res = await fetch(
          `/api/admin/data-center/lookups/departments${qs}`
        );
        const json = await res.json();
        setDepartmentOptions([{ label: "ทั้งหมด", value: "" }, ...json]);
      } catch (e) {
        console.error("Load departments failed", e);
      }
    })();
  }, [(filters as any).facultyId]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!open) return;
      if (popRef.current && !popRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Reset filters when category changes
  useEffect(() => {
    setSelectedKeys(new Set());
    onFilterChange({ search: filters.search });
  }, [category]);

  // Update filter value
  const setFilter = <K extends keyof DataCenterFilter>(
    key: K,
    value: DataCenterFilter[K]
  ) => {
    onFilterChange({ ...filters, [key]: value });
  };

  // Toggle filter selection
  const toggleFilter = (key: keyof DataCenterFilter) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
        // Remove from filters
        const newFilters = { ...filters };
        delete newFilters[key];
        onFilterChange(newFilters);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Remove single chip
  const removeChip = (key: keyof DataCenterFilter) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
    const newFilters = { ...filters };
    delete newFilters[key];
    onFilterChange(newFilters);
  };

  // Clear all filters
  const clearAll = () => {
    setSelectedKeys(new Set());
    onFilterChange({ search: filters.search });
  };

  // Render value preview for chip
  const renderValuePreview = (def: FilterDef, value: any) => {
    if (value === undefined || value === "" || value === "ALL")
      return "ทั้งหมด";
    if (def.type === "boolean") return value ? "ใช่" : "ไม่";
    if (def.type === "date") return value;
    if (def.type === "select") {
      const hit = def.options?.find((o) => String(o.value) === String(value));
      return hit?.label ?? String(value);
    }
    return String(value);
  };

  return (
    <div className="bg-white border rounded-xl p-4 space-y-3">
      {/* Search + Filters Button */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            placeholder={
              category === "STUDENTS"
                ? "ค้นหา ชื่อ / รหัสนิสิต / อีเมล"
                : category === "CONSULTANTS"
                ? "ค้นหา ชื่อ / อีเมล"
                : category === "CATEGORIES"
                ? "ค้นหา รหัส / ชื่อประเภท"
                : "ค้นหา ชื่อ / รหัส / ผู้ให้คำปรึกษา"
            }
            className="bg-transparent outline-none text-sm w-full"
            value={filters.search ?? ""}
            onChange={(e) => setFilter("search", e.target.value)}
          />
        </div>

        {/* Filters Button */}
        <div className="relative flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpen((o) => !o)}
          >
            <SlidersHorizontal className="w-4 h-4 mr-1" />
            ตัวกรอง
            {activeFilters.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-indigo-100 text-indigo-700 rounded-full">
                {activeFilters.length}
              </span>
            )}
            <ChevronDown className="w-4 h-4 ml-1 opacity-70" />
          </Button>

          {onExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              disabled={isLoading}
            >
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
          )}

          {/* Popup */}
          {open && (
            <div
              ref={popRef}
              className="absolute top-full right-0 mt-2 w-[600px] max-w-[92vw] z-50 bg-white border shadow-xl rounded-2xl overflow-hidden"
              style={{ maxHeight: "70vh" }}
            >
              <div className="grid grid-cols-2">
                {/* Left: Filter List */}
                <div className="border-r bg-gray-50 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-semibold text-gray-800">
                      เลือกตัวกรอง
                    </div>
                    <button
                      className="p-1 rounded hover:bg-gray-200"
                      onClick={() => setOpen(false)}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1 max-h-[400px] overflow-auto">
                    {availableFilters.map((def) => {
                      const isSelected = selectedKeys.has(def.key);
                      return (
                        <button
                          key={String(def.key)}
                          onClick={() => toggleFilter(def.key)}
                          className={`
                            w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition
                            ${
                              isSelected
                                ? "bg-indigo-600 text-white border-indigo-600"
                                : "bg-white hover:bg-gray-50 border-gray-200"
                            }
                          `}
                        >
                          <span className="text-sm">{def.label}</span>
                          {isSelected && <Check className="w-4 h-4" />}
                        </button>
                      );
                    })}
                  </div>

                  {activeFilters.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearAll}
                        className="w-full"
                      >
                        ล้างตัวกรองทั้งหมด
                      </Button>
                    </div>
                  )}
                </div>

                {/* Right: Filter Values */}
                <div className="p-4">
                  <div className="text-sm font-semibold text-gray-800 mb-3">
                    ตั้งค่าตัวกรอง
                  </div>

                  {activeFilters.length === 0 ? (
                    <div className="text-sm text-gray-400 py-8 text-center">
                      เลือกตัวกรองจากด้านซ้าย
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[400px] overflow-auto">
                      {activeFilters.map((def) => (
                        <FilterValueRow
                          key={String(def.key)}
                          def={{
                            ...def,
                            options:
                              def.key === "facultyId"
                                ? facultyOptions
                                : def.key === "departmentId"
                                ? departmentOptions
                                : def.options,
                          }}
                          value={(filters as any)[def.key]}
                          onChange={(v) => setFilter(def.key as any, v)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-4 py-3 bg-gray-50 border-t flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  * ปรับค่าแล้วจะกรองให้อัตโนมัติ
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setOpen(false)}
                >
                  เสร็จสิ้น
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active Filter Chips */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((def) => {
            const value = (filters as any)[def.key];
            const preview = renderValuePreview(def, value);

            return (
              <div
                key={String(def.key)}
                className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-full px-3 py-1.5 text-xs"
              >
                <span className="font-medium text-indigo-800">
                  {def.label}:
                </span>
                <span className="text-indigo-600">{preview}</span>
                <button
                  className="p-0.5 hover:bg-indigo-100 rounded-full"
                  onClick={() => removeChip(def.key)}
                >
                  <X className="w-3.5 h-3.5 text-indigo-500" />
                </button>
              </div>
            );
          })}

          <button
            className="text-xs text-gray-500 hover:text-gray-700 underline"
            onClick={clearAll}
          >
            ล้างทั้งหมด
          </button>
        </div>
      )}
    </div>
  );
}

// ==============================
// Filter Value Row
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
  const normalizeSelect = (v: string) => {
    if (v === "") return "";
    if (/^\d+$/.test(v)) return Number(v);
    return v;
  };

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-gray-600">{def.label}</label>

      {def.type === "select" && (
        <select
          className="border rounded-xl px-3 py-2 text-sm w-full bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
          className="border rounded-xl px-3 py-2 text-sm w-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder={def.placeholder ?? ""}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {def.type === "numberMin" && (
        <input
          type="number"
          className="border rounded-xl px-3 py-2 text-sm w-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder={def.placeholder ?? "0"}
          value={value ?? ""}
          onChange={(e) =>
            onChange(e.target.value === "" ? undefined : Number(e.target.value))
          }
        />
      )}

      {def.type === "date" && (
        <input
          type="date"
          className="border rounded-xl px-3 py-2 text-sm w-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value || undefined)}
        />
      )}

      {def.type === "boolean" && (
        <label className="flex items-center gap-2 text-sm border rounded-xl px-3 py-2 cursor-pointer hover:bg-gray-50">
          <input
            type="checkbox"
            className="w-4 h-4 text-indigo-600 rounded"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
          />
          <span className="text-gray-800">เปิดใช้งาน</span>
        </label>
      )}
    </div>
  );
}
