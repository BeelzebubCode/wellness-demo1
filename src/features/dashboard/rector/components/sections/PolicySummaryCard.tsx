"use client";

import React, { useState, useEffect } from "react";
import { Lightbulb, Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { RectorDashboardFilters } from "../../types";

const API = "/api/v2/dashboards/rector/story";

interface StoryData {
    staffUtilization?: { internal: number; borrowed: number };
    totalBookings?: number;
    completedCount?: number;
    noShowCount?: number;
    riskDistribution?: { high: number; medium: number; low: number };
}

interface Props {
    globalFilters?: RectorDashboardFilters;
}

function generateRecommendations(data: StoryData): { text: string; type: "up" | "down" | "neutral" }[] {
    const recs: { text: string; type: "up" | "down" | "neutral" }[] = [];

    const staff = data.staffUtilization;
    if (staff) {
        const total = staff.internal + staff.borrowed;
        if (total > 0) {
            const borrowPct = Math.round((staff.borrowed / total) * 100);
            if (borrowPct > 30) {
                recs.push({
                    text: `มีการยืมจิตแพทย์สูงถึง ${borrowPct}% — แนะนำให้พิจารณาเพิ่มอัตรากำลังภายในเพื่อความยั่งยืน`,
                    type: "up",
                });
            } else if (borrowPct > 0) {
                recs.push({
                    text: `ระดับการยืมตัวบุคลากรอยู่ที่ ${borrowPct}% — อยู่ในเกณฑ์บริหารจัดการได้`,
                    type: "neutral",
                });
            }
            if (staff.borrowed === 0 && staff.internal > 0) {
                recs.push({
                    text: "บุคลากรภายในเพียงพอ — ไม่มีความจำเป็นต้องยืมตัวจิตแพทย์จากภายนอก",
                    type: "neutral",
                });
            }
        }
    }

    const bookings = data.totalBookings ?? 0;
    const noShow = data.noShowCount ?? 0;
    if (bookings > 0) {
        const noShowPct = Math.round((noShow / bookings) * 100);
        if (noShowPct > 20) {
            recs.push({
                text: `อัตราไม่มาตามนัดสูง (${noShowPct}%) — ควรพัฒนาระบบแจ้งเตือนผ่าน SMS/Email เพื่อลดการเสียโอกาส`,
                type: "down",
            });
        }
    }

    const risk = data.riskDistribution;
    if (risk && risk.high > 0) {
        recs.push({
            text: `พบนิสิตกลุ่มเสี่ยงสูง ${risk.high} ราย — จำเป็นต้องได้รับการติดตาม (Follow-up) อย่างเร่งด่วน`,
            type: "up",
        });
    }

    if (recs.length === 0) {
        recs.push({
            text: "สถานการณ์ปัจจุบันอยู่ในเกณฑ์ปกติ — ยังไม่มีประเด็นที่ต้องดำเนินการเชิงนโยบายเป็นพิเศษ",
            type: "neutral",
        });
    }

    return recs;
}

export default function PolicySummaryCard({ globalFilters }: Props) {
    const [recs, setRecs] = useState<{ text: string; type: "up" | "down" | "neutral" }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                params.append("story", "all");
                
                if (globalFilters) {
                    if (globalFilters.startDate) params.append("start_date", globalFilters.startDate.toISOString().split('T')[0]);
                    if (globalFilters.endDate) params.append("end_date", globalFilters.endDate.toISOString().split('T')[0]);
                    if (globalFilters.facultyId) params.append("faculty_ids", globalFilters.facultyId.toString());
                    if (globalFilters.departmentId) params.append("department_ids", globalFilters.departmentId.toString());
                    if (globalFilters.problemCategoryId) params.append("problem_category_ids", globalFilters.problemCategoryId.toString());
                    if (globalFilters.gender) params.append("gender", globalFilters.gender);
                }

                if (!globalFilters?.startDate) {
                    params.append("all_time", "true");
                }

                const res = await fetch(`${API}?${params.toString()}`, { credentials: "include" });
                const json = await res.json();
                const d = json.data ?? {};
                const storyData: StoryData = {
                    staffUtilization: d.staffUtilization,
                    totalBookings: d.bookings?.totalBookings,
                    completedCount: d.bookings?.completedCount,
                    noShowCount: d.bookings?.noShowCount,
                    riskDistribution: d.risk?.riskDistribution,
                };
                setRecs(generateRecommendations(storyData));
            } catch (error) {
                console.error("Failed to fetch policy summary data:", error);
            } finally {
                setLoading(false);
            }
        })();
    }, [globalFilters]);

    const Icon = ({ type }: { type: string }) => {
        if (type === "up") return <div className="p-1.5 rounded-lg bg-amber-50"><TrendingUp className="w-4 h-4 text-amber-500" /></div>;
        if (type === "down") return <div className="p-1.5 rounded-lg bg-rose-50"><TrendingDown className="w-4 h-4 text-rose-500" /></div>;
        return <div className="p-1.5 rounded-lg bg-emerald-50"><Minus className="w-4 h-4 text-emerald-500" /></div>;
    };

    return (
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-6 animate-[fadeUp_0.5s_ease-out_both]"
            style={{ animationDelay: "300ms" }}>
            <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 grid place-items-center shadow-lg shadow-emerald-200">
                    <Lightbulb className="h-5 w-5 text-white" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-slate-800 tracking-tight">สรุปนโยบาย & คำแนะนำ</h2>
                    <p className="text-xs text-slate-400">การวิเคราะห์เชิงลึกเพื่อสนับสนุนการตัดสินใจ</p>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-10 grayscale opacity-50">
                    <Loader2 className="w-6 h-6 text-emerald-500 animate-spin mb-2" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">วิเคราะห์ข้อมูล...</span>
                </div>
            ) : (
                <div className="space-y-4">
                    {recs.map((rec, idx) => (
                        <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50/50 border border-slate-100 transition-colors hover:bg-slate-50">
                            <div className="mt-0.5 shrink-0">
                                <Icon type={rec.type} />
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed font-medium">{rec.text}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
