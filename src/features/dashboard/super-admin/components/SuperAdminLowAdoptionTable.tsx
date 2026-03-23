// SuperAdminLowAdoptionTable.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { ChartCard } from "../../widgets/cards/ChartCard";
import { getLowAdoptionUniversities } from "../actions";
import { AlertTriangle, Users, CalendarCheck2, XCircle, ArrowUpDown } from "lucide-react";

type Preset = "30d" | "90d" | "180d" | "all";
type Level = "all" | "low" | "medium" | "good";
type SortKey = "bookingsPerStudent" | "cancellationRate" | "totalBookings";

type AdoptionItem = {
    universityName: string;
    totalBookings: number;
    cancellations: number;
    cancellationRate: number;
    totalStudents: number;
    bookingsPerStudent: number;
};

const PRESET_LABELS: Record<Preset, string> = { "30d": "30 วัน", "90d": "90 วัน", "180d": "180 วัน", all: "ทั้งหมด" };
const LEVEL_LABELS: Record<Level, string> = { all: "ทุกระดับ", low: "ต่ำ", medium: "ปานกลาง", good: "ดี" };

export function SuperAdminLowAdoptionTable() {
    const [raw, setRaw] = useState<AdoptionItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [preset, setPreset] = useState<Preset>("90d");
    const [level, setLevel] = useState<Level>("all");
    const [sortKey, setSortKey] = useState<SortKey>("bookingsPerStudent");

    const load = useCallback((p: Preset) => {
        setLoading(true);
        getLowAdoptionUniversities(p)
            .then(setRaw)
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { load(preset); }, [preset, load]);

    const getAdoptionLevel = (bps: number): Level => {
        if (bps >= 0.5) return "good";
        if (bps >= 0.1) return "medium";
        return "low";
    };

    const getAdoptionBadge = (bps: number) => {
        if (bps >= 0.5) return { label: "ดี", className: "bg-emerald-50 text-emerald-700 border-emerald-200" };
        if (bps >= 0.1) return { label: "ปานกลาง", className: "bg-amber-50 text-amber-700 border-amber-200" };
        return { label: "ต่ำ", className: "bg-red-50 text-red-700 border-red-200" };
    };

    const getCancelBadge = (rate: number) => {
        if (rate <= 10) return "text-emerald-600";
        if (rate <= 25) return "text-amber-600";
        return "text-red-600 font-bold";
    };

    // Filter by level
    const filtered = level === "all" ? raw : raw.filter(r => getAdoptionLevel(r.bookingsPerStudent) === level);

    // Sort
    const sorted = [...filtered].sort((a, b) => {
        if (sortKey === "cancellationRate") return b.cancellationRate - a.cancellationRate;
        if (sortKey === "totalBookings") return a.totalBookings - b.totalBookings;
        return a.bookingsPerStudent - b.bookingsPerStudent;
    });

    return (
        <ChartCard
            title="มหาวิทยาลัยที่ต้องเฝ้าระวัง"
            subtitle={`อัตราการใช้งานต่อนิสิต และอัตราการยกเลิกนัดหมาย (${PRESET_LABELS[preset]}ย้อนหลัง)`}
            loading={loading}
            isEmpty={sorted.length === 0}
            action={
                <div className="flex flex-wrap items-center gap-2">
                    {/* Date Preset */}
                    <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">ช่วงเวลา</span>
                        {(Object.keys(PRESET_LABELS) as Preset[]).map(p => (
                            <button
                                key={p}
                                onClick={() => setPreset(p)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${preset === p
                                        ? "bg-indigo-500 text-white shadow-sm"
                                        : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                                    }`}
                            >
                                {PRESET_LABELS[p]}
                            </button>
                        ))}
                    </div>

                    <div className="w-px h-5 bg-slate-200" />

                    {/* Level Filter */}
                    <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">ระดับ</span>
                        {(Object.keys(LEVEL_LABELS) as Level[]).map(l => (
                            <button
                                key={l}
                                onClick={() => setLevel(l)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${level === l
                                        ? "bg-indigo-500 text-white shadow-sm"
                                        : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                                    }`}
                            >
                                {LEVEL_LABELS[l]}
                            </button>
                        ))}
                    </div>

                    <div className="w-px h-5 bg-slate-200" />

                    {/* Sort */}
                    <select
                        value={sortKey}
                        onChange={e => setSortKey(e.target.value as SortKey)}
                        className="text-[11px] font-bold text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-300"
                    >
                        <option value="bookingsPerStudent">เรียงตาม B/S Ratio ↑</option>
                        <option value="cancellationRate">เรียงตาม % ยกเลิก ↓</option>
                        <option value="totalBookings">เรียงตาม Bookings น้อยสุด ↑</option>
                    </select>
                </div>
            }
        >
            <div className="w-full overflow-x-auto -mx-2">
                {/* Summary badges */}
                <div className="flex items-center gap-3 mb-3 px-2">
                    <span className="text-[11px] text-slate-400 font-semibold">
                        แสดง <strong className="text-slate-600">{sorted.length}</strong> จาก {raw.length} มหาวิทยาลัย
                    </span>
                    {level !== "all" && (
                        <button
                            onClick={() => setLevel("all")}
                            className="text-[10px] font-bold text-indigo-500 hover:text-indigo-700 underline"
                        >
                            ล้างตัวกรอง
                        </button>
                    )}
                </div>

                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                            <th className="text-left py-2.5 px-3">มหาวิทยาลัย</th>
                            <th className="text-center py-2.5 px-2 whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1"><Users className="w-3 h-3" /> นิสิต</div>
                            </th>
                            <th className="text-center py-2.5 px-2 whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1"><CalendarCheck2 className="w-3 h-3" /> Bookings</div>
                            </th>
                            <th className="text-center py-2.5 px-2 whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1"><XCircle className="w-3 h-3" /> ยกเลิก</div>
                            </th>
                            <th className="text-center py-2.5 px-2">B/S Ratio</th>
                            <th className="text-center py-2.5 px-2">ระดับ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.map((row, i) => {
                            const badge = getAdoptionBadge(row.bookingsPerStudent);
                            return (
                                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                    <td className="py-2.5 px-3 text-xs font-semibold text-slate-700 max-w-[200px] truncate">
                                        {row.bookingsPerStudent < 0.1 && (
                                            <AlertTriangle className="w-3.5 h-3.5 text-red-400 inline mr-1.5" />
                                        )}
                                        {row.universityName}
                                    </td>
                                    <td className="text-center py-2.5 px-2 text-xs text-slate-500 tabular-nums">{row.totalStudents.toLocaleString()}</td>
                                    <td className="text-center py-2.5 px-2 text-xs text-slate-600 font-semibold tabular-nums">{row.totalBookings.toLocaleString()}</td>
                                    <td className={`text-center py-2.5 px-2 text-xs tabular-nums ${getCancelBadge(row.cancellationRate)}`}>
                                        {row.cancellationRate}%
                                    </td>
                                    <td className="text-center py-2.5 px-2 text-xs text-slate-600 font-mono tabular-nums">{row.bookingsPerStudent}</td>
                                    <td className="text-center py-2.5 px-2">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.className}`}>
                                            {badge.label}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </ChartCard>
    );
}
