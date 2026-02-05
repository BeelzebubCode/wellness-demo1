// src/features/dashboard/ministry/components/map/ThailandMap.tsx
"use client";

import { useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { divIcon } from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapFilters, type MapFilterState } from "./MapFilters";
import { useUniversitiesMap } from "../../hooks/useUniversitiesMap";
import { Layers, Map as MapIcon } from "lucide-react";
import { renderToString } from "react-dom/server";

// Fix Leaflet default icon
import L from "leaflet";
const iconRetinaUrl = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png";
const iconUrl = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png";
const shadowUrl = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png";
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

function UniversityPin({ data }: { data: any }) {
  // Use correct logo path
  const logoUrl = `/images/logo/${data.code}_logo.png`;

  const customIcon = divIcon({
    className: "custom-marker",
    html: renderToString(
      <div style={{ position: "relative" }}>
        <div
          style={{
            width: "50px",
            height: "50px",
            borderRadius: "50%",
            background: "white",
            border: "3px solid #6366f1",
            boxShadow: "0 4px 16px rgba(99, 102, 241, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            transition: "all 0.3s ease",
            position: "relative",
          }}
          className="university-pin"
        >
          <img
            src={logoUrl}
            alt={data.code}
            style={{
              width: "44px",
              height: "44px",
              objectFit: "contain",
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
              const parent = (e.target as HTMLImageElement).parentElement;
              if (parent) {
                parent.innerHTML = `<div style="font-size: 12px; font-weight: 700; color: #6366f1;">${data.code}</div>`;
              }
            }}
          />
        </div>
      </div>
    ),
    iconSize: [50, 50],
    iconAnchor: [25, 50],
    popupAnchor: [0, -50],
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
              <div style={{ fontSize: "10px", color: "#9ca3af", textTransform: "uppercase" }}>Students</div>
              <div style={{ fontWeight: 600, fontSize: "13px", color: "#6366f1" }}>
                {data.students.toLocaleString()}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "10px", color: "#9ca3af", textTransform: "uppercase" }}>Type</div>
              <div style={{ fontWeight: 600, fontSize: "13px", color: "#10b981" }}>{data.type}</div>
            </div>
          </div>
          <a
            href={`/ministry/universities/${data.code}`}
            style={{
              display: "block",
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              color: "white",
              textAlign: "center",
              padding: "8px 12px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            View Dashboard →
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

export function ThailandMap() {
  const [filter, setFilter] = useState<MapFilterState>({
    search: "",
    region: "",
    type: "",
    stress: "",
    studentRange: "",
  });
  const [mapStyle, setMapStyle] = useState<"street" | "satellite" | "terrain">("street");

  const { universities, isLoading, error } = useUniversitiesMap();

  // Filter universities
  const filteredData = useMemo(() => {
    if (!universities) return [];

    return universities.filter((uni) => {
      if (filter.search && !uni.name.toLowerCase().includes(filter.search.toLowerCase())) return false;
      // ✅ Compare with region name (English), not regionCode
      if (filter.region && uni.region !== filter.region) return false;
      if (filter.type && uni.type !== filter.type) return false;
      return true;
    });
  }, [universities, filter]);

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
    <div className="relative w-full h-full overflow-hidden shadow-2xl border-0">
      <MapFilters filter={filter} onChange={setFilter} />

      <MapContainer
        center={[13.7563, 100.5018]}
        zoom={6}
        style={{ height: "100%", width: "100%" }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <MapStyleController mapStyle={mapStyle} />

        {filteredData.map((uni) => (
          <UniversityPin key={uni.id} data={uni} />
        ))}
      </MapContainer>

      {/* Map Style Switcher */}
      <div className="absolute bottom-4 right-4 z-[1000] bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-gray-200 p-3">
        <div className="text-xs font-bold text-gray-800 mb-2 flex items-center gap-2">
          <Layers className="w-3.5 h-3.5" />
          Map Style
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setMapStyle("street")}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
              mapStyle === "street"
                ? "bg-indigo-600 text-white shadow-lg"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <MapIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMapStyle("satellite")}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
              mapStyle === "satellite"
                ? "bg-indigo-600 text-white shadow-lg"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            🛰️
          </button>
          <button
            onClick={() => setMapStyle("terrain")}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
              mapStyle === "terrain"
                ? "bg-indigo-600 text-white shadow-lg"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            🏔️
          </button>
        </div>
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
  );
}
