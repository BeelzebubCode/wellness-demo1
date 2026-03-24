"use client";

import { Search, MapPin, Filter, ChevronDown, Building, Brain, X, RotateCcw, Zap, Layers, Clock, Sun, CloudRain, Snowflake, BookOpen, Calendar, Monitor, Globe } from "lucide-react";
import { useState, useMemo, useCallback, useEffect } from "react";
import { ProblemCategoryFilter } from "./ProblemCategoryFilter";
import type { BorrowAnalytics } from "./BorrowingOverlay";

export type MapFilterState = {
  search: string;
  region: string;
  provinceNames: string[];
  type: string;
  stress: string;
  status: string;
  problemCategories: string[];
  serviceModes: string[];
  nationality: string;
};

interface ProvinceOption {
  name: string;
  count: number;
}

// ─── Region Data (loaded dynamically from DB) ───────────────────────────────
type RegionOption = {
  region_id: number;
  region_code: string;
  region_name_th: string;
  region_name_en: string | null;
};
type SpecialZoneProvince = {
  province_id: number;
  province_name_th: string;
  province_name_en: string | null;
  province_code: string;
};

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

// ─── Thai Month Names ───────────────────────────────────────────────────────
const THAI_MONTHS: Record<number, string> = {
  1: "ม.ค.", 2: "ก.พ.", 3: "มี.ค.", 4: "เม.ย.", 5: "พ.ค.", 6: "มิ.ย.",
  7: "ก.ค.", 8: "ส.ค.", 9: "ก.ย.", 10: "ต.ค.", 11: "พ.ย.", 12: "ธ.ค.",
};

// ─── Season/Term date calculation ────────────────────────────────────────────
function seasonToDateRange(mStart: number, mEnd: number, year: number) {
  const ce = year - 543;
  if (mEnd >= mStart) {
    return { from: new Date(ce, mStart - 1, 1).toISOString(), to: new Date(ce, mEnd, 0, 23, 59, 59).toISOString() };
  }
  return { from: new Date(ce, mStart - 1, 1).toISOString(), to: new Date(ce + 1, mEnd, 0, 23, 59, 59).toISOString() };
}
function termToDateRange(code: string, year: number) {
  const ce = year - 543;
  switch (code) {
    case "SEMESTER_1": return { from: new Date(ce, 5, 1).toISOString(), to: new Date(ce, 9, 31, 23, 59, 59).toISOString() };
    case "SEMESTER_2": return { from: new Date(ce, 10, 1).toISOString(), to: new Date(ce + 1, 2, 31, 23, 59, 59).toISOString() };
    case "SUMMER": return { from: new Date(ce + 1, 3, 1).toISOString(), to: new Date(ce + 1, 5, 30, 23, 59, 59).toISOString() };
    default: return { from: new Date(ce, 0, 1).toISOString(), to: new Date(ce + 1, 0, 0, 23, 59, 59).toISOString() };
  }
}

// ─── Time Filter Section ─────────────────────────────────────────────────────
type TimeMode = "all" | "season" | "term" | "custom";
const SEASON_VISUAL: Record<string, { icon: React.ReactNode; gradient: string; emoji: string }> = {
  HOT: { icon: <Sun className="w-3.5 h-3.5" />, gradient: "from-orange-500 to-amber-400", emoji: "☀️" },
  RAIN: { icon: <CloudRain className="w-3.5 h-3.5" />, gradient: "from-blue-500 to-sky-400", emoji: "🌧️" },
  COOL: { icon: <Snowflake className="w-3.5 h-3.5" />, gradient: "from-cyan-500 to-teal-400", emoji: "❄️" },
};

function TimeFilterSection({
  dateFrom, dateTo, onDateChange, filters, onTimeFilterLabel,
}: {
  dateFrom?: string; dateTo?: string;
  onDateChange: (from?: string, to?: string) => void;
  filters?: BorrowAnalytics["filters"];
  onTimeFilterLabel?: (label: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const [mode, setMode] = useState<TimeMode>("all");
  const [selectedSeason, setSelectedSeason] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState(2568);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  // Fetch filter options from dedicated endpoint when not provided via props
  const [localFilters, setLocalFilters] = useState<BorrowAnalytics["filters"]>();
  useEffect(() => {
    if (filters) return;
    fetch("/api/v2/master/time-filters")
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setLocalFilters({ seasons: d.seasons, termTypes: d.termTypes, academicYears: d.academicYears });
          if (d.academicYears?.length > 0) setSelectedYear(d.academicYears[0]);
        }
      })
      .catch(() => {});
  }, [filters]);

  const activeFilters = filters ?? localFilters;
  const years = activeFilters?.academicYears || [];
  const seasons = activeFilters?.seasons || [];
  const termTypes = activeFilters?.termTypes || [];

  const isActive = mode !== "all";

  const handleMode = useCallback((m: TimeMode) => {
    setMode(m);
    if (m === "all") { onDateChange(undefined, undefined); setSelectedSeason(""); setSelectedTerm(""); onTimeFilterLabel?.(""); }
  }, [onDateChange, onTimeFilterLabel]);

  const handleSeason = useCallback((code: string) => {
    setSelectedSeason(code);
    const s = seasons.find((x) => x.season_code === code);
    if (s) {
      const r = seasonToDateRange(s.month_start, s.month_end, selectedYear);
      onDateChange(r.from, r.to);
      const vis = SEASON_VISUAL[code];
      onTimeFilterLabel?.(`${vis?.emoji || '🌦️'} ${s.season_name_th || code} ${selectedYear}`);
    }
  }, [seasons, selectedYear, onDateChange, onTimeFilterLabel]);

  const handleTerm = useCallback((code: string) => {
    setSelectedTerm(code);
    const r = termToDateRange(code, selectedYear);
    onDateChange(r.from, r.to);
    const t = termTypes.find((x) => x.code === code);
    onTimeFilterLabel?.(`📅 ${t?.name_th || code} ${selectedYear}`);
  }, [selectedYear, onDateChange, termTypes, onTimeFilterLabel]);

  const handleYear = useCallback((y: number) => {
    setSelectedYear(y);
    if (mode === "season" && selectedSeason) {
      const s = seasons.find((x) => x.season_code === selectedSeason);
      if (s) { const r = seasonToDateRange(s.month_start, s.month_end, y); onDateChange(r.from, r.to); }
    } else if (mode === "term" && selectedTerm) {
      const r = termToDateRange(selectedTerm, y);
      onDateChange(r.from, r.to);
    }
  }, [mode, selectedSeason, selectedTerm, seasons, onDateChange]);

  return (
    <div className="border-b border-gray-100/80">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50/50 transition-colors group"
      >
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isActive ? "bg-gradient-to-br from-indigo-500 to-purple-500" : "bg-gradient-to-br from-primary/10 to-primary/5"}`}>
            <Clock className={`w-3 h-3 ${isActive ? "text-white" : "text-primary"}`} />
          </div>
          <span className="text-xs font-bold text-gray-700 tracking-wide">ช่วงเวลา</span>
          {isActive && (
            <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-[9px] font-black rounded-full">กรองอยู่</span>
          )}
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      <div className={`overflow-hidden transition-all duration-200 ease-in-out ${open ? "max-h-[600px] opacity-100 pb-3" : "max-h-0 opacity-0"}`}>
        <div className="px-4">
          {/* Mode tabs */}
          <div className="grid grid-cols-4 gap-0.5 bg-gray-100/80 rounded-lg p-0.5 mb-3">
            {([
              { key: "all" as const, label: "ทั้งหมด", icon: "📊" },
              { key: "season" as const, label: "ฤดูกาล", icon: "🌦️" },
              { key: "term" as const, label: "เทอม", icon: "📅" },
              { key: "custom" as const, label: "กำหนด", icon: "📆" },
            ]).map((t) => (
              <button
                key={t.key}
                onClick={() => handleMode(t.key)}
                className={`px-1 py-1.5 rounded-md text-[10px] font-bold transition-all text-center ${mode === t.key
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
                  }`}
              >
                <span className="block text-xs mb-0.5">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>

          {/* Year selector */}
          {(mode === "season" || mode === "term") && (
            <div className="mb-3">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">ปีการศึกษา</p>
              <div className="flex gap-1 flex-wrap">
                {years.slice(0, 5).map((y) => (
                  <button
                    key={y}
                    onClick={() => handleYear(y)}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all ${selectedYear === y
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-100"
                      }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Season cards */}
          {mode === "season" && (
            <div className="space-y-1.5">
              {seasons.map((s) => {
                const vis = SEASON_VISUAL[s.season_code] || SEASON_VISUAL.HOT;
                const isActive = selectedSeason === s.season_code;
                return (
                  <button
                    key={s.season_code}
                    onClick={() => handleSeason(s.season_code)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${isActive
                      ? `bg-gradient-to-r ${vis.gradient} text-white shadow-lg shadow-${s.season_code === "HOT" ? "orange" : s.season_code === "RAIN" ? "blue" : "cyan"}-200/50`
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100"
                      }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? "bg-white/20" : "bg-white"}`}>
                      <span className="text-sm">{vis.emoji}</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-[11px] font-bold">{s.season_name_th}</div>
                      <div className={`text-[9px] ${isActive ? "text-white/70" : "text-gray-400"}`}>
                        {THAI_MONTHS[s.month_start]} – {THAI_MONTHS[s.month_end]}
                      </div>
                    </div>
                    {isActive && <div className="w-2 h-2 rounded-full bg-white" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Term buttons */}
          {mode === "term" && (
            <div className="space-y-1.5">
              {termTypes.map((t) => (
                <button
                  key={t.code}
                  onClick={() => handleTerm(t.code)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${selectedTerm === t.code
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200/50"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100"
                    }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedTerm === t.code ? "bg-white/20" : "bg-white"}`}>
                    <BookOpen className={`w-4 h-4 ${selectedTerm === t.code ? "text-white" : "text-indigo-500"}`} />
                  </div>
                  <span className="text-[11px] font-bold">{t.name_th}</span>
                  {selectedTerm === t.code && <div className="w-2 h-2 rounded-full bg-white ml-auto" />}
                </button>
              ))}
            </div>
          )}

          {/* Custom date picker */}
          {mode === "custom" && (
            <div className="space-y-2">
              <div>
                <label className="text-[9px] font-bold text-gray-400 block mb-1">ตั้งแต่วันที่</label>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="w-full px-3 py-2 text-[11px] border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none bg-white"
                />
              </div>
              <div>
                <label className="text-[9px] font-bold text-gray-400 block mb-1">ถึงวันที่</label>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="w-full px-3 py-2 text-[11px] border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none bg-white"
                />
              </div>
              <button
                onClick={() => {
                  if (customFrom && customTo) {
                    onDateChange(new Date(customFrom).toISOString(), new Date(customTo + "T23:59:59").toISOString());
                  }
                }}
                disabled={!customFrom || !customTo}
                className="w-full py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[11px] font-bold rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                🔍 ค้นหา
              </button>
            </div>
          )}

          {/* Active filter indicator */}
          {mode !== "all" && dateFrom && (
            <div className="mt-3 flex items-center justify-between bg-indigo-50 rounded-lg px-3 py-2">
              <span className="text-[9px] text-indigo-600 font-medium">
                📅 {new Date(dateFrom).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })}
                {" → "}
                {dateTo ? new Date(dateTo).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" }) : "ปัจจุบัน"}
              </span>
              <button onClick={() => handleMode("all")} className="text-[9px] text-indigo-600 font-bold hover:text-indigo-800">
                ✕ ล้าง
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Service Mode Filter (dynamic from DB) ──────────────────────────────────
type ServiceModeOption = {
  service_mode_id: number;
  code: string;
  name_th: string;
  name_en: string;
  sort_order: number;
};

function ServiceModeFilter({ selected, onChange }: { selected: string[]; onChange: (codes: string[]) => void }) {
  const [modes, setModes] = useState<ServiceModeOption[]>([]);

  useEffect(() => {
    fetch("/api/v2/master/service-modes", { cache: "no-store" })
      .then(r => r.json())
      .then(j => { if (j.success) setModes(j.data ?? []); })
      .catch(() => { });
  }, []);

  if (modes.length === 0) return null;

  const toggle = (code: string) => {
    onChange(
      selected.includes(code)
        ? selected.filter(c => c !== code)
        : [...selected, code]
    );
  };

  return (
    <FilterSection
      icon={Monitor}
      title="ประเภทการเข้ารับ"
      badge={
        selected.length > 0 ? (
          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-teal-500 text-white text-[9px] font-bold leading-none">
            {selected.length}
          </span>
        ) : undefined
      }
    >
      <div className="grid grid-cols-2 gap-1">
        {modes.map(m => {
          const active = selected.includes(m.code);
          return (
            <button
              key={m.code}
              type="button"
              onClick={() => toggle(m.code)}
              className={`px-2 py-2.5 rounded-xl text-[11px] font-semibold transition-all border ${active
                ? "bg-teal-50 text-teal-700 border-teal-300 shadow-sm"
                : "bg-white text-gray-600 border-gray-100 hover:border-teal-200 hover:bg-teal-50/50"
                }`}
            >
              {m.name_th}
            </button>
          );
        })}
      </div>
    </FilterSection>
  );
}

// ─── Dynamic Region Filter ──────────────────────────────────────────────────
function RegionFilter({
  selectedRegion,
  onSelectRegion,
  specialZoneNames,
}: {
  selectedRegion: string;
  onSelectRegion: (regionCode: string) => void;
  specialZoneNames: string[];
}) {
  const [regions, setRegions] = useState<RegionOption[]>([]);
  const [dbSpecialZones, setDbSpecialZones] = useState<SpecialZoneProvince[]>([]);

  useEffect(() => {
    fetch("/api/v2/master/regions", { cache: "no-store" })
      .then(r => r.json())
      .then(j => {
        if (j.success) {
          setRegions(j.data?.regions ?? []);
          setDbSpecialZones(j.data?.specialZoneProvinces ?? []);
        }
      })
      .catch(() => { });
  }, []);

  const szCount = dbSpecialZones.length || specialZoneNames.length;

  return (
    <>
      <div className="grid grid-cols-2 gap-1">
        {/* "ทั้งหมด" button */}
        <button
          type="button"
          onClick={() => onSelectRegion("")}
          className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-[11px] font-semibold transition-all border col-span-2 justify-center ${selectedRegion === ""
            ? "bg-primary text-white border-primary shadow-sm shadow-primary/25 scale-[0.98]"
            : "bg-white text-gray-600 border-gray-100 hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
            }`}
        >
          ทั้งหมด
        </button>

        {regions.map((r) => (
          <button
            key={r.region_code}
            type="button"
            onClick={() => onSelectRegion(r.region_code)}
            className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-[11px] font-semibold transition-all border ${selectedRegion === r.region_code
              ? "bg-primary text-white border-primary shadow-sm shadow-primary/25 scale-[0.98]"
              : "bg-white text-gray-600 border-gray-100 hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
              }`}
          >
            <span className="truncate">{r.region_name_th}</span>
          </button>
        ))}
      </div>

      {/* Special Zones */}
      <button
        type="button"
        onClick={() => onSelectRegion("SPECIAL_ADMIN")}
        className={`mt-2 w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[11px] font-bold transition-all border-2 ${selectedRegion === "SPECIAL_ADMIN"
          ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-500 shadow-lg shadow-amber-500/25"
          : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:border-amber-300 hover:shadow-md"
          }`}
      >
        เขตปกครองพิเศษ
        {szCount > 0 && (
          <span className={`text-[9px] ${selectedRegion === "SPECIAL_ADMIN" ? "text-white/70" : "text-amber-500"}`}>
            ({szCount})
          </span>
        )}
      </button>
    </>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────
export function MapLeftSidebar({
  filter,
  onChange,
  availableProvinces = [],
  specialZoneNames = [],
  mapMode = "risk",
  borrowDateFrom,
  borrowDateTo,
  onBorrowDateChange,
  borrowFilters,
  onTimeFilterLabel,
}: {
  filter: MapFilterState;
  onChange: (v: MapFilterState) => void;
  availableProvinces?: ProvinceOption[];
  specialZoneNames?: string[];
  mapMode?: "risk" | "borrow";
  borrowDateFrom?: string;
  borrowDateTo?: string;
  onBorrowDateChange?: (from?: string, to?: string) => void;
  borrowFilters?: BorrowAnalytics["filters"];
  onTimeFilterLabel?: (label: string) => void;
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
    (filter.serviceModes || []).length > 0,
    filter.nationality,
  ].filter(Boolean).length;

  const resetAll = () =>
    onChange({ search: "", region: "", provinceNames: [], type: "", stress: "", status: "", problemCategories: [], serviceModes: [], nationality: "" });

  const filteredProvinces = useMemo(() => {
    if (!provinceSearch) return availableProvinces;
    const q = provinceSearch.toLowerCase();
    return availableProvinces.filter((p) => p.name.toLowerCase().includes(q));
  }, [availableProvinces, provinceSearch]);

  // Dynamic region label lookup
  const [allRegions, setAllRegions] = useState<RegionOption[]>([]);
  useEffect(() => {
    fetch("/api/v2/master/regions", { cache: "no-store" })
      .then(r => r.json())
      .then(j => { if (j.success) setAllRegions(j.data?.regions ?? []); })
      .catch(() => { });
  }, []);
  const selectedRegionLabel = filter.region === "SPECIAL_ADMIN"
    ? "เขตปกครองพิเศษ"
    : allRegions.find((r) => r.region_code === filter.region)?.region_name_th ?? "ทั้งหมด";

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
          {filter.nationality && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 text-[10px] font-bold">
              {filter.nationality === "DOMESTIC" ? "🇹🇭 ในประเทศ" : "🌏 ต่างประเทศ"}
              <button onClick={() => onChange({ ...filter, nationality: "" })} className="hover:text-rose-500 ml-0.5">
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
          <RegionFilter
            selectedRegion={filter.region}
            onSelectRegion={(code: string) => onChange({ ...filter, region: code, provinceNames: [] })}
            specialZoneNames={specialZoneNames}
          />
        </FilterSection>

        {/* ── Province ───────────────────────────────────────── */}
        {
          availableProvinces.length > 0 && (
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
          )
        }

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

        {/* ── Time Filter (always visible — default filter) ────── */}
        {
          onBorrowDateChange && (
            <TimeFilterSection
              dateFrom={borrowDateFrom}
              dateTo={borrowDateTo}
              onDateChange={onBorrowDateChange}
              filters={borrowFilters}
              onTimeFilterLabel={onTimeFilterLabel}
            />
          )
        }

        {/* ── Service Mode Filter (dynamic from DB) ────────────── */}
        <ServiceModeFilter
          selected={filter.serviceModes}
          onChange={(codes: string[]) => onChange({ ...filter, serviceModes: codes })}
        />

        {/* ── Advanced Filters (bottom) ────────────────────────── */}
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

          {/* Student Nationality */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">สัญชาตินิสิต</p>
            <div className="grid grid-cols-3 gap-1">
              {[
                { value: "", label: "ทั้งหมด", emoji: "👥" },
                { value: "DOMESTIC", label: "ในประเทศ", emoji: "🇹🇭" },
                { value: "INTERNATIONAL", label: "ต่างประเทศ", emoji: "🌏" },
              ].map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => onChange({ ...filter, nationality: o.value })}
                  className={`px-2 py-2 rounded-lg text-[10px] font-semibold transition-all border ${filter.nationality === o.value
                    ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                    : "bg-white text-gray-600 border-gray-100 hover:border-teal-300 hover:bg-teal-50"
                    }`}
                >
                  <span className="block text-xs mb-0.5">{o.emoji}</span>
                  {o.label}
                </button>
              ))}
            </div>
          </div>


        </FilterSection>
      </div >

      {/* ── Footer ───────────────────────────────────────────── */}
      < div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50" >
        <p className="text-[10px] text-gray-400 text-center font-medium">
          NU Wellness • National Command Center
        </p>
      </div >

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
      `}</style>
    </div >
  );
}
