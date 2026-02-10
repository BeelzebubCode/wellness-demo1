"use client";

import { Search, MapPin, Filter, ChevronDown } from "lucide-react";
import { useState } from "react";
import { ProblemCategoryFilter } from "./ProblemCategoryFilter";

export type MapFilterState = {
  search: string;
  region: string;
  type: string;
  stress: string;
  problemCategories: string[]; // 🔥 Changed to array for multi-select
};

export function MapLeftSidebar({
  filter,
  onChange,
}: {
  filter: MapFilterState;
  onChange: (v: MapFilterState) => void;
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const activeFilterCount = [
    filter.search,
    filter.region,
    filter.type,
    filter.stress,
    (filter.problemCategories || []).length > 0
  ].filter(Boolean).length;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header - Thai + Minimal */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-gray-900 tracking-tight">ตัวกรอง</h3>
          {activeFilterCount > 0 && (
            <button
              onClick={() => onChange({ search: "", region: "", type: "", stress: "", problemCategories: [] })}
              className="text-[10px] xl:text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
            >
              ล้าง ({activeFilterCount})
            </button>
          )}
        </div>

        {/* Search Input - Thai placeholder */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border-0 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 transition-all placeholder:text-gray-400"
            placeholder="ค้นหามหาวิทยาลัย..."
            value={filter.search}
            onChange={(e) => onChange({ ...filter, search: e.target.value })}
          />
        </div>
      </div>

      {/* Filters Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* Region Filter - Exact DB Names */}
        <div>
          <label className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
            <MapPin className="w-3 h-3" />
            ภูมิภาค
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { value: "", label: "ทั้งหมด" },
              { value: "UPPER_NORTH", label: "เหนือตอนบน" },
              { value: "LOWER_NORTH", label: "เหนือตอนล่าง" },
              { value: "UPPER_NORTHEAST", label: "อีสานตอนบน" },
              { value: "LOWER_NORTHEAST", label: "อีสานตอนล่าง" },
              { value: "UPPER_CENTRAL", label: "กลางตอนบน" },
              { value: "LOWER_CENTRAL", label: "กลางตอนล่าง" },
              { value: "EAST", label: "ตะวันออก" },
              { value: "UPPER_SOUTH", label: "ใต้ตอนบน" },
              { value: "LOWER_SOUTH", label: "ใต้ตอนล่าง" },
            ].map((r) => (
              <button
                key={r.value}
                onClick={() => onChange({ ...filter, region: r.value })}
                className={`px-2 py-2 rounded-md text-[10px] xl:text-xs font-medium transition-all border ${filter.region === r.value
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-600 hover:bg-gray-50 border-gray-200"
                  }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Problem Category Filter - Multi-select */}
        <div>
          <ProblemCategoryFilter
            selected={filter.problemCategories}
            onChange={(codes) => onChange({ ...filter, problemCategories: codes })}
          />
        </div>

        {/* Advanced Filters Toggle - Thai */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between py-1 text-[10px] xl:text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors border-t border-gray-100 pt-4 uppercase tracking-wider"
        >
          <span className="flex items-center gap-1.5">
            <Filter className="w-3 h-3" />
            ตัวกรองเพิ่มเติม
          </span>
          <ChevronDown className={`w-3 h-3 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
        </button>

        {/* Advanced Filters - Thai */}
        {showAdvanced && (
          <div className="space-y-3 pt-0">
            {/* Institution Type */}
            <div>
              <label className="text-xs font-bold text-gray-500 mb-2 block uppercase tracking-wider">
                ประเภทสถาบัน
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { value: "", label: "ทั้งหมด" },
                  { value: "PUBLIC", label: "รัฐ" },
                  { value: "PRIVATE", label: "เอกชน" },
                  { value: "AUTONOMOUS", label: "อิสระ" },
                ].map((t) => (
                  <button
                    key={t.value}
                    onClick={() => onChange({ ...filter, type: t.value })}
                    className={`px-2 py-2 rounded-md text-[10px] xl:text-xs font-medium transition-all border ${filter.type === t.value
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-600 hover:bg-gray-50 border-gray-200"
                      }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority Level */}
            <div>
              <label className="text-xs font-bold text-gray-500 mb-2 block uppercase tracking-wider">
                ระดับความเร่งด่วน
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { value: "", label: "ทั้งหมด" },
                  { value: "HIGH", label: "สูง" },
                  { value: "MEDIUM", label: "ปานกลาง" },
                  { value: "LOW", label: "ต่ำ" },
                ].map((s) => (
                  <button
                    key={s.value}
                    onClick={() => onChange({ ...filter, stress: s.value })}
                    className={`px-2 py-2 rounded-md text-[10px] xl:text-xs font-medium transition-all border ${filter.stress === s.value
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-600 hover:bg-gray-50 border-gray-200"
                      }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
