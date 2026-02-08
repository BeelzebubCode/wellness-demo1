"use client";

import { TrendingUp, Users, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

type University = {
  code: string;
  name: string;
  nameEn: string | null;
  logo: string;
  students: number;
  dominantProblemCode?: string | null;
  dominantProblemTH?: string | null;
  dominantProblemCount: number;
  problemBreakdown: Record<string, number>;
};

type UniversityRankingsProps = {
  universities: University[];
  selectedCode?: string | null;
  onSelect?: (code: string) => void;
  problemCategories?: string[]; 
};

// Fixed Tooltip Component
function RankingTooltip({ 
  text, 
  rect 
}: { 
  text: string; 
  rect: DOMRect | null 
}) {
  if (!rect) return null;

  // Calculate position
  const top = rect.top; 
  const left = rect.left;
  
  // Decide if tooltip should go above or below
  // Default to above, but if too close to top edge, flip to below
  // Actually, user said top one is covered, likely meaning tooltip goes up off screen or behind header
  // Let's try formatting it smartly.
  
  // Check available space above
  const spaceAbove = top;
  const showBelow = spaceAbove < 40; // If less than 40px from top viewport

  const style: React.CSSProperties = {
    position: "fixed",
    zIndex: 9999,
    left: `${left}px`,
    top: showBelow ? `${rect.bottom + 8}px` : `${top - 8}px`,
    transform: showBelow ? "none" : "translateY(-100%)",
    maxWidth: "250px", // Limit max width so it doesn't span full screen
  };

  return createPortal(
    <div 
      style={style}
      className="bg-gray-900 text-white text-[11px] px-3 py-2 rounded-lg shadow-xl pointer-events-none break-words leading-snug animate-in fade-in zoom-in-95 duration-150"
    >
      {text}
      {/* Arrow */}
      <div 
        className={`absolute left-4 border-4 border-transparent ${
          showBelow 
            ? "border-b-gray-900 -top-2" // Point up
            : "border-t-gray-900 -bottom-2" // Point down
        }`}
      />
    </div>,
    document.body
  );
}

export function UniversityRankings({ 
  universities, 
  selectedCode, 
  onSelect,
  problemCategories = [] 
}: UniversityRankingsProps) {
  const [hoveredUni, setHoveredUni] = useState<{ text: string; rect: DOMRect } | null>(null);
  
  // Helper to get count based on selection
  const getProblemCount = (uni: University) => {
    if (problemCategories && problemCategories.length > 0) {
      // Sum all selected categories
      return problemCategories.reduce((sum, cat) => sum + (uni.problemBreakdown[cat] || 0), 0);
    }
    return uni.dominantProblemCount;
  };

  // Sort universities by calculated count
  const sortedUniversities = [...universities].sort((a, b) => {
    return getProblemCount(b) - getProblemCount(a);
  });

  // Filter 0 counts if filtering is active
  const filteredUniversities = problemCategories.length > 0
    ? sortedUniversities.filter(uni => getProblemCount(uni) > 0)
    : sortedUniversities;

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200 relative">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 bg-white z-10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            อันดับมหาวิทยาลัย
          </h3>
          <div className="bg-gray-100 px-2 py-0.5 rounded-full text-[10px] font-bold text-gray-600">
            {filteredUniversities.length} แห่ง
          </div>
        </div>
        
        {/* Stats Row */}
        <div className="flex gap-3">
          <div className="flex-1 p-3 rounded-lg bg-gray-50 border border-gray-100">
            <div className="text-xl font-bold text-indigo-900 leading-none mb-1">
              {filteredUniversities.reduce((sum, uni) => sum + getProblemCount(uni), 0).toLocaleString()}
            </div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">เคสทั้งหมด</div>
          </div>
          <div className="flex-1 p-3 rounded-lg bg-gray-50 border border-gray-100">
            <div className="text-xl font-bold text-gray-900 leading-none mb-1">
              {filteredUniversities.length}
            </div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">มหาวิทยาลัย</div>
          </div>
        </div>
      </div>

      {/* Scrollable List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filteredUniversities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-5 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
              <TrendingUp className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-900">ไม่พบข้อมูล</p>
            <p className="text-xs text-gray-400 mt-1">ลองปรับเปลี่ยนตัวกรองใหม่</p>
          </div>
        ) : (
          <div className="pb-10">
            {filteredUniversities.map((uni, index) => {
              const isSelected = selectedCode === uni.code;
              const problemCount = getProblemCount(uni);

              return (
                <button
                  key={uni.code}
                  onClick={() => onSelect?.(uni.code)}
                  className={`
                    w-full px-5 py-3 flex items-center gap-3 transition-all duration-200 border-b border-gray-50
                    hover:bg-indigo-50/50 group relative
                    ${isSelected ? "bg-indigo-50 border-indigo-100" : ""}
                  `}
                  style={{
                    animation: `slideInRight 0.3s ease-out ${index * 0.03}s both`
                  }}
                >
                  {/* Rank Indicator */}
                  <div className={`
                    flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm border
                    transition-all duration-200
                    ${index === 0 ? "bg-yellow-400 border-yellow-500 text-yellow-900" : 
                      index === 1 ? "bg-gray-300 border-gray-400 text-gray-800" :
                      index === 2 ? "bg-orange-300 border-orange-400 text-orange-900" :
                      "bg-white border-gray-200 text-gray-500"}
                  `}>
                    {index + 1}
                  </div>

                  {/* Logo */}
                  <div className="relative w-9 h-9 flex-shrink-0 rounded-full overflow-hidden bg-white border border-gray-200 shadow-sm">
                    <Image
                      src={uni.logo}
                      alt={uni.code}
                      fill
                      className="object-contain p-1"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>

                  {/* Info - Truncated with Hover Event */}
                  <div className="flex-1 text-left min-w-0 mr-2"
                       onMouseEnter={(e) => {
                         const rect = e.currentTarget.getBoundingClientRect();
                         setHoveredUni({ text: uni.name, rect });
                       }}
                       onMouseLeave={() => setHoveredUni(null)}
                  >
                     {/* The Name */}
                    <div className="font-semibold text-xs text-gray-900 truncate">
                      {uni.name}
                    </div>
                    
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Users className="w-2.5 h-2.5 text-gray-400" />
                      <span className="text-[10px] text-gray-500">
                        {uni.students > 1000 ? `${(uni.students / 1000).toFixed(1)}k` : uni.students}
                      </span>
                    </div>
                  </div>

                  {/* Count & Bar */}
                  <div className="flex-shrink-0 text-right w-20">
                    <div className={`text-xs font-bold tabular-nums mb-1 ${index < 3 ? "text-indigo-600" : "text-gray-600"}`}>
                      {problemCount.toLocaleString()}
                    </div>
                    {/* Progress Bar */}
                    <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div 
                            className={`h-full rounded-full ${index < 3 ? "bg-gradient-to-r from-indigo-500 to-purple-500" : "bg-gray-300"}`}
                            style={{ 
                                width: `${(problemCount / (sortedUniversities[0]?.dominantProblemCount || 1)) * 100}%`,
                                transition: "width 1s ease-out"
                            }}
                        />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Portal Tooltip */}
      {hoveredUni && (
        <RankingTooltip text={hoveredUni.text} rect={hoveredUni.rect} />
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  );
}
