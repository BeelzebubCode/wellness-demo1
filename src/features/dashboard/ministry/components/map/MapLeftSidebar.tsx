"use client";

import { Search, MapPin, Filter, ChevronDown, Building, Brain, X, RotateCcw, Zap, Layers } from "lucide-react";
import { useState, useMemo } from "react";
import { ProblemCategoryFilter } from "./ProblemCategoryFilter";

export type MapFilterState = {
  search: string;
  region: string;
  provinceNames: string[];
  type: string;
  stress: string;
  status: string;
  problemCategories: string[];
};

interface ProvinceOption {
  name: string;
  count: number;
}

// ─── Region Data ────────────────────────────────────────────────────────────
const REGIONS = [
  { value: "", label: "ทั้งหมด", emoji: "🇹🇭" },
  { value: "UPPER_NORTH", label: "เหนือตอนบน", emoji: "🏔️" },
  { value: "LOWER_NORTH", label: "เหนือตอนล่าง", emoji: "⛰️" },
  { value: "UPPER_NORTHEAST", label: "อีสานตอนบน", emoji: "🌾" },
  { value: "LOWER_NORTHEAST", label: "อีสานตอนล่าง", emoji: "🌿" },
  { value: "UPPER_CENTRAL", label: "กลางตอนบน", emoji: "🏙️" },
  { value: "LOWER_CENTRAL", label: "กลางตอนล่าง", emoji: "🏛️" },
  { value: "EAST", label: "ตะวันออก", emoji: "🌊" },
  { value: "UPPER_SOUTH", label: "ใต้ตอนบน", emoji: "🌴" },
  { value: "LOWER_SOUTH", label: "ใต้ตอนล่าง", emoji: "🏝️" },
];

// ─── Accordion Section ──────────────────────────────────────────────────────
function FilterSection({
  icon: Icon,
  title,
  badge,
  defaultOpen = true,
  children,
}: {
  icon: any;
  title: string;
  badge?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100/80 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50/50 transition-colors group"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
            <Icon className="w-3 h-3 text-primary" />
          </div>
          <span className="text-xs font-bold text-gray-700 tracking-wide">{title}</span>
          {badge}
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-200 ease-in-out ${open ? "max-h-[500px] opacity-100 pb-3" : "max-h-0 opacity-0"}`}>
        <div className="px-5">{children}</div>
      </div>
    </div>
  );
}

// ─── Status Pill ────────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: "", label: "ทั้งหมด", color: "bg-gray-100 text-gray-600 border-gray-200", dot: "bg-gray-400" },
  { value: "COMPLETED", label: "สำเร็จ", color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  { value: "CANCELLED", label: "ยกเลิก", color: "bg-rose-50 text-rose-700 border-rose-200", dot: "bg-rose-500" },
];

// ─── Main Component ─────────────────────────────────────────────────────────
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
  const [provinceSearch, setProvinceSearch] = useState("");

  const activeFilterCount = [
    filter.search,
    filter.region,
    filter.provinceNames.length > 0,
    filter.type,
    filter.stress,
    filter.status,
    (filter.problemCategories || []).length > 0,
  ].filter(Boolean).length;

  const resetAll = () =>
    onChange({ search: "", region: "", provinceNames: [], type: "", stress: "", status: "", problemCategories: [] });

  const filteredProvinces = useMemo(() => {
    if (!provinceSearch) return availableProvinces;
    const q = provinceSearch.toLowerCase();
    return availableProvinces.filter((p) => p.name.toLowerCase().includes(q));
  }, [availableProvinces, provinceSearch]);

  const selectedRegionLabel = REGIONS.find((r) => r.value === filter.region)?.label ?? "ทั้งหมด";

  return (
    <div className="h-full flex flex-col bg-white/95 backdrop-blur-sm">
      {/* ── Branded Header ─────────────────────────────────────── */}
      <div className="px-5 pt-5 pb-4 bg-gradient-to-br from-slate-900 via-slate-800 to-primary/90 text-white relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/5" />
        <div className="absolute right-8 bottom-0 w-16 h-16 rounded-full bg-primary/20" />

        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
                <Filter className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black tracking-tight">ตัวกรองข้อมูล</h3>
                <p className="text-[10px] text-white/60 font-medium">National Command Center</p>
              </div>
            </div>
            {activeFilterCount > 0 && (
              <button
                onClick={resetAll}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur text-[10px] font-bold transition-all group"
              >
                <RotateCcw className="w-3 h-3 group-hover:rotate-[-180deg] transition-transform duration-500" />
                ล้าง ({activeFilterCount})
              </button>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2.5 bg-white/10 backdrop-blur border border-white/10 rounded-xl text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/25 focus:bg-white/15 transition-all"
              placeholder="🔍 ค้นหามหาวิทยาลัย..."
              value={filter.search}
              onChange={(e) => onChange({ ...filter, search: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* ── Active Filters Strip ─────────────────────────────── */}
      {activeFilterCount > 0 && (
        <div className="px-5 py-2 bg-primary/5 border-b border-primary/10 flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-primary/60 font-bold uppercase">กำลังกรอง:</span>
          {filter.region && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
              {selectedRegionLabel}
              <button onClick={() => onChange({ ...filter, region: "", provinceNames: [] })} className="hover:text-rose-500 ml-0.5">
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          )}
          {filter.provinceNames.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
              {filter.provinceNames.length} จังหวัด
              <button onClick={() => onChange({ ...filter, provinceNames: [] })} className="hover:text-rose-500 ml-0.5">
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          )}
          {filter.status && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">
              {STATUS_OPTIONS.find((s) => s.value === filter.status)?.label}
              <button onClick={() => onChange({ ...filter, status: "" })} className="hover:text-rose-500 ml-0.5">
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          )}
          {(filter.problemCategories?.length ?? 0) > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-bold">
              {filter.problemCategories.length} ปัญหา
              <button onClick={() => onChange({ ...filter, problemCategories: [] })} className="hover:text-rose-500 ml-0.5">
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* ── Filter Sections ──────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">

        {/* ── Region ─────────────────────────────────────────── */}
        <FilterSection
          icon={MapPin}
          title="ภูมิภาค"
          badge={
            filter.region ? (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary text-white text-[9px] font-bold leading-none">
                {selectedRegionLabel}
              </span>
            ) : undefined
          }
        >
          <div className="grid grid-cols-2 gap-1">
            {REGIONS.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => onChange({ ...filter, region: r.value, provinceNames: [] })}
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-[11px] font-semibold transition-all border ${filter.region === r.value
                  ? "bg-primary text-white border-primary shadow-sm shadow-primary/25 scale-[0.98]"
                  : "bg-white text-gray-600 border-gray-100 hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                  }`}
              >
                <span className="text-sm leading-none">{r.emoji}</span>
                <span className="truncate">{r.label}</span>
              </button>
            ))}
          </div>

          {/* Special Zones */}
          <button
            type="button"
            onClick={() => onChange({ ...filter, region: "SPECIAL_ADMIN", provinceNames: [] })}
            className={`mt-2 w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[11px] font-bold transition-all border-2 ${filter.region === "SPECIAL_ADMIN"
              ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-500 shadow-lg shadow-amber-500/25"
              : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:border-amber-300 hover:shadow-md"
              }`}
          >
            <span className="text-base">🏛️</span>
            เขตปกครองพิเศษ
            {specialZoneNames.length > 0 && (
              <span className={`text-[9px] ${filter.region === "SPECIAL_ADMIN" ? "text-white/70" : "text-amber-500"}`}>
                ({specialZoneNames.length})
              </span>
            )}
          </button>
        </FilterSection>

        {/* ── Province ───────────────────────────────────────── */}
        {availableProvinces.length > 0 && (
          <FilterSection
            icon={Building}
            title="จังหวัด"
            badge={
              filter.provinceNames.length > 0 ? (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-blue-500 text-white text-[9px] font-bold leading-none">
                  {filter.provinceNames.length}
                </span>
              ) : undefined
            }
            defaultOpen={!!filter.region}
          >
            {/* Search */}
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
              <input
                type="text"
                className="w-full pl-7 pr-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-[11px] focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all placeholder:text-gray-400"
                placeholder="ค้นหาจังหวัด..."
                value={provinceSearch}
                onChange={(e) => setProvinceSearch(e.target.value)}
              />
            </div>

            {/* Province List */}
            <div className="max-h-[160px] overflow-y-auto custom-scrollbar rounded-xl bg-gray-50/50 border border-gray-100 p-1 space-y-0.5">
              {/* All button */}
              <button
                type="button"
                onClick={() => onChange({ ...filter, provinceNames: [] })}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[11px] font-semibold transition-all ${filter.provinceNames.length === 0
                  ? "bg-white text-primary shadow-sm border border-primary/20"
                  : "text-gray-500 hover:bg-white"
                  }`}
              >
                <span>🇹🇭 ทั้งหมด</span>
                <span className="text-[9px] text-gray-400 tabular-nums">{availableProvinces.reduce((s, p) => s + p.count, 0)}</span>
              </button>

              {filteredProvinces.map((p) => {
                const isSelected = filter.provinceNames.includes(p.name);
                return (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => {
                      const next = isSelected ? filter.provinceNames.filter((n) => n !== p.name) : [...filter.provinceNames, p.name];
                      onChange({ ...filter, provinceNames: next });
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[11px] font-medium transition-all ${isSelected ? "bg-primary text-white shadow-sm" : "text-gray-600 hover:bg-white hover:shadow-sm"
                      }`}
                  >
                    <span className="truncate">{p.name}</span>
                    <span className={`text-[9px] tabular-nums ${isSelected ? "text-white/70" : "text-gray-400"}`}>{p.count}</span>
                  </button>
                );
              })}
              {filteredProvinces.length === 0 && <p className="text-[10px] text-gray-400 text-center py-3">ไม่พบจังหวัด</p>}
            </div>
          </FilterSection>
        )}

        {/* ── Booking Status ─────────────────────────────────── */}
        <FilterSection icon={Zap} title="สถานะการจอง">
          <div className="flex gap-1.5">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => onChange({ ...filter, status: s.value })}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl text-[11px] font-bold transition-all border ${filter.status === s.value
                  ? `${s.color} border-current shadow-sm scale-[0.98]`
                  : "bg-white text-gray-500 border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                  }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${filter.status === s.value ? s.dot : "bg-gray-300"}`} />
                {s.label}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* ── Problem Category ────────────────────────────────── */}
        <FilterSection
          icon={Brain}
          title="ประเภทปัญหา"
          badge={
            (filter.problemCategories?.length ?? 0) > 0 ? (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-violet-500 text-white text-[9px] font-bold leading-none">
                {filter.problemCategories.length}
              </span>
            ) : undefined
          }
        >
          <ProblemCategoryFilter
            selected={filter.problemCategories}
            onChange={(codes) => onChange({ ...filter, problemCategories: codes })}
          />
        </FilterSection>

        {/* ── Advanced Filters ────────────────────────────────── */}
        <FilterSection icon={Layers} title="ตัวกรองเพิ่มเติม" defaultOpen={false}>
          {/* Institution Type */}
          <div className="mb-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">ประเภทสถาบัน</p>
            <div className="grid grid-cols-2 gap-1">
              {[
                { value: "", label: "ทั้งหมด" },
                { value: "PUBLIC", label: "🏫 รัฐ" },
                { value: "PRIVATE", label: "🏢 เอกชน" },
                { value: "SUPERVISED", label: "🎓 ในกำกับ" },
              ].map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => onChange({ ...filter, type: t.value })}
                  className={`px-2 py-2 rounded-lg text-[11px] font-semibold transition-all border ${filter.type === t.value
                    ? "bg-primary text-white border-primary shadow-sm"
                    : "bg-white text-gray-600 border-gray-100 hover:border-primary/30 hover:bg-primary/5"
                    }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>


        </FilterSection>
      </div>

      {/* ── Footer ───────────────────────────────────────────── */}
      <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
        <p className="text-[10px] text-gray-400 text-center font-medium">
          NU Wellness • National Command Center
        </p>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
      `}</style>
    </div>
  );
}
