"use client";

import { Search, MapPin, Filter, ChevronDown, Building } from "lucide-react";
import { useState, useMemo } from "react";
import { ProblemCategoryFilter } from "./ProblemCategoryFilter";

export type MapFilterState = {
  search: string;
  region: string;
  provinceNames: string[];  // Multi-select provinces by name
  type: string;
  stress: string;
  status: string;
  problemCategories: string[];
};

// Province options type  
interface ProvinceOption {
  name: string;
  count: number; // number of universities
}

export function MapLeftSidebar({
  filter,
  onChange,
  availableProvinces = [],
  specialZoneNames = [],
}: {
  filter: MapFilterState;
  onChange: (v: MapFilterState) => void;
  availableProvinces?: ProvinceOption[];
  specialZoneNames?: string[];
}) {
  const handleFilterChange = (v: MapFilterState) => {
    onChange(v);
  };

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [provinceSearch, setProvinceSearch] = useState("");

  const activeFilterCount = [
    filter.search,
    filter.region,
    filter.provinceNames.length > 0,
    filter.type,
    filter.stress,
    filter.status,
    (filter.problemCategories || []).length > 0
  ].filter(Boolean).length;

  // Filter province options by search text
  const filteredProvinces = useMemo(() => {
    if (!provinceSearch) return availableProvinces;
    const q = provinceSearch.toLowerCase();
    return availableProvinces.filter(p => p.name.toLowerCase().includes(q));
  }, [availableProvinces, provinceSearch]);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-gray-900 tracking-tight">ตัวกรอง</h3>
          </div>
          {activeFilterCount > 0 && (
            <button
              onClick={() => handleFilterChange({ search: "", region: "", provinceNames: [], type: "", stress: "", status: "", problemCategories: [] })}
              className="text-[10px] xl:text-xs font-semibold text-primary hover:text-primary/80 transition-colors bg-primary/5 px-2 py-1 rounded-md"
            >
              ล้างทั้งหมด ({activeFilterCount})
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border-0 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all placeholder:text-gray-400"
            placeholder="ค้นหามหาวิทยาลัย..."
            value={filter.search}
            onChange={(e) => onChange({ ...filter, search: e.target.value })}
          />
        </div>
      </div>

      {/* Filters Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* Region Filter */}
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
                type="button"
                onClick={() => handleFilterChange({ ...filter, region: r.value, provinceNames: [] })}
                className={`px-2 py-2 rounded-md text-[10px] xl:text-xs font-medium transition-all border ${filter.region === r.value
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "bg-white text-gray-600 hover:bg-gray-50 border-gray-200"
                  }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          {/* Special Administrative Zones — separated */}
          <button
            type="button"
            onClick={() => handleFilterChange({ ...filter, region: "SPECIAL_ADMIN", provinceNames: [] })}
            className={`mt-2 w-full px-3 py-2.5 rounded-lg text-[10px] xl:text-xs font-bold transition-all border-2 flex items-center justify-center gap-1.5 ${filter.region === "SPECIAL_ADMIN"
              ? "bg-amber-500 text-white border-amber-500 shadow-md"
              : "bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200"
              }`}
          >
            🏛️ เขตปกครองพิเศษ
            {specialZoneNames.length > 0 && (
              <span className={`text-[9px] ${filter.region === "SPECIAL_ADMIN" ? "text-white/80" : "text-amber-500"}`}>
                ({specialZoneNames.join(", ")})
              </span>
            )}
          </button>
        </div>

        {/* Province Filter */}
        {availableProvinces.length > 0 && (
          <div>
            <label className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
              <Building className="w-3 h-3" />
              จังหวัด / เขตปกครองพิเศษ
              {filter.provinceNames.length > 0 && (
                <span className="ml-auto text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold">
                  {filter.provinceNames.length} เลือก
                </span>
              )}
            </label>

            {/* Province search */}
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
              <input
                type="text"
                className="w-full pl-7 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-[11px] focus:outline-none focus:ring-1 focus:ring-primary transition-all placeholder:text-gray-400"
                placeholder="ค้นหาจังหวัด..."
                value={provinceSearch}
                onChange={(e) => setProvinceSearch(e.target.value)}
              />
            </div>

            {/* Province chips — scrollable */}
            <div className="max-h-[140px] overflow-y-auto rounded-lg border border-gray-100 p-1.5 space-y-0.5">
              {/* "ทั้งหมด" option */}
              <button
                type="button"
                onClick={() => handleFilterChange({ ...filter, provinceNames: [] })}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-[10px] xl:text-[11px] font-medium transition-all ${filter.provinceNames.length === 0
                  ? "bg-primary/10 text-primary font-bold"
                  : "text-gray-500 hover:bg-gray-50"
                  }`}
              >
                <span>ทั้งหมด</span>
                <span className="text-[9px] text-gray-400">{availableProvinces.reduce((s, p) => s + p.count, 0)} แห่ง</span>
              </button>

              {filteredProvinces.map((p) => {
                const isSelected = filter.provinceNames.includes(p.name);
                return (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => {
                      const next = isSelected
                        ? filter.provinceNames.filter(n => n !== p.name)
                        : [...filter.provinceNames, p.name];
                      handleFilterChange({ ...filter, provinceNames: next });
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-[10px] xl:text-[11px] font-medium transition-all ${isSelected
                      ? "bg-primary text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-50"
                      }`}
                  >
                    <span className="truncate">{p.name}</span>
                    <span className={`text-[9px] ${isSelected ? "text-white/80" : "text-gray-400"}`}>
                      {p.count} แห่ง
                    </span>
                  </button>
                );
              })}

              {filteredProvinces.length === 0 && (
                <p className="text-[10px] text-gray-400 text-center py-2">ไม่พบจังหวัด</p>
              )}
            </div>
          </div>
        )}

        {/* Problem Category Filter */}
        <div>
          <ProblemCategoryFilter
            selected={filter.problemCategories}
            onChange={(codes) => handleFilterChange({ ...filter, problemCategories: codes })}
          />
        </div>

        {/* Status Filter */}
        <div>
          <label className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
            <Filter className="w-3 h-3" />
            สถานะการจอง
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { value: "", label: "ทั้งหมด" },
              { value: "COMPLETED", label: "สำเร็จ" },
              { value: "CANCELLED", label: "ยกเลิก" },
            ].map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => handleFilterChange({ ...filter, status: s.value })}
                className={`px-2 py-2 rounded-md text-[10px] xl:text-xs font-medium transition-all border ${filter.status === s.value
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "bg-white text-gray-600 hover:bg-gray-50 border-gray-200"
                  }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Filters Toggle */}
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

        {/* Advanced Filters */}
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
                  { value: "SUPERVISED", label: "ในกำกับ (อิสระ)" },
                ].map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => handleFilterChange({ ...filter, type: t.value })}
                    className={`px-2 py-2 rounded-md text-[10px] xl:text-xs font-medium transition-all border ${filter.type === t.value
                      ? "bg-primary text-white border-primary shadow-sm"
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
                    type="button"
                    onClick={() => handleFilterChange({ ...filter, stress: s.value })}
                    className={`px-2 py-2 rounded-md text-[10px] xl:text-xs font-medium transition-all border ${filter.stress === s.value
                      ? "bg-primary text-white border-primary shadow-sm"
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
