"use client";

import React, { useState, useEffect } from "react";
import { Lightbulb, Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";

const API = "/api/v2/dashboards/rector/story";

interface PolicyRec {
    icon: string;
    text: string;
    type: "danger" | "warn" | "ok";
}

function buildRecs(data: Record<string, unknown>): PolicyRec[] {
    const recs: PolicyRec[] = [];

    const bookings = (data.bookings as { totalBookings?: number; noShowCount?: number; pendingCount?: number }) ?? {};
    const risk = (data.risk as { highRiskCount?: number }) ?? {};
    const staff = (data.staffUtilization as { internal?: number; borrowed?: number }) ?? {};

    const total = bookings.totalBookings ?? 0;
    const noShow = bookings.noShowCount ?? 0;
    const pending = bookings.pendingCount ?? 0;

    if (total > 0) {
        const noShowPct = Math.round((noShow / total) * 100);
        if (noShowPct > 20) recs.push({ icon: "🔴", type: "danger", text: `อัตราไม่มาตามนัดสูง (${noShowPct}%) — ควรพัฒนาระบบแจ้งเตือน SMS/Email` });
        else if (noShowPct > 10) recs.push({ icon: "🟡", type: "warn", text: `อัตราไม่มาตามนัด ${noShowPct}% — ควรติดตามสาเหตุ` });
        else recs.push({ icon: "🟢", type: "ok", text: `อัตราไม่มาตามนัดดี (${noShowPct}%) — อยู่ในเกณฑ์ปกติ` });
    }

    const highRisk = risk.highRiskCount ?? 0;
    if (highRisk > 0) recs.push({ icon: "🔴", type: "danger", text: `พบนิสิตกลุ่มเสี่ยงสูง ${highRisk.toLocaleString()} ราย — ต้องติดตาม Follow-up ด่วน` });

    const staffTotal = (staff.internal ?? 0) + (staff.borrowed ?? 0);
    if (staffTotal > 0) {
        const borrowPct = Math.round(((staff.borrowed ?? 0) / staffTotal) * 100);
        if (borrowPct > 30) recs.push({ icon: "🔴", type: "danger", text: `ยืมบุคลากรสูง ${borrowPct}% — ต้องพิจารณาเพิ่มอัตรากำลังภายใน` });
        else if (borrowPct > 0) recs.push({ icon: "🟡", type: "warn", text: `ยืมบุคลากร ${borrowPct}% — อยู่ในเกณฑ์บริหารจัดการได้` });
    }

    if (pending > 0) recs.push({ icon: "🟡", type: "warn", text: `มีการนัดหมายรอดำเนินการ ${pending.toLocaleString()} รายการ — ควรเร่งประสาน` });

    if (recs.length === 0) recs.push({ icon: "🟢", type: "ok", text: "สถานการณ์ปัจจุบันอยู่ในเกณฑ์ปกติ — ยังไม่มีประเด็นนโยบายเร่งด่วน" });
    return recs;
}

export default function PolicySummaryCard() {
    const [recs, setRecs] = useState<PolicyRec[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams({ story: "all", all_time: "true" });
                const res = await fetch(`${API}?${params.toString()}`, { credentials: "include" });
                const json = await res.json();
                if (!cancelled) setRecs(buildRecs(json.data ?? {}));
            } catch { /* silent */ } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const TypeIcon = ({ type }: { type: string }) => {
        if (type === "danger") return <div className="p-1.5 rounded-lg bg-rose-50"><TrendingUp className="w-3.5 h-3.5 text-rose-500" /></div>;
        if (type === "warn") return <div className="p-1.5 rounded-lg bg-amber-50"><TrendingDown className="w-3.5 h-3.5 text-amber-500" /></div>;
        return <div className="p-1.5 rounded-lg bg-emerald-50"><Minus className="w-3.5 h-3.5 text-emerald-500" /></div>;
    };

    return (
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-6 animate-[fadeUp_0.5s_ease-out_both]" style={{ animationDelay: "300ms" }}>
            <div className="flex items-center gap-3 mb-5">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 grid place-items-center shadow-lg shadow-emerald-200">
                    <Lightbulb className="h-5 w-5 text-white" />
                </div>
                <div>
                    <h2 className="text-base font-bold text-slate-800">สรุปนโยบาย & คำแนะนำ</h2>
                    <p className="text-xs text-slate-400">วิเคราะห์จากข้อมูลจริงเพื่อสนับสนุนการตัดสินใจ</p>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-10 opacity-50">
                    <Loader2 className="w-6 h-6 text-emerald-500 animate-spin mr-2" />
                    <span className="text-xs text-slate-400 font-bold">วิเคราะห์ข้อมูล...</span>
                </div>
            ) : (
                <div className="space-y-2.5">
                    {recs.map((rec, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/60 border border-slate-100 hover:bg-slate-50 transition-colors">
                            <div className="shrink-0 mt-0.5"><TypeIcon type={rec.type} /></div>
                            <div className="flex items-start gap-2">
                                <span className="text-sm leading-none mt-0.5">{rec.icon}</span>
                                <p className="text-sm text-slate-600 leading-relaxed font-medium">{rec.text}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
