// src/features/dashboard/rector/components/sections/PolicySummaryCard.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Lightbulb, Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";

const API = "/api/v2/dashboards/rector/story";

interface StoryData {
    staffUtilization?: { internal: number; borrowed: number };
    totalBookings?: number;
    completedCount?: number;
    noShowCount?: number;
    riskDistribution?: { high: number; medium: number; low: number };
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
                    text: `มีการยืมจิตแพทย์ ${borrowPct}% ของทั้งหมด — ควรพิจารณาเพิ่มจิตแพทย์ภายในเพื่อลดการพึ่งพาจากภายนอก`,
                    type: "up",
                });
            } else if (borrowPct > 0) {
                recs.push({
                    text: `การยืมจิตแพทย์อยู่ที่ ${borrowPct}% — อยู่ในระดับปกติ สามารถรองรับได้`,
                    type: "neutral",
                });
            }
            if (staff.borrowed === 0 && staff.internal > 0) {
                recs.push({
                    text: "ไม่มีการยืมบุคลากร — จิตแพทย์ภายในเพียงพอต่อความต้องการ",
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
                text: `อัตราไม่มาตามนัด ${noShowPct}% — สูงกว่าเกณฑ์ ควรพิจารณาระบบเตือนนัดหมายหรือปรับเวลาที่เหมาะสม`,
                type: "down",
            });
        }
    }

    const risk = data.riskDistribution;
    if (risk && risk.high > 0) {
        recs.push({
            text: `พบนิสิตความเสี่ยงสูง ${risk.high} คน — ควรมีแผนดูแลเชิงรุกและติดตามใกล้ชิด`,
            type: "up",
        });
    }

    if (recs.length === 0) {
        recs.push({
            text: "ภาพรวมอยู่ในเกณฑ์ปกติ — ไม่มีประเด็นที่ต้องดำเนินการเร่งด่วน",
            type: "neutral",
        });
    }

    return recs;
}

export default function PolicySummaryCard() {
    const [recs, setRecs] = useState<{ text: string; type: "up" | "down" | "neutral" }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API}?story=all&all_time=true`, { credentials: "include" });
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
            } catch { /* silent */ } finally {
                setLoading(false);
            }
        })();
    }, []);

    const Icon = ({ type }: { type: string }) => {
        if (type === "up") return <TrendingUp className="w-4 h-4 text-amber-500" />;
        if (type === "down") return <TrendingDown className="w-4 h-4 text-red-500" />;
        return <Minus className="w-4 h-4 text-emerald-500" />;
    };

    return (
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-5 animate-[fadeUp_0.5s_ease-out_both]"
            style={{ animationDelay: "300ms" }}>
            <div className="flex items-center gap-3 mb-4">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 grid place-items-center shadow-lg shadow-emerald-200">
                    <Lightbulb className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                    <h2 className="text-base font-bold text-slate-800">สรุปนโยบาย & คำแนะนำ</h2>
                    <p className="text-[11px] text-slate-400">วิเคราะห์จากข้อมูลจริงเพื่อช่วยในการตัดสินใจ</p>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />
                </div>
            ) : (
                <div className="space-y-3">
                    {recs.map((rec, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="mt-0.5 shrink-0">
                                <Icon type={rec.type} />
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed">{rec.text}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
