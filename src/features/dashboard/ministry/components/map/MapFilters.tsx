"use client";

import { Search, SlidersHorizontal, MapPin, AlertTriangle, Users, TrendingUp } from "lucide-react";
import { useState } from "react";

export type MapFilterState = {
  search: string;
  region: string;
  type: string;
  stress: string; // New: High stress filter
};

export function MapFilters({
  filter,
  onChange,
}: {
  filter: MapFilterState;
  onChange: (v: MapFilterState) => void;
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  return (
    <>
      {/* Toggle Button (Visible when closed) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="absolute top-6 left-6 z-[1000] p-3 bg-white/95 backdrop-blur-xl border border-gray-200/50 shadow-lg rounded-2xl hover:bg-white transition-all group"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
              <MapPin className="w-5 h-5" />
            </div>
            <span className="font-bold text-gray-900 text-sm pr-1">Filters</span>
          </div>
        </button>
      )}

      {/* Main Filter Panel */}
      <div 
        className={`absolute top-6 left-6 z-[1000] w-[360px] space-y-3 transition-all duration-300 ease-in-out ${
          isOpen ? "translate-x-0 opacity-100" : "-translate-x-[400px] opacity-0 pointer-events-none"
        }`}
      >
        {/* Main Search Card */}
        <div className="bg-white/95 backdrop-blur-xl border border-gray-200/50 shadow-2xl rounded-3xl p-5 transition-all relative">
          
          {/* Close Button */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">University Explorer</h3>
                <p className="text-xs text-gray-500">Ministry Dashboard</p>
              </div>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              className="w-full pl-11 pr-4 py-3 bg-gray-50/80 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all placeholder:text-gray-400"
              placeholder="Search by university name..."
              value={filter.search}
              onChange={(e) => onChange({ ...filter, search: e.target.value })}
            />
          </div>

          {/* Region Filter */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5" />
              ภูมิภาค
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { value: "", label: "ทั้งหมด" },
                { value: "Upper North", label: "ภาคเหนือตอนบน" },
                { value: "Lower North", label: "ภาคเหนือตอนล่าง" },
                { value: "Upper Northeast", label: "ภาคตะวันออกเฉียงเหนือตอนบน" },
                { value: "Lower Northeast", label: "ภาคตะวันออกเฉียงเหนือตอนล่าง" },
                { value: "Upper Central", label: "ภาคกลางตอนบน" },
                { value: "Lower Central", label: "ภาคกลางตอนล่าง" },
                { value: "East", label: "ภาคตะวันออก" },
                { value: "Upper South", label: "ภาคใต้ตอนบน" },
                { value: "Lower South", label: "ภาคใต้ตอนล่าง" },
              ].map((r) => (
                <button
                  key={r.value}
                  onClick={() => onChange({ ...filter, region: r.value })}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    filter.region === r.value
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30"
                      : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Advanced Filters (Expandable) */}
          <div className={`space-y-4 pt-4 border-t border-gray-200 transition-all duration-300 ${showAdvanced ? "opacity-100 max-h-[500px]" : "opacity-0 max-h-0 overflow-hidden"}`}>
            {/* Stress Level Filter */}
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
                Mental Health Priority
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["All", "High Risk", "Medium Risk"].map((level) => (
                  <button
                    key={level}
                    onClick={() =>
                      onChange({ ...filter, stress: level === "All" ? "" : level })
                    }
                    className={`
                      px-3 py-2.5 rounded-xl text-xs font-medium transition-all border
                      ${
                        (filter.stress === level || (level === "All" && !filter.stress))
                          ? level === "High Risk"
                            ? "bg-red-50 border-red-300 text-red-700 ring-2 ring-red-200"
                            : level === "Medium Risk"
                            ? "bg-orange-50 border-orange-300 text-orange-700 ring-2 ring-orange-200"
                            : "bg-indigo-50 border-indigo-300 text-indigo-700 ring-2 ring-indigo-200"
                          : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                      }
                    `}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Institution Type */}
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                <TrendingUp className="w-3.5 h-3.5 text-purple-500" />
                ประเภทสถาบัน (Institution Type)
              </label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { value: "", label: "ทั้งหมด (All)" },
                  { value: "SUPERVISED", label: "มหาวิทยาลัยในกำกับ (Autonomous)" },
                  { value: "PUBLIC", label: "มหาวิทยาลัยรัฐ (Public)" },
                  { value: "PRIVATE", label: "มหาวิทยาลัยเอกชน (Private)" },
                ].map((t) => (
                  <button
                    key={t.value}
                    onClick={() => onChange({ ...filter, type: t.value })}
                    className={`
                      px-3 py-2.5 rounded-xl text-xs font-medium transition-all border text-left flex items-center justify-between group
                      ${
                        filter.type === t.value
                          ? "bg-purple-50 border-purple-300 text-purple-700 ring-2 ring-purple-200"
                          : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                      }
                    `}
                  >
                    {t.label}
                    {filter.type === t.value && <div className="w-2 h-2 rounded-full bg-purple-500" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
             onClick={() => setShowAdvanced(!showAdvanced)}
             className="w-full mt-2 py-2 text-xs text-gray-500 hover:text-indigo-600 flex items-center justify-center gap-1 transition-colors"
          >
             {showAdvanced ? "Hide Advanced Filters" : "Show Advanced Filters"}
          </button>

          {/* Active Filters Count */}
          {(filter.stress || filter.studentRange || filter.type || filter.region) && (
            <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between">
              <span className="text-xs text-gray-600">
                {[filter.stress, filter.type, filter.region].filter(Boolean).length} filters active
              </span>
              <button
                onClick={() => onChange({ search: filter.search, region: "", type: "", stress: "" })}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
