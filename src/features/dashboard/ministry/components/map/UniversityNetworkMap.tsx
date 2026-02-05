"use client";

import React, { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, ZoomControl } from "react-leaflet";
import { divIcon } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Network, X, Trophy, Medal, Award } from "lucide-react";

// Fix Leaflet icon
import L from "leaflet";
const iconRetinaUrl = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png";
const iconUrl = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png";
const shadowUrl = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png";

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

const createLogoIcon = (logoPath: string, code: string, isMain = false) => {
  const size = isMain ? 60 : 44;
  const html = `
    <div style="position: relative; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center;">
      <img 
        src="${logoPath}" 
        alt="${code}"
        style="width: ${size}px; height: ${size}px; border-radius: 50%; border: ${isMain ? '4px solid #4f46e5' : '3px solid white'}; background: white; box-shadow: 0 4px 12px rgba(0,0,0,0.3); object-fit: contain; padding: 3px;"
      />
    </div>
  `;

  return divIcon({
    html,
    className: "university-logo-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
};

interface UniversityNetworkMapProps {
  universityCode: string;
  centerLat: number;
  centerLng: number;
}

type RankingType = "proximity" | "students" | "connections";

export function UniversityNetworkMap({
  universityCode,
  centerLat,
  centerLng,
}: UniversityNetworkMapProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [showNetwork, setShowNetwork] = useState(false);
  const [connections, setConnections] = useState<any[]>([]);
  const [rankingType, setRankingType] = useState<RankingType>("proximity");

  useEffect(() => {
    setIsMounted(true);

    // Fetch connections
    async function fetchConnections() {
      try {
        const response = await fetch(`/api/v2/ministry/universities/${universityCode}`);
        if (response.ok) {
          const data = await response.json();
          setConnections(data.university.connections || []);
        }
      } catch (error) {
        console.error("Error fetching connections:", error);
      }
    }

    fetchConnections();
  }, [universityCode]);

  // Calculate Top 10 based on ranking type
  const top10 = useMemo(() => {
    if (!connections.length) return [];

    let sorted = [...connections];

    switch (rankingType) {
      case "proximity":
        sorted = sorted.sort((a, b) => a.distance - b.distance);
        break;
      case "students":
        sorted = sorted.sort((a, b) => (b.students || 0) - (a.students || 0));
        break;
      case "connections":
        sorted = sorted.sort((a, b) => (b.connectionCount || 0) - (a.connectionCount || 0));
        break;
    }

    return sorted.slice(0, 10);
  }, [connections, rankingType]);

  const getRankIcon = (rank: number) => {
    if (rank === 0) return <Trophy className="w-4 h-4 text-yellow-500" />;
    if (rank === 1) return <Medal className="w-4 h-4 text-gray-400" />;
    if (rank === 2) return <Award className="w-4 h-4 text-amber-600" />;
    return null;
  };

  const getRankBadgeClass = (rank: number) => {
    if (rank === 0) return "bg-gradient-to-r from-yellow-400 to-yellow-500 text-white";
    if (rank === 1) return "bg-gradient-to-r from-gray-300 to-gray-400 text-white";
    if (rank === 2) return "bg-gradient-to-r from-amber-500 to-amber-600 text-white";
    return "bg-gray-100 text-gray-700";
  };

  const getMetricDisplay = (uni: any) => {
    switch (rankingType) {
      case "proximity":
        return `${uni.distance.toFixed(1)} km`;
      case "students":
        return `${(uni.students || 0).toLocaleString()} students`;
      case "connections":
        return `${uni.connectionCount || 0} connections`;
      default:
        return "";
    }
  };

  // ✅ Enhanced line styling based on rank
  const getLineColor = (rank: number) => {
    if (rank <= 3) return "#4f46e5"; // Indigo for top 3
    if (rank <= 6) return "#6366f1"; // Lighter indigo for 4-6
    if (rank <= 8) return "#8b5cf6"; // Purple for 7-8
    return "#a78bfa"; // Light purple for 9-10
  };

  const getLineWeight = (rank: number) => {
    if (rank <= 3) return 4;
    if (rank <= 6) return 3;
    return 2;
  };

  const getLineOpacity = (rank: number) => {
    if (rank <= 3) return 0.8;
    if (rank <= 6) return 0.6;
    return 0.4;
  };

  if (!isMounted) {
    return <div className="w-full h-full bg-blue-50 animate-pulse" />;
  }

  return (
    <div className="relative w-full h-full">
      {/* Toggle Button */}
      <button
        onClick={() => setShowNetwork(!showNetwork)}
        className={`absolute top-4 right-4 z-[1000] px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg flex items-center gap-2 ${
          showNetwork
            ? "bg-indigo-600 text-white hover:bg-indigo-700"
            : "bg-white/95 backdrop-blur-md text-gray-700 hover:bg-white border border-gray-200"
        }`}
      >
        {showNetwork ? <X className="w-4 h-4" /> : <Network className="w-4 h-4" />}
        {showNetwork ? "Hide Network" : "Show Network"}
      </button>

      {/* Top 10 Rankings Panel */}
      {showNetwork && connections.length > 0 && (
        <div className="absolute top-4 left-4 z-[1000] bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200 w-80">
          {/* Header with Selector */}
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                Top 10 Rankings
              </h3>
            </div>
            <select
              value={rankingType}
              onChange={(e) => setRankingType(e.target.value as RankingType)}
              className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="proximity">📍 Nearest Universities</option>
              <option value="students">👥 Most Students</option>
              <option value="connections">🔗 Most Connected</option>
            </select>
          </div>

          {/* Rankings List */}
          <div className="px-4 py-3 space-y-2 max-h-96 overflow-y-auto">
            {top10.map((uni, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                  idx < 3 ? getRankBadgeClass(idx) : "hover:bg-gray-50"
                }`}
              >
                {/* Rank Number/Icon */}
                <div className="flex-shrink-0 w-8 flex items-center justify-center">
                  {idx < 3 ? (
                    getRankIcon(idx)
                  ) : (
                    <span className="text-xs font-bold text-gray-500">#{idx + 1}</span>
                  )}
                </div>

                {/* University Info */}
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-semibold truncate ${idx < 3 ? "text-white" : "text-gray-900"}`}>
                    {uni.universityName}
                  </div>
                  <div className={`text-xs truncate ${idx < 3 ? "text-white/80" : "text-gray-500"}`}>
                    {getMetricDisplay(uni)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <MapContainer
        center={[centerLat, centerLng]}
        zoom={8}
        minZoom={6}
        maxZoom={15}
        scrollWheelZoom={true}
        zoomControl={false}
        className="w-full h-full"
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <TileLayer url="https://stamen-tiles-{s}.a.ssl.fastly.net/terrain-lines/{z}/{x}/{y}.png" opacity={0.3} />
        <ZoomControl position="bottomright" />

        {/* Main University Marker */}
        <Marker
          position={[centerLat, centerLng]}
          icon={createLogoIcon(`/images/logo/${universityCode}_logo.png`, universityCode, true)}
        >
          <Popup>
            <div className="font-bold">This University</div>
          </Popup>
        </Marker>

        {/* Network Connections - Top 10 with Enhanced Styling */}
        {showNetwork &&
          top10.map((conn, idx) => (
            <React.Fragment key={`connection-${idx}`}>
              {/* Connection Line */}
              <Polyline
                positions={[
                  [centerLat, centerLng],
                  [conn.lat, conn.lng],
                ]}
                color={getLineColor(conn.rank || idx + 1)}
                weight={getLineWeight(conn.rank || idx + 1)}
                opacity={getLineOpacity(conn.rank || idx + 1)}
                dashArray={conn.rank > 5 || idx >= 5 ? "8, 8" : undefined}
                className="connection-line"
              />

              {/* Connected University Marker */}
              <Marker
                position={[conn.lat, conn.lng]}
                icon={createLogoIcon(`/images/logo/${conn.universityCode}_logo.png`, conn.universityCode)}
              >
                <Popup>
                  <div className="text-sm">
                    <div className="font-bold">{conn.universityName}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      Distance: {conn.distance.toFixed(1)} km
                    </div>
                    {conn.students && (
                      <div className="text-xs text-gray-600">
                        Students: {conn.students.toLocaleString()}
                      </div>
                    )}
                    <div className="text-xs text-indigo-600 font-semibold mt-1">
                      Rank #{conn.rank || idx + 1}
                    </div>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          ))}
      </MapContainer>
    </div>
  );
}
