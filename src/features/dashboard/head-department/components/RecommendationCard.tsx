// src/features/dashboard/head-department/components/RecommendationCard.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Lightbulb, Loader2, TrendingUp, TrendingDown, Minus, Sparkles } from "lucide-react";

const API = "/api/v2/dashboards/head-department";

interface StoryData {
    totalBookings?: number;
    completedCount?: number;
    noShowCount?: number;
    topProblems?: { name: string; count: number }[];
    riskDistribution?: { high: number; medium: number; low: number };
}

function generateRecommendations(data: StoryData): { text: string; type: "up" | "down" | "neutral" }[] {
    const recs: { text: string; type: "up" | "down" | "neutral" }[] = [];

    const bookings = data.totalBookings ?? 0;
    const noShow = data.noShowCount ?? 0;
    const completed = data.completedCount ?? 0;

    // No-show analysis
    if (bookings > 0) {
        const noShowPct = Math.round((noShow / bookings) * 100);
        if (noShowPct > 25) {
            recs.push({
                text: `อัตราไม่มาตามนัด ${noShowPct}% — ค่อนข้างสูง ควรพิจารณาจัดกิจกรรมส่งเสริมสุขภาพจิตเชิงรุก หรือระบบแจ้งเตือนก่อนนัดหมาย`,
                type: "down",
            });
        } else if (noShowPct > 10) {
            recs.push({
                text: `อัตราไม่มาตามนัด ${noShowPct}% — อยู่ในเกณฑ์ที่ควรติดตาม`,
                type: "neutral",
            });
        }
    }

    // Problem patterns
    const topProblems = data.topProblems ?? [];
    if (topProblems.length > 0) {
        const top = topProblems[0];
        if (top.count > 5) {
            recs.push({
                text: `ปัญหาที่พบมากที่สุดคือ "${top.name}" (${top.count} ครั้ง) — ควรพิจารณาจัดกิจกรรมหรือ workshop เฉพาะด้านนี้`,
                type: "up",
            });
        }
    }

    // Risk analysis
    const risk = data.riskDistribution;
    if (risk) {
        if (risk.high > 0) {
            recs.push({
                text: `พบนิสิตระดับความเสี่ยงสูง ${risk.high} คน — ควรจัดให้มีที่ปรึกษาเฉพาะทางดูแลกลุ่มนี้`,
                type: "up",
            });
        }
        if (risk.medium > risk.high * 3) {
            recs.push({
                text: `นิสิตความเสี่ยงปานกลาง (${risk.medium} คน) มีจำนวนมาก — ควรจัดกิจกรรมป้องกันเชิงรุกเพื่อไม่ให้เลื่อนไปความเสี่ยงสูง`,
                type: "neutral",
            });
        }
    }

    // Completion rate
    if (bookings > 0 && completed > 0) {
        const completePct = Math.round((completed / bookings) * 100);
        if (completePct > 80) {
            recs.push({
                text: `อัตราสำเร็จของการปรึกษา ${completePct}% — อยู่ในเกณฑ์ดี ให้คงกิจกรรมดูแลที่ทำอยู่ต่อไป`,
                type: "neutral",
            });
        }
    }

    if (recs.length === 0) {
        recs.push({
            text: "ภาพรวมอยู่ในเกณฑ์ปกติ — ยังไม่มีประเด็นเร่งด่วนที่ต้องดำเนินการเพิ่มเติม",
            type: "neutral",
        });
    }

    return recs;
}

export default function RecommendationCard({ delay = 0 }: { delay?: number }) {
    const [recs, setRecs] = useState<{ text: string; type: "up" | "down" | "neutral" }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const [bookingRes, riskRes, problemRes] = await Promise.all([
                    fetch(`${API}?story=bookings&all_time=true`, { credentials: "include" }),
                    fetch(`${API}?story=risk&all_time=true`, { credentials: "include" }),
                    fetch(`${API}?story=problems&all_time=true`, { credentials: "include" }),
                ]);

                const [bookingJson, riskJson, problemJson] = await Promise.all([
                    bookingRes.json(), riskRes.json(), problemRes.json(),
                ]);

                const storyData: StoryData = {
                    totalBookings: bookingJson.data?.bookings?.totalBookings,
                    completedCount: bookingJson.data?.bookings?.completedCount,
                    noShowCount: bookingJson.data?.bookings?.noShowCount,
                    riskDistribution: riskJson.data?.risk?.riskDistribution,
                    topProblems: problemJson.data?.problems?.topProblems,
                };
                setRecs(generateRecommendations(storyData));
            } catch { /* silent */ } finally {
                setLoading(false);
            }
        })();
    }, []);

    const IconFor = ({ type }: { type: string }) => {
        if (type === "up") return <TrendingUp className="w-4 h-4 text-amber-500" />;
        if (type === "down") return <TrendingDown className="w-4 h-4 text-red-500" />;
        return <Minus className="w-4 h-4 text-emerald-500" />;
    };

    return (
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-5 animate-[fadeUp_0.5s_ease-out_both]"
            style={{ animationDelay: `${delay * 100}ms` }}>
            <div className="flex items-center gap-3 mb-4">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 grid place-items-center shadow-lg shadow-amber-200">
                    <Sparkles className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                    <h2 className="text-base font-bold text-slate-800">สรุปผล & คำแนะนำ</h2>
                    <p className="text-[11px] text-slate-400">วิเคราะห์จากข้อมูลเพื่อเสนอแนวทางจัดกิจกรรม</p>
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
                                <IconFor type={rec.type} />
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed">{rec.text}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
