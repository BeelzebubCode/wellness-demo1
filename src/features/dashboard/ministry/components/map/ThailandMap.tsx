// src/features/dashboard/ministry/components/map/ThailandMap.tsx
"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { divIcon } from "leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import ReactDOMServer from "react-dom/server";

import { MapLeftSidebar, MapFilterState } from "./MapLeftSidebar";
import { useUniversitiesMap } from "../../hooks/useUniversitiesMap";
import type { UniversityMapData } from "../../hooks/useUniversitiesMap";
import { Layers, Map as MapIcon, PanelLeft, ChevronRight, ChevronLeft } from "lucide-react";
import { UniversityRankings } from "./UniversityRankings";

// Fix Leaflet default icon
const iconRetinaUrl = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png";
const iconUrl = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png";
const shadowUrl = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png";
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

// University Marker Component with Opacity support
function UniversityPin({ data, opacity = 1 }: { data: UniversityMapData; opacity?: number }) {
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

  const { universities, isLoading, error } = useUniversitiesMap();

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

        {/* CSS 3D Effect */}
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
      `}</style>
      </div>

      {/* Right Sidebar - University Rankings */}
      <div
        className={`h-full flex-shrink-0 border-l border-gray-200 bg-white z-20 relative transition-all duration-300 ease-in-out ${isSidebarExpanded ? "w-[380px] translate-x-0" : "w-0 translate-x-full opacity-0"
          }`}
      >
        <div className="w-[380px] h-full">
          <UniversityRankings
            universities={filteredData}
            problemCategories={filter.problemCategories}
            status={filter.status}
            onSelect={(code) => {
              window.location.href = `/ministry/universities/${code}`;
            }}
          />
        </div>
      </div>
    </div>
  );
}
