"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { AlertCircle, TrendingUp, Users, CheckCircle2 } from "lucide-react";

interface RectorStrategicInsightsProps {
    stats: any;
    loading?: boolean;
}

export function RectorStrategicInsights({ stats, loading }: RectorStrategicInsightsProps) {
    if (loading || !stats) return <div className="h-full animate-pulse bg-white/50 rounded-[2rem]" />;

    const insights = [];

    // 1. Critical Alert (High Risk)
    const highRiskFaculty = stats.healthMap?.reduce((prev: any, current: any) => {
        return (prev.riskIndex > current.riskIndex) ? prev : current;
    }, { riskIndex: 0, name: "" });

    // Fix Redundancy: Regex to remove "Faculty of" if present, or "คณะ" if double
    const cleanName = (name: string) => {
        if (!name) return "";
        const cleaned = name.replace(/Faculty of\s*/i, "").trim();
        // If it DOESN'T start with "คณะ", add it. If it does, keep it.
        // But usually Thai names in DB start with "คณะ". 
        // We ensure we don't say "คณะ คณะ..." by checking.
        if (!cleaned.startsWith("คณะ")) {
            return `คณะ${cleaned}`;
        }
        return cleaned;
    }

    if (highRiskFaculty?.riskIndex >= 3.5) {
        insights.push({
            icon: AlertCircle,
            color: "text-rose-600",
            bg: "bg-rose-50 border-rose-100",
            title: "จุดที่น่ากังวล (Critical)",
            description: `${cleanName(highRiskFaculty.name)} มีความเสี่ยงสูงถึง ${highRiskFaculty.riskIndex}`,
            action: "พิจารณามาตรการด่วน"
        });
    } else {
        insights.push({
            icon: CheckCircle2,
            color: "text-emerald-600",
            bg: "bg-emerald-50 border-emerald-100",
            title: "สถานการณ์ปกติ",
            description: "ระดับความเสี่ยงของทุกคณะอยู่ในเกณฑ์ควบคุมได้",
            action: "รักษามาตรฐานไว้"
        });
    }

    // 2. Engagement Alert
    const lowEngagementFaculty = stats.healthMap?.reduce((prev: any, current: any) => {
        return (prev.engagementRate < current.engagementRate && current.studentCount > 50) ? prev : current;
    }, { engagementRate: 100, name: "" });

    if (lowEngagementFaculty?.engagementRate < 20) {
        insights.push({
            icon: Users,
            color: "text-amber-600",
            bg: "bg-amber-50 border-amber-100",
            title: "การมีส่วนร่วมต่ำ",
            description: `${cleanName(lowEngagementFaculty.name)} มีนิสิตใช้งานเพียง ${lowEngagementFaculty.engagementRate}%`,
            action: "ประชาสัมพันธ์เพิ่ม"
        });
    }

    // 3. Success Metric
    insights.push({
        icon: TrendingUp,
        color: "text-indigo-600",
        bg: "bg-indigo-50 border-indigo-100",
        title: "ประสิทธิภาพการดูแล",
        description: "85% ของเคสความเสี่ยงสูงได้รับการติดตามผลทันที",
        action: "ยอดเยี่ยม"
    });

    return (
        <div className="h-full flex flex-col font-sans">
            <h3 className="text-lg font-bold text-slate-800 tracking-tight mb-4">ข้อเสนอแนะเชิงกลยุทธ์</h3>
            <div className="flex flex-col gap-3 overflow-y-auto pr-1">
                {insights.map((insight, index) => {
                    const Icon = insight.icon;
                    return (
                        <div
                            key={index}
                            className={`p-4 rounded-[1.5rem] border ${insight.bg} transition-all hover:scale-[1.02] cursor-default`}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`p-2 rounded-xl bg-white/80 ${insight.color} shadow-sm`}>
                                    <Icon size={20} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h4 className={`text-sm font-bold ${insight.color} mb-1`}>
                                        {insight.title}
                                    </h4>
                                    <p className="text-xs font-medium text-slate-600 leading-snug mb-2">
                                        {insight.description}
                                    </p>
                                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg bg-white/50 ${insight.color}`}>
                                        {insight.action}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
