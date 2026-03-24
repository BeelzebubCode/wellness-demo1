"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import Image from "next/image";
import {
    ArrowLeft, Users, MapPin, Network,
    BarChart3, ChevronRight, X, Trophy,
    CalendarCheck2, UserX, ShieldAlert,
    TrendingUp, Lightbulb, Calendar, CheckCircle2,
    AlertCircle, TrendingDown, ArrowRightLeft, GraduationCap,
    LayoutDashboard,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

// Story components (self-contained, with own filters)
import GenericBookingStory from "../../shared/GenericBookingStory";
import GenericRiskStory from "../../shared/GenericRiskStory";
import GenericProblemStory from "../../shared/GenericProblemStory";
import GenericIncomeChart from "../../shared/GenericIncomeChart";
import GenericParentalStatusChart from "../../shared/GenericParentalStatusChart";
import { DataStoryGrid } from "../../widgets/story/DataStoryGrid";
import { ChartCard } from "../../widgets/cards/ChartCard";
import { prefetchAllStories } from "../../shared/story-utils";

const UniversityNetworkMap = dynamic(
    () => import("./map/UniversityNetworkMap").then((mod) => mod.UniversityNetworkMap),
    { ssr: false }
);

interface UniversityDetailProps {
    universityCode: string;
}

// ─── KPI Stats Card (Dean-style, with time presets) ────────────────────────
const STORY_BASE = "/api/v2/dashboards/ministry/story";

type Preset = "7d" | "30d" | "90d" | "all";
const PRESETS: { value: Preset; label: string }[] = [
    { value: "7d", label: "7 วัน" },
    { value: "30d", label: "30 วัน" },
    { value: "90d", label: "90 วัน" },
    { value: "all", label: "ทั้งหมด" },
];

function presetToRange(preset: Preset): { start?: string; end?: string; allTime: boolean } {
    if (preset === "all") return { allTime: true };
    const days = preset === "7d" ? 7 : preset === "30d" ? 30 : 90;
    const end = new Date();
    const start = new Date(); start.setDate(start.getDate() - days);
    return {
        allTime: false,
        start: start.toISOString().split("T")[0],
        end: end.toISOString().split("T")[0],
    };
}

interface UniStats {
    totalBookings: number;
    completedCount: number;
    cancelledCount: number;
    noShowCount: number;
}

function UniStatsCards({ universityId }: { universityId: number }) {
    const [stats, setStats] = useState<UniStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [preset, setPreset] = useState<Preset>("30d");

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const { allTime, start, end } = presetToRange(preset);
                const params = new URLSearchParams({ story: "bookings", university_ids: String(universityId) });
                if (allTime) params.set("all_time", "true");
                else { if (start) params.set("date_start", start); if (end) params.set("date_end", end); }
                const res = await fetch(`${STORY_BASE}?${params}`, { credentials: "include" });
                const json = await res.json();
                if (cancelled) return;
                const d = json.data?.bookings ?? {};
                setStats({
                    totalBookings: d.totalBookings ?? 0,
                    completedCount: d.completedCount ?? 0,
                    cancelledCount: d.cancelledCount ?? 0,
                    noShowCount: d.noShowCount ?? 0,
                });
            } catch { /* silent */ } finally { if (!cancelled) setLoading(false); }
        })();
        return () => { cancelled = true; };
    }, [preset, universityId]);

    const total = stats?.totalBookings ?? 0;
    const successRate = total > 0 ? Math.round(((stats?.completedCount ?? 0) / total) * 100) : 0;
    const noShowRate = total > 0 ? Math.round(((stats?.noShowCount ?? 0) / total) * 100) : 0;
    const cancelledCount = stats?.cancelledCount ?? 0;

    const cards = [
        {
            label: "การนัดหมายทั้งหมด",
            value: loading ? "—" : total.toLocaleString(), unit: loading ? "" : "ครั้ง",
            icon: <Calendar className="w-5 h-5 text-cyan-500" />,
            bg: "bg-cyan-50", border: "border-cyan-100", text: "text-cyan-600", sub: "",
        },
        {
            label: "อัตราสำเร็จ",
            value: loading ? "—" : `${successRate}%`, unit: "",
            icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
            bg: "bg-emerald-50", border: "border-emerald-100", text: "text-emerald-600",
            sub: loading ? "" : `${(stats?.completedCount ?? 0).toLocaleString()} ครั้งสำเร็จ`,
        },
        {
            label: "ยกเลิกนัดหมาย",
            value: loading ? "—" : cancelledCount.toLocaleString(), unit: loading ? "" : "ครั้ง",
            icon: <AlertCircle className="w-5 h-5 text-rose-500" />,
            bg: "bg-rose-50", border: "border-rose-100", text: "text-rose-600",
            sub: "",
        },
        {
            label: "อัตราไม่มาตามนัด",
            value: loading ? "—" : `${noShowRate}%`, unit: "",
            icon: <TrendingDown className="w-5 h-5 text-amber-500" />,
            bg: !loading && noShowRate > 20 ? "bg-rose-50" : "bg-amber-50",
            border: !loading && noShowRate > 20 ? "border-rose-100" : "border-amber-100",
            text: !loading && noShowRate > 20 ? "text-rose-600" : "text-amber-600",
            sub: loading ? "" : `${(stats?.noShowCount ?? 0).toLocaleString()} ครั้ง`,
        },
    ];

    return (
        <div className="space-y-3">
            {/* Preset tabs */}
            <div className="flex items-center gap-2">
                {PRESETS.map(p => (
                    <button key={p.value} onClick={() => setPreset(p.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${preset === p.value
                            ? "bg-cyan-600 text-white border-cyan-600 shadow-sm"
                            : "bg-white text-slate-500 border-slate-200 hover:border-cyan-300 hover:text-cyan-600"
                            }`}>{p.label}</button>
                ))}
            </div>
            {/* KPI grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {cards.map((card, idx) => (
                    <div key={idx}
                        className={`relative overflow-hidden group rounded-2xl border ${card.border} ${card.bg} p-4 transition-all duration-300 hover:shadow-md`}>
                        <div className="absolute -right-2 -bottom-2 opacity-[0.07] group-hover:scale-110 transition-transform duration-500">
                            {React.cloneElement(card.icon as React.ReactElement<{ className: string }>, { className: "w-16 h-16" })}
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1 bg-white/80 rounded-lg shadow-sm">{card.icon}</div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-tight">{card.label}</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className={`text-2xl font-black ${card.text} tracking-tight tabular-nums`}>{card.value}</span>
                                {card.unit && <span className="text-xs font-bold text-slate-400">{card.unit}</span>}
                            </div>
                            {card.sub && <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{card.sub}</p>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Borrow Stats Card ─────────────────────────────────────────────────────
interface BorrowData {
    totalRequests: number;
    statusBreakdown: Record<string, number>;
    topSourceUniversities: { university_id: number; university_name_th: string; assignment_count: number }[];
    topSpecializations: { topic: string; count: number }[];
    organizationTypes: { org_name: string; count: number }[];
}

function UniBorrowStatsCard({ universityId }: { universityId: number }) {
    const [data, setData] = useState<BorrowData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/v2/dashboards/ministry/university-borrow-stats?university_id=${universityId}`, { credentials: "include" });
                const json = await res.json();
                if (!cancelled) setData(json.data ?? null);
            } catch { /* silent */ } finally { if (!cancelled) setLoading(false); }
        })();
        return () => { cancelled = true; };
    }, [universityId]);

    const STATUS_LABEL: Record<string, { label: string; color: string }> = {
        DRAFT: { label: "ร่าง", color: "bg-slate-100 text-slate-600" },
        SUBMITTED: { label: "ยื่นแล้ว", color: "bg-blue-100 text-blue-700" },
        APPROVED: { label: "อนุมัติ", color: "bg-emerald-100 text-emerald-700" },
        REJECTED: { label: "ปฏิเสธ", color: "bg-rose-100 text-rose-700" },
        ASSIGNED: { label: "จัดสรรแล้ว", color: "bg-indigo-100 text-indigo-700" },
        COMPLETED: { label: "เสร็จสิ้น", color: "bg-teal-100 text-teal-700" },
        CANCELLED: { label: "ยกเลิก", color: "bg-gray-100 text-gray-600" },
    };

    return (
        <ChartCard
            title="สถิติการยืมตัวที่ปรึกษา"
            subtitle="มหาวิทยาลัยนี้ยืมที่ปรึกษาจากที่ไหน ประเภทใด"
            loading={loading}
            isEmpty={!data || data.totalRequests === 0}
        >
            {data && (
                <div className="space-y-6 w-full">
                    {/* Status summary */}
                    <div>
                        <p className="text-xs font-bold text-slate-500 mb-2">คำขอยืมตัว {data.totalRequests} รายการ</p>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(data.statusBreakdown).map(([status, count]) => {
                                const meta = STATUS_LABEL[status] || { label: status, color: "bg-slate-100 text-slate-600" };
                                return (
                                    <span key={status} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${meta.color}`}>
                                        {meta.label} {count}
                                    </span>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Top source universities */}
                        {data.topSourceUniversities.length > 0 && (
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">มหาวิทยาลัยที่ยืมมา</p>
                                <div className="space-y-2">
                                    {data.topSourceUniversities.map((u, i) => (
                                        <div key={u.university_id} className="flex items-center gap-3 bg-slate-50 rounded-xl px-3 py-2">
                                            <span className="text-[10px] font-black text-slate-300 w-4">{i + 1}</span>
                                            <Image src={`/images/logo/${u.university_name_th}_logo.png`} alt="" width={24} height={24}
                                                className="w-6 h-6 rounded-full object-contain"
                                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                            <span className="text-xs font-bold text-slate-700 flex-1 truncate">{u.university_name_th}</span>
                                            <span className="text-xs font-black text-cyan-600">{u.assignment_count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Specializations */}
                        {data.topSpecializations.length > 0 && (
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">ความเชี่ยวชาญที่ยืม</p>
                                <div className="flex flex-wrap gap-2">
                                    {data.topSpecializations.map((s) => (
                                        <span key={s.topic} className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full text-[10px] font-bold">
                                            <GraduationCap className="w-3 h-3" /> {s.topic} ({s.count})
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Organization types */}
                    {data.organizationTypes.length > 0 && (
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">สังกัดที่ปรึกษาที่ยืม</p>
                            <div className="flex flex-wrap gap-2">
                                {data.organizationTypes.map((o) => (
                                    <span key={o.org_name} className="inline-flex items-center gap-1 bg-violet-50 text-violet-700 px-2.5 py-1 rounded-full text-[10px] font-bold">
                                        {o.org_name} ({o.count})
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </ChartCard>
    );
}


// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function UniversityDetailDashboard({ universityCode }: UniversityDetailProps) {
    const [university, setUniversity] = useState<any>(null);
    const [isUniLoading, setIsUniLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("dashboard");
    const [showRankings, setShowRankings] = useState(false);

    useEffect(() => {
        async function fetchUniversity() {
            try {
                const response = await fetch(`/api/v2/master/universities/${universityCode}`);
                if (response.ok) {
                    const data = await response.json();
                    setUniversity(data.university);
                }
            } catch (error) {
                console.error("Error fetching university:", error);
            } finally {
                setIsUniLoading(false);
            }
        }
        fetchUniversity();
    }, [universityCode]);

    // Memoize story API path with university_ids baked in
    const storyApiPath = useMemo(() => {
        if (!university?.university_id) return STORY_BASE;
        return `${STORY_BASE}?university_ids=${university.university_id}`;
    }, [university?.university_id]);

    // ── Prefetch all stories in one batch call to warm cache ──────────────
    useEffect(() => {
        if (university?.university_id) {
            prefetchAllStories(STORY_BASE, university.university_id);
        }
    }, [university?.university_id]);

    if (isUniLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center bg-slate-50/50 rounded-2xl">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
                    <p className="text-slate-400 text-sm animate-pulse">กำลังเตรียมข้อมูลแดชบอร์ด...</p>
                </div>
            </div>
        );
    }
    if (!university) return <div className="text-center py-20 text-slate-400">ไม่พบมหาวิทยาลัย</div>;

    const networkUniversities = (university.connections || [])
        .sort((a: any, b: any) => a.distance - b.distance)
        .slice(0, 10)
        .map((conn: any) => ({
            code: conn.universityCode,
            name: conn.universityName,
            logo: `/images/logo/${conn.universityCode}_logo.png`,
            students: conn.students || 0,
            dominantProblemCount: Math.round(conn.distance * 10) / 10,
        }));

    const tabs = [
        { id: "dashboard", label: "ภาพรวมทั้งหมด", icon: BarChart3 },
        { id: "network-map", label: "แผนที่เครือข่าย", icon: Network },
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 space-y-6 pb-12">
            {/* ── Premium Banner ─────────────── */}
            <div className="relative overflow-hidden rounded-2xl bg-[#0f172a] p-6 text-white shadow-2xl">
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
                <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-primary-600/5 blur-3xl" />

                <Link href="/ministry/universities"
                    className="relative z-10 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-white/90 hover:bg-white/20 hover:text-white transition-all text-sm font-medium border border-white/10 mb-6 group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    กลับหน้าหลัก
                </Link>

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        <div className="relative shrink-0">
                            <div className="absolute -inset-3 bg-primary/20 rounded-[1.5rem] blur-xl animate-pulse" />
                            <div className="relative w-20 h-20 rounded-[1.5rem] bg-white p-1.5 shadow-2xl ring-1 ring-white/20">
                                <Image src={university.logo} alt={university.name} width={80} height={80}
                                    className="object-contain w-full h-full rounded-xl" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-lg border border-white flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-white animate-pulse" />ONLINE
                            </div>
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">{university.name}</h1>
                            <div className="flex flex-wrap items-center gap-3 text-white/60 text-sm font-bold uppercase tracking-widest">
                                <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-emerald-400" /> {university.province}</span>
                                <span className="h-1 w-1 rounded-full bg-primary/40" />
                                <span className="flex items-center gap-1.5"><Network className="w-3.5 h-3.5 text-amber-400" /> {university.regionNameTh || "ประเทศไทย"}</span>
                                <span className="h-1 w-1 rounded-full bg-primary/40" />
                                <span className="text-primary">MINISTRY PORTAL</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-4 self-stretch md:self-auto">
                        <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1 opacity-70">สถานะปัจจุบัน</p>
                            <div className="text-sm font-bold flex items-center gap-2 justify-end">
                                อัปเดตล่าสุด: {new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })} เวลา {new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md rounded-full px-4 py-2 border border-white/10">
                                <Users className="h-4 w-4 text-primary" />
                                <span className="text-xs font-black">{university.students?.toLocaleString()} นิสิต</span>
                            </div>
                            <div className="flex items-center gap-2 bg-emerald-500/10 backdrop-blur-md rounded-full px-4 py-2 border border-emerald-500/20">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-xs font-black text-emerald-400">เปิดการใช้งานปกติ</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Tab Navigation ─────────────── */}
            <div className="mb-4 border-b border-slate-200">
                <div className="flex gap-10">
                    {tabs.map((tab) => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`relative pb-4 text-sm font-black transition-all ${activeTab === tab.id ? "text-primary" : "text-slate-400 hover:text-slate-600"}`}>
                            <div className="flex items-center gap-2">
                                <tab.icon className="h-4 w-4" />{tab.label}
                            </div>
                            {activeTab === tab.id && <div className="absolute bottom-0 left-0 h-1 w-full rounded-full bg-primary" />}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Content ─────────────── */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {activeTab === "dashboard" && (
                    <div className="space-y-6">

                        {/* Section 1: KPI Stats */}
                        <section>
                            <div className="mb-3 flex items-center gap-2">
                                <LayoutDashboard className="h-4 w-4 text-cyan-500" />
                                <h3 className="text-lg font-black text-slate-800">ภาพรวมสถิติ</h3>
                                <span className="text-xs text-slate-400 font-medium">— มีตัวกรองช่วงเวลาของตัวเอง</span>
                            </div>
                            <UniStatsCards universityId={university.university_id} />
                        </section>

                        {/* Section 2-3: Bookings + Risk */}
                        <DataStoryGrid cols={2}>
                            <GenericBookingStory apiPath={storyApiPath} title="ประวัติการใช้บริการ" delay={1}
                                description="ติดตามจำนวนการนัดหมาย อัตราร่วม แนวโน้มรายปีหรือรายเดือน — ใช้ประเมินความหนาแน่นและวางแผนจัดสรรบุคลากร" />
                            <GenericRiskStory apiPath={storyApiPath} title="การกระจายความเสี่ยง" delay={2}
                                description="สัดส่วนนิสิตที่ประเมินแล้วตกอยู่ในเกณฑ์เสี่ยง — เน้นช่วยเหลือกลุ่มเปราะบาง (วิกฤต/เสี่ยงสูง) ก่อน" />
                        </DataStoryGrid>

                        {/* Section 4: Problem (full width) */}
                        <GenericProblemStory apiPath={storyApiPath} title="ประเด็นปัญหา + โปรไฟล์นิสิต" delay={3}
                            description="ประเภทปัญหาที่นิสิตนำมาปรึกษา — ใช้วางแผนจัดกิจกรรม โครงการ หรือ workshop" />

                        {/* Section 5: Cancellation Story (full width — filtered via the story) */}
                        <GenericBookingStory apiPath={storyApiPath} title="สถิติการยกเลิก + เหตุผล" delay={4}
                            description="ติดตามการยกเลิกนัดหมายและเหตุผล — เพื่อวิเคราะห์สาเหตุและลดอัตราการยกเลิก" />

                        {/* Section 6: Borrow Stats */}
                        <section>
                            <div className="mb-3 flex items-center gap-2">
                                <ArrowRightLeft className="h-4 w-4 text-indigo-500" />
                                <h3 className="text-lg font-black text-slate-800">สถิติการยืมตัวที่ปรึกษา</h3>
                            </div>
                            <UniBorrowStatsCard universityId={university.university_id} />
                        </section>

                        {/* Section 7: Income Chart (full width) */}
                        <GenericIncomeChart apiPath={storyApiPath} title="รายได้ครอบครัวนิสิต" delay={5} />
                        <GenericParentalStatusChart apiPath={storyApiPath} title="สถานะบิดามารดานิสิต" delay={6} />
                    </div>
                )}

                {activeTab === "network-map" && (
                    <NetworkMapContent
                        university={university}
                        networkUniversities={networkUniversities}
                        showRankings={showRankings}
                        setShowRankings={setShowRankings}
                    />
                )}
            </div>

            {/* ── Footer ─────────────── */}
            <div className="pt-12 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400">
                <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-500">{university.name}</span>
                    <span className="hidden md:inline w-1 h-1 bg-slate-300 rounded-full" />
                    <span>ข้อมูล ณ {new Date().toLocaleDateString('th-TH')}</span>
                </div>
                <span className="px-2 py-1 bg-slate-100 rounded text-slate-500 font-mono text-[10px] uppercase tracking-widest font-bold">Confidential</span>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// NETWORK MAP SUB-COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function NetworkMapContent({ university, networkUniversities, showRankings, setShowRankings }: any) {
    return (
        <div className="relative h-[700px] w-full bg-slate-50 rounded-3xl overflow-hidden shadow-sm border border-border group">
            <UniversityNetworkMap
                universityCode={university.code || "CU"}
                centerLat={university.lat}
                centerLng={university.lng}
                connections={university.connections}
                hideInternalPanel={true}
            />

            {/* Top 10 Toggle Button */}
            <div className="absolute top-6 left-6 z-[400]">
                <AnimatePresence>
                    {!showRankings && (
                        <motion.button
                            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                            onClick={() => setShowRankings(true)}
                            className="flex items-center gap-3 px-5 py-3 bg-card/90 backdrop-blur-xl text-fg font-bold text-sm rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all border border-border ring-1 ring-black/5 group">
                            <div className="p-2 bg-gradient-to-br from-primary to-accent rounded-xl text-white shadow-lg shadow-primary/30">
                                <Trophy className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <div className="text-[10px] text-muted font-semibold uppercase tracking-wider">NETWORK</div>
                                <div className="leading-tight">แสดง 10 อันดับใกล้เคียง</div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted group-hover:text-primary group-hover:translate-x-1 transition-transform" />
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            {/* Slide-over Sidebar Panel */}
            <AnimatePresence>
                {showRankings && (
                    <motion.div
                        initial={{ x: "-100%", opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: "-100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="absolute top-4 left-4 bottom-4 w-96 bg-card/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/50 z-[500] flex flex-col overflow-hidden ring-1 ring-black/5">
                        <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-white/50">
                            <div>
                                <h3 className="font-bold text-fg flex items-center gap-2 text-lg">
                                    <Trophy className="w-5 h-5 text-yellow-500" /> 10 อันดับใกล้เคียง
                                </h3>
                                <p className="text-xs text-muted mt-0.5">เรียงตามระยะทาง (Proximity)</p>
                            </div>
                            <button onClick={() => setShowRankings(false)}
                                className="p-2 hover:bg-slate-100 rounded-full text-muted hover:text-fg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-2">
                            {networkUniversities.map((uni: any, idx: number) => (
                                <div key={uni.code} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-2xl transition-colors cursor-default group">
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shadow-sm ${idx === 0 ? "bg-yellow-400 text-yellow-900 shadow-yellow-200" : idx === 1 ? "bg-slate-300 text-slate-800" : idx === 2 ? "bg-orange-300 text-orange-900 shadow-orange-200" : "bg-card border border-border text-muted"}`}>
                                        {idx + 1}
                                    </div>
                                    <div className="relative w-10 h-10 rounded-full bg-card border border-border p-0.5 shadow-sm">
                                        <Image src={uni.logo} alt={uni.name} width={40} height={40} className="object-contain w-full h-full rounded-full" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-bold text-fg truncate group-hover:text-primary transition-colors">{uni.name}</div>
                                        <div className="flex items-center gap-3 mt-1">
                                            <div className="text-xs text-muted flex items-center gap-1">
                                                <MapPin className="w-3 h-3" /> {uni.dominantProblemCount} km
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
