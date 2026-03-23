// src/features/dashboard/ministry/components/map/ThailandMap.tsx
"use client";

import { useState, useMemo, useEffect, useRef, memo, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, CircleMarker } from "react-leaflet";
import { divIcon } from "leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import ReactDOMServer from "react-dom/server";

import { MapLeftSidebar, MapFilterState } from "./MapLeftSidebar";
import { useUniversitiesMap } from "../../hooks/useUniversitiesMap";
import type { UniversityMapData } from "../../hooks/useUniversitiesMap";
import { Layers, Map as MapIcon, PanelLeft, ChevronRight, ChevronLeft, Shield, AlertTriangle, Eye, EyeOff, ArrowRightLeft } from "lucide-react";
import { UniversityRankings } from "./UniversityRankings";
import { BorrowPolylines, BorrowLegend, BorrowRankings, useBorrowAnalytics } from "./BorrowingOverlay";

// ─── Risk Tier Classification (matches booking_outcome.risk_level_id 1–5) ──
type RiskTier = "VERY_HIGH" | "HIGH" | "MEDIUM" | "LOW" | "VERY_LOW";
const RISK_TIERS: RiskTier[] = ["VERY_HIGH", "HIGH", "MEDIUM", "LOW", "VERY_LOW"];

// Percentile-based risk thresholds — computed once from dataset
let _riskThresholds: { p90: number; p75: number; p50: number; p25: number } | null = null;

function computeThresholds(universities: UniversityMapData[]) {
  const counts = universities.map(u => u.dominantProblemCount).sort((a, b) => a - b);
  const pct = (p: number) => counts[Math.floor(counts.length * p)] || 0;
  _riskThresholds = { p90: pct(0.90), p75: pct(0.75), p50: pct(0.50), p25: pct(0.25) };
}

function classifyRisk(uni: UniversityMapData): RiskTier {
  if (!_riskThresholds) return "VERY_LOW";
  const c = uni.dominantProblemCount;
  if (c >= _riskThresholds.p90) return "VERY_HIGH";
  if (c >= _riskThresholds.p75) return "HIGH";
  if (c >= _riskThresholds.p50) return "MEDIUM";
  if (c >= _riskThresholds.p25) return "LOW";
  return "VERY_LOW";
}

const RISK_META: Record<RiskTier, { fill: string; stroke: string; label: string; emoji: string; textColor: string }> = {
  VERY_HIGH: { fill: "rgba(220,38,38,0.20)", stroke: "#dc2626", label: "สูงมาก (5)", emoji: "🚨", textColor: "text-red-600" },
  HIGH: { fill: "rgba(239,68,68,0.15)", stroke: "#ef4444", label: "สูง (4)", emoji: "🔴", textColor: "text-red-500" },
  MEDIUM: { fill: "rgba(245,158,11,0.12)", stroke: "#f59e0b", label: "ปานกลาง (3)", emoji: "🟡", textColor: "text-amber-600" },
  LOW: { fill: "rgba(34,197,94,0.10)", stroke: "#22c55e", label: "ต่ำ (2)", emoji: "🟢", textColor: "text-emerald-600" },
  VERY_LOW: { fill: "rgba(6,182,212,0.08)", stroke: "#06b6d4", label: "ต่ำมาก (1)", emoji: "🔵", textColor: "text-cyan-600" },
};

function getRiskRadius(uni: UniversityMapData): number {
  const base = Math.min(Math.max(uni.students / 200, 8000), 35000);
  const tier = classifyRisk(uni);
  const mult = tier === "VERY_HIGH" ? 1.4 : tier === "HIGH" ? 1.2 : 1.0;
  return base * mult;
}

// ─── Intelligence Legend (Clickable Filter + Toggle) ──────────────────────
function IntelLegend({
  data, visible, onToggle, activeTiers, onTierToggle,
}: {
  data: UniversityMapData[]; visible: boolean; onToggle: () => void;
  activeTiers: Set<RiskTier>; onTierToggle: (tier: RiskTier) => void;
}) {
  const counts = useMemo(() => {
    const c: Record<RiskTier, number> = { VERY_HIGH: 0, HIGH: 0, MEDIUM: 0, LOW: 0, VERY_LOW: 0 };
    for (const u of data) c[classifyRisk(u)]++;
    return c;
  }, [data]);

  const totalActive = RISK_TIERS.filter(t => activeTiers.has(t)).reduce((s, t) => s + counts[t], 0);
  const dangerCount = (activeTiers.has("VERY_HIGH") ? counts.VERY_HIGH : 0) + (activeTiers.has("HIGH") ? counts.HIGH : 0);

  return (
    <div className="absolute top-4 left-4 z-[1000] pointer-events-auto">
      <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-200/60 overflow-hidden" style={{ minWidth: 240 }}>
        {/* Header */}
        <div className="px-4 py-3 bg-gradient-to-r from-slate-900 to-slate-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-black tracking-tight">ข่าวกรองเชิงพื้นที่</span>
          </div>
          <button onClick={onToggle} className="p-1 rounded-lg hover:bg-white/15 transition-colors"
            title={visible ? "ซ่อนโซนเสี่ยง" : "แสดงโซนเสี่ยง"}>
            {visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-white/50" />}
          </button>
        </div>

        {/* Risk Tiers — Clickable Filter */}
        <div className="p-2 space-y-0.5">
          {RISK_TIERS.map((tier) => {
            const meta = RISK_META[tier];
            const isActive = activeTiers.has(tier);
            return (
              <button key={tier} onClick={() => onTierToggle(tier)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all ${isActive ? "bg-gray-50 hover:bg-gray-100 ring-1 ring-gray-200" : "opacity-40 hover:opacity-70 bg-transparent"
                  }`}>
                <div className="flex items-center gap-2">
                  <div className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${tier === "VERY_HIGH" && isActive ? "animate-pulse" : ""}`}
                    style={{ backgroundColor: isActive ? meta.fill : "transparent", borderColor: isActive ? meta.stroke : "#d1d5db" }} />
                  <span className={`text-[11px] font-bold ${isActive ? "text-gray-800" : "text-gray-400"}`}>
                    {meta.emoji} {meta.label}
                  </span>
                </div>
                <span className={`text-[11px] font-black tabular-nums ${isActive ? meta.textColor : "text-gray-300"}`}>
                  {counts[tier]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Summary */}
        <div className="px-4 py-2 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[10px] text-gray-400 font-medium">แสดง {totalActive} สถาบัน</span>
          <button onClick={() => RISK_TIERS.forEach(t => { if (!activeTiers.has(t)) onTierToggle(t); })}
            className="text-[10px] font-bold hover:underline" style={{ color: 'rgb(var(--primary))' }}>เลือกทั้งหมด</button>
        </div>

        {/* Danger Alert */}
        {dangerCount > 0 && (
          <div className="px-4 py-2 bg-red-50 border-t border-red-100">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3 text-red-500 flex-shrink-0" />
              <p className="text-[10px] text-red-700 font-bold">⚠️ พบ {dangerCount} สถาบัน ระดับสูง-สูงมาก</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Pulsing Alert Marker (for critical universities) ─────────────────────
function PulsingAlertMarker({ lat, lng, label }: { lat: number; lng: number; label: string }) {
  const icon = divIcon({
    html: `<div class="intel-pulse-ring"><div class="intel-pulse-core">!</div></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    className: "",
  });

  return (
    <Marker position={[lat, lng]} icon={icon}>
      <Popup>
        <div style={{ padding: "4px", fontWeight: 700, color: "#dc2626", fontSize: "13px" }}>⚠️ {label}</div>
        <div style={{ fontSize: "11px", color: "#6b7280" }}>จุดเสี่ยงสูง — ต้องเฝ้าระวัง</div>
      </Popup>
    </Marker>
  );
}

// Fix Leaflet default icon
const iconRetinaUrl = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png";
const iconUrl = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png";
const shadowUrl = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png";
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

// University Marker Component with Opacity support
function UniversityPinInner({ data, opacity = 1 }: { data: UniversityMapData; opacity?: number }) {
  const logoUrl = data.logo;

  // Determine priority color based on dominant problem
  const problemColor = (() => {
    if (!data.dominantProblemTH) return "#6366f1";
    const problem = data.dominantProblemTH.toLowerCase();
    if (problem.includes("เครียด")) return "#f59e0b";
    if (problem.includes("ซึมเศร้า")) return "#ef4444";
    if (problem.includes("วิตกกังวล")) return "#8b5cf6";
    return "#6366f1";
  })();

  const customIcon = divIcon({
    html: ReactDOMServer.renderToString(
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          backgroundColor: "#fff",
          border: "2px solid #e5e7eb",  // 🔥 Subtle gray border for pure circular look
          boxShadow: `0 2px 8px rgba(0,0,0,0.12), 0 0 0 2px ${problemColor}20`,  // Subtle shadow + problem glow
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          position: "relative",
          opacity: opacity,
        }}
        className="university-pin"
      >
        <img
          src={logoUrl}
          alt={data.code}
          style={{
            width: "40px",
            height: "40px",
            objectFit: "contain",
            borderRadius: "50%",
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
            const parent = (e.target as HTMLImageElement).parentElement;
            if (parent) {
              parent.innerHTML = `<div style="font-weight: 700; font-size: 10px; color: #6b7280">${data.code}</div>`;
            }
          }}
        />

        {data.dominantProblemCount > 0 && data.dominantProblemCount >= 50 && (
          <div style={{
            position: "absolute",
            top: -2,
            right: -2,
            background: problemColor,
            color: "#fff",
            fontSize: "9px",
            fontWeight: 700,
            width: "16px",
            height: "16px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            border: "2px solid #fff",
            zIndex: 10
          }}>
            !
          </div>
        )}
      </div>
    ),
    iconSize: [48, 48],
    iconAnchor: [24, 48],
    popupAnchor: [0, -48],
    className: '',
  });

  return (
    <Marker position={[data.lat, data.lng]} icon={customIcon}>
      <Popup maxWidth={280} className="university-popup">
        <div style={{ padding: "8px" }}>
          <div style={{ fontWeight: 700, fontSize: "15px", marginBottom: "6px", color: "#1f2937" }}>
            {data.name}
          </div>
          <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "10px" }}>
            {data.province}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "10px" }}>
            <div>
              <div style={{ fontSize: "10px", color: "#9ca3af", textTransform: "uppercase" }}>นักศึกษา</div>
              <div className="font-semibold text-[13px] text-primary">
                {data.students.toLocaleString()}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "10px", color: "#9ca3af", textTransform: "uppercase" }}>ปัญหาหลัก</div>
              <div style={{ fontWeight: 600, fontSize: "12px", color: problemColor }}>
                {data.dominantProblemTH || "N/A"}
              </div>
            </div>
          </div>
          <a
            href={`/ministry/universities/${data.code}`}
            className="block text-center py-2 px-3 bg-primary text-white rounded-lg text-[13px] font-semibold no-underline"
          >
            ดูแดชบอร์ด →
          </a>
        </div>
      </Popup>
    </Marker>
  );
}

const UniversityPin = memo(UniversityPinInner);
function MapStyleController({ mapStyle }: { mapStyle: string }) {
  const map = useMap();

  const tileUrls: Record<string, string> = {
    street: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    terrain: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
  };

  return (
    <TileLayer
      url={tileUrls[mapStyle]}
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      key={mapStyle}
    />
  );
}

// ✅ Auto-fit bounds when data changes (with initial Thailand view + reset support)
function MapBoundsController({ data, resetZoom = false }: { data: any[]; resetZoom?: boolean }) {
  const map = useMap();
  const hasInitialized = useRef(false);

  useEffect(() => {
    // On first load, always center on Thailand
    if (!hasInitialized.current) {
      map.setView([13.7563, 100.5018], 6);
      hasInitialized.current = true;
      return;
    }

    // 🔥 NEW: Reset to Thailand view when "ทั้งหมด" is selected
    if (resetZoom) {
      map.setView([13.7563, 100.5018], 6);
      return;
    }

    // After initial load, fit bounds only if there's filtered data
    if (data.length > 0 && data.length < 100) {
      // Only fit bounds if it's a filtered subset (not all universities)
      try {
        const bounds = L.latLngBounds(data.map((u) => [u.lat, u.lng]));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
      } catch (e) {
        console.warn("Failed to fit bounds:", e);
      }
    }
  }, [data, map, resetZoom]);

  return null;
}

export function ThailandMap() {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [filter, setFilter] = useState<MapFilterState>({
    search: "",
    region: "",
    provinceNames: [],
    type: "",
    stress: "",
    status: "",
    problemCategories: [],
  });
  const [mapStyle, setMapStyle] = useState<"street" | "satellite" | "terrain">("street");
  const [showIntelOverlay, setShowIntelOverlay] = useState(true);
  const [activeRiskTiers, setActiveRiskTiers] = useState<Set<RiskTier>>(new Set(RISK_TIERS));
  const [mapMode, setMapMode] = useState<"risk" | "borrow">("risk");
  const [selectedBorrower, setSelectedBorrower] = useState<number | null>(null);
  const [borrowTopN, setBorrowTopN] = useState(10);
  const [borrowDateFrom, setBorrowDateFrom] = useState<string | undefined>();
  const [borrowDateTo, setBorrowDateTo] = useState<string | undefined>();

  const { data: borrowData, loading: borrowLoading } = useBorrowAnalytics(borrowDateFrom, borrowDateTo);

  const handleBorrowDateChange = useCallback((from?: string, to?: string) => {
    setBorrowDateFrom(from);
    setBorrowDateTo(to);
  }, []);

  const handleTierToggle = useCallback((tier: RiskTier) => {
    setActiveRiskTiers(prev => {
      const next = new Set(prev);
      if (next.has(tier)) next.delete(tier); else next.add(tier);
      return next;
    });
  }, []);

  const { universities, isLoading, error } = useUniversitiesMap();

  // Compute risk thresholds whenever universities data changes
  useMemo(() => {
    if (universities && universities.length > 0) computeThresholds(universities);
  }, [universities]);

  // 🔥 NEW: Separate all data from filtered data
  const allData = useMemo(() => {
    if (!universities || universities.length === 0) return [];

    return universities.filter((uni) => {
      // 1. Search filter
      if (filter.search && !uni.name.toLowerCase().includes(filter.search.toLowerCase())) {
        return false;
      }

      // 2. Type filter
      if (filter.type && uni.type !== filter.type) {
        return false;
      }

      // 3 & 5. Combined Problem Category and Status filter
      if (filter.status && filter.problemCategories && filter.problemCategories.length > 0) {
        const hasCombinedMatch = filter.problemCategories.some(cat =>
          uni.granularStats?.[filter.status]?.[cat] && uni.granularStats[filter.status][cat] > 0
        );
        if (!hasCombinedMatch) return false;
      } else if (filter.problemCategories && filter.problemCategories.length > 0) {
        // Individual problem filter
        const hasMatch = filter.problemCategories.some(cat =>
          uni.problemBreakdown && uni.problemBreakdown[cat] && uni.problemBreakdown[cat] > 0
        );
        if (!hasMatch) return false;
      } else if (filter.status) {
        // Individual status filter
        if (!uni.statusBreakdown || !uni.statusBreakdown[filter.status] || uni.statusBreakdown[filter.status] === 0) {
          return false;
        }
      }

      // 4. Stress/Urgency filter 
      // (Infer from dominantProblemCount for now as "Urgency" usually correlates with load)
      if (filter.stress) {
        const count = uni.dominantProblemCount || 0;
        if (filter.stress === "HIGH" && count < 50) return false;
        if (filter.stress === "MEDIUM" && (count < 20 || count >= 50)) return false;
        if (filter.stress === "LOW" && count >= 20) return false;
      }

      return true;
    });
  }, [universities, filter.search, filter.type, filter.stress, filter.status, filter.problemCategories]);

  // Compute available provinces (scoped to selected region)
  const availableProvinces = useMemo(() => {
    let source = allData;
    if (filter.region === "SPECIAL_ADMIN") {
      source = allData.filter(u => u.isSpecialZone);
    } else if (filter.region) {
      source = allData.filter(u => u.regionCode === filter.region);
    }
    const map = new Map<string, number>();
    for (const u of source) {
      if (u.province) map.set(u.province, (map.get(u.province) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b, 'th'))
      .map(([name, count]) => ({ name, count }));
  }, [allData, filter.region]);

  // Derive special zone label for the button (from DB data)
  const specialZoneNames = useMemo(() => {
    const names = new Set<string>();
    for (const u of allData) {
      if (u.isSpecialZone && u.province) names.add(u.province);
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b, 'th'));
  }, [allData]);

  // Selected region universities (fully visible)
  const selectedRegionData = useMemo(() => {
    let data = allData;
    if (filter.region === "SPECIAL_ADMIN") {
      data = data.filter((uni) => uni.isSpecialZone);
    } else if (filter.region) {
      data = data.filter((uni) => uni.regionCode === filter.region);
    }
    if (filter.provinceNames.length > 0) data = data.filter((uni) => filter.provinceNames.includes(uni.province));
    return data;
  }, [allData, filter.region, filter.provinceNames]);

  // Other region universities (dimmed)
  const otherRegionData = useMemo(() => {
    if (!filter.region && filter.provinceNames.length === 0) return []; // No dimming
    return allData.filter((uni) => !selectedRegionData.includes(uni));
  }, [allData, selectedRegionData, filter.region, filter.provinceNames]);

  // For sidebar display (only selected region + province)
  const filteredData = selectedRegionData;

  // ── Pre-compute risk-classified data for intel overlay (avoid repeated classifyRisk calls) ──
  const intelOverlayData = useMemo(() => {
    return selectedRegionData.map((uni) => {
      const tier = classifyRisk(uni);
      const meta = RISK_META[tier];
      return {
        uni,
        tier,
        radius: getRiskRadius(uni),
        pathOptions: {
          fillColor: meta.fill,
          fillOpacity: 0.6,
          color: meta.stroke,
          weight: tier === "VERY_HIGH" ? 2.5 : tier === "HIGH" ? 1.5 : 0.8,
          opacity: tier === "VERY_HIGH" ? 0.9 : 0.5,
          dashArray: tier === "VERY_LOW" ? "4 4" : undefined,
        } as L.PathOptions,
      };
    });
  }, [selectedRegionData]);

  // ── Filter universities for right-side rankings by active risk tiers ──
  const riskFilteredData = useMemo(() => {
    // Don't filter if: overlay hidden, all selected, or none selected
    if (!showIntelOverlay || activeRiskTiers.size === RISK_TIERS.length || activeRiskTiers.size === 0) return filteredData;
    return filteredData.filter((uni) => activeRiskTiers.has(classifyRisk(uni)));
  }, [filteredData, activeRiskTiers, showIntelOverlay]);

  if (isLoading) {
    return (
      <div className="w-full h-full bg-slate-100 flex items-center justify-center">
        <div className="text-gray-600 font-medium">Loading universities...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full bg-red-50 flex items-center justify-center">
        <div className="text-red-600 font-medium">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-tenant relative">
      {/* Sidebar Toggle Handle (Always visible at the edge) */}
      <button
        onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
        style={{ left: isSidebarExpanded ? "320px" : "0" }}
        className="absolute top-1/2 -translate-y-1/2 z-[1001] w-5 h-12 bg-white border border-gray-200 shadow-md flex items-center justify-center rounded-r-md hover:bg-gray-50 transition-all duration-300 ease-in-out group"
        title={isSidebarExpanded ? "พับเก็บ" : "ขยายออก"}
      >
        {isSidebarExpanded ? (
          <ChevronLeft className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-primary transition-colors font-bold" />
        )}
      </button>

      {/* Left Sidebar - Filters */}
      <div
        className={`h-full flex-shrink-0 border-r border-gray-200 bg-white z-20 relative shadow-sm transition-all duration-300 ease-in-out ${isSidebarExpanded ? "w-[320px] translate-x-0" : "w-0 -translate-x-full opacity-0"
          }`}
      >
        <div className="w-[320px] h-full overflow-y-auto">
          <MapLeftSidebar
            filter={filter}
            onChange={setFilter}
            availableProvinces={availableProvinces}
            specialZoneNames={specialZoneNames}
            mapMode={mapMode}
            borrowDateFrom={borrowDateFrom}
            borrowDateTo={borrowDateTo}
            onBorrowDateChange={handleBorrowDateChange}
            borrowFilters={borrowData?.filters}
          />
        </div>
      </div>

      {/* Center - Map */}
      <div className="flex-1 relative h-full overflow-hidden">
        <MapContainer
          center={[13.7563, 100.5018]}
          zoom={6}
          style={{ height: "100%", width: "100%" }}
          zoomControl={true}
          scrollWheelZoom={true}
        >
          <MapStyleController mapStyle={mapStyle} />
          <MapBoundsController data={filteredData} resetZoom={!filter.region && filter.provinceNames.length === 0} />

          {/* ── Intel Overlay: Risk Zone Circles (filtered by active tiers) ── */}
          {mapMode === "risk" && showIntelOverlay && intelOverlayData
            .filter((d) => activeRiskTiers.has(d.tier))
            .map((d) => (
              <Circle
                key={`zone-${d.uni.id}`}
                center={[d.uni.lat, d.uni.lng]}
                radius={d.radius}
                pathOptions={d.pathOptions}
              />
            ))}

          {/* ── Intel Overlay: Pulsing Alert for VERY_HIGH ─────────── */}
          {mapMode === "risk" && showIntelOverlay && activeRiskTiers.has("VERY_HIGH") && intelOverlayData
            .filter((d) => d.tier === "VERY_HIGH")
            .map((d) => (
              <PulsingAlertMarker key={`alert-${d.uni.id}`} lat={d.uni.lat} lng={d.uni.lng} label={d.uni.name} />
            ))}

          {/* ── Borrowing Overlay: Polyline Connections ─────────── */}
          {mapMode === "borrow" && borrowData && (
            <BorrowPolylines pairs={borrowData.universityPairs} selectedBorrower={selectedBorrower} topN={borrowTopN} />
          )}

          {/* Selected region universities (fully visible) */}
          {selectedRegionData.map((uni) => (
            <UniversityPin key={uni.id} data={uni} opacity={1} />
          ))}

          {/* Other region universities (dimmed) */}
          {otherRegionData.map((uni) => (
            <UniversityPin key={`dimmed-${uni.id}`} data={uni} opacity={0.3} />
          ))}
        </MapContainer>

        {/* Map Style Controls */}
        <div className="absolute bottom-6 right-6 z-[1000] flex gap-2 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-gray-200 p-2 animate-in fade-in slide-in-from-right-4 pointer-events-auto">
          <button
            onClick={() => setMapStyle("street")}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all shadow-sm ${mapStyle === "street"
              ? "bg-primary text-white"
              : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-100"
              }`}
          >
            🗺️
          </button>
          <button
            onClick={() => setMapStyle("satellite")}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all shadow-sm ${mapStyle === "satellite"
              ? "bg-primary text-white"
              : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-100"
              }`}
          >
            🛰️
          </button>
          <button
            onClick={() => setMapStyle("terrain")}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all shadow-sm ${mapStyle === "terrain"
              ? "bg-primary text-white"
              : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-100"
              }`}
          >
            🏔️
          </button>
        </div>

        {/* Mode Toggle Tab */}
        <div className="absolute top-4 right-4 z-[1000] pointer-events-auto">
          <div className="bg-white/95 backdrop-blur-lg rounded-xl shadow-xl border border-gray-200 p-1 flex gap-1">
            <button
              onClick={() => { setMapMode("risk"); setSelectedBorrower(null); }}
              className={`px-3 py-2 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 ${mapMode === "risk" ? "bg-slate-800 text-white shadow-md" : "text-gray-500 hover:bg-gray-50"
                }`}
            >
              <Shield className="w-3.5 h-3.5" /> ภาพรวมความเสี่ยง
            </button>
            <button
              onClick={() => setMapMode("borrow")}
              className={`px-3 py-2 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 ${mapMode === "borrow" ? "bg-indigo-700 text-white shadow-md" : "text-gray-500 hover:bg-gray-50"
                }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" /> เครือข่ายยืมตัว
            </button>
          </div>
        </div>

        {/* Intel Legend (risk mode) */}
        {mapMode === "risk" && (
          <IntelLegend data={filteredData} visible={showIntelOverlay} onToggle={() => setShowIntelOverlay(!showIntelOverlay)} activeTiers={activeRiskTiers} onTierToggle={handleTierToggle} />
        )}

        {/* Borrow Legend (borrow mode) */}
        {mapMode === "borrow" && borrowData && (
          <BorrowLegend data={borrowData} selectedBorrower={selectedBorrower} onSelectBorrower={setSelectedBorrower} />
        )}



        {/* CSS 3D Effect + Intel Animations */}
        <style jsx global>{`
        .university-pin:hover {
          transform: scale(1.2) translateY(-5px);
          box-shadow: 0 8px 24px rgba(99, 102, 241, 0.7) !important;
        }
        
        .university-popup .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
        }

        .leaflet-container {
          background: #f1f5f9;
        }

        /* Pulsing alert ring for critical zones */
        .intel-pulse-ring {
          position: relative;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .intel-pulse-ring::before,
        .intel-pulse-ring::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 2px solid #ef4444;
          animation: intel-ripple 2s ease-out infinite;
        }
        .intel-pulse-ring::after {
          animation-delay: 0.8s;
        }
        .intel-pulse-core {
          width: 16px; height: 16px;
          border-radius: 50%;
          background: #ef4444;
          color: #fff;
          font-size: 10px;
          font-weight: 900;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 12px rgba(239,68,68,0.6);
          z-index: 2;
          animation: intel-glow 1.5s ease-in-out infinite alternate;
        }
        @keyframes intel-ripple {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        @keyframes intel-glow {
          0% { box-shadow: 0 0 8px rgba(239,68,68,0.4); }
          100% { box-shadow: 0 0 20px rgba(239,68,68,0.8); }
        }
      `}</style>
      </div>

      {/* Right Sidebar — conditioned by mode */}
      <div
        className={`h-full flex-shrink-0 border-l border-gray-200 bg-white z-20 relative transition-all duration-300 ease-in-out ${isSidebarExpanded ? "w-[380px] translate-x-0" : "w-0 translate-x-full opacity-0"
          }`}
      >
        <div className="w-[380px] h-full">
          {mapMode === "risk" ? (
            <UniversityRankings
              universities={riskFilteredData}
              problemCategories={filter.problemCategories}
              status={filter.status}
              onSelect={(code) => {
                window.location.href = `/ministry/universities/${code}`;
              }}
            />
          ) : borrowData ? (
            <BorrowRankings
              data={borrowData}
              selectedBorrower={selectedBorrower}
              onSelectBorrower={setSelectedBorrower}
              topN={borrowTopN}
              onTopNChange={setBorrowTopN}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-gray-400 text-sm">กำลังโหลด...</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
