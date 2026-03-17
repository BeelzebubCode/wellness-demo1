"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import Image from "next/image";
import {
    ArrowLeft, Users, MapPin, Network,
    BarChart3, ChevronRight, X, Trophy
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

// Analytics & Sub-components
import { useAnalytics } from "../../widgets/hooks/useAnalytics";
import { FacultyDateRangePicker } from "../../dean/components/FacultyDateRangePicker";
import { SummaryKPICards } from "../../widgets/cards/SummaryKPICards";
import { CancellationSummary } from "../../widgets/charts/CancellationSummary";

const LoadIndexChart = dynamic(
    () => import("../../widgets/charts/LoadIndexChart").then((m) => ({ default: m.LoadIndexChart })),
    { loading: () => <div className="h-80 bg-slate-50 animate-pulse rounded-xl" />, ssr: false },
);
const ProblemCategoryChart = dynamic(
    () => import("../../widgets/charts/ProblemCategoryChart").then((m) => ({ default: m.ProblemCategoryChart })),
    { loading: () => <div className="h-80 bg-slate-50 animate-pulse rounded-xl" />, ssr: false },
);
const AttendanceChart = dynamic(
    () => import("../../widgets/charts/AttendanceChart").then((m) => ({ default: m.AttendanceChart })),
    { loading: () => <div className="h-80 bg-slate-50 animate-pulse rounded-xl" />, ssr: false },
);
const RiskDistributionChart = dynamic(
    () => import("../../widgets/charts/RiskDistributionChart").then((m) => ({ default: m.RiskDistributionChart })),
    { loading: () => <div className="h-80 bg-slate-50 animate-pulse rounded-xl" />, ssr: false },
);
const TrendChart = dynamic(
    () => import("../../widgets/charts/TrendChart").then((m) => ({ default: m.TrendChart })),
    { loading: () => <div className="h-80 bg-slate-50 animate-pulse rounded-xl" />, ssr: false },
);

const UniversityNetworkMap = dynamic(
    () => import("./map/UniversityNetworkMap").then((mod) => mod.UniversityNetworkMap),
    { ssr: false }
);

interface UniversityDetailProps {
    universityCode: string;
}

export function UniversityDetailDashboard({ universityCode }: UniversityDetailProps) {
    const [university, setUniversity] = useState<any>(null);
    const [isUniLoading, setIsUniLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("dashboard");
    const [showRankings, setShowRankings] = useState(false);

    // Stable initial date range (30 days back)
    const [initialDates] = useState(() => {
        const to = new Date();
        to.setHours(23, 59, 59, 999);
        const from = new Date(to);
        from.setDate(from.getDate() - 30);
        from.setHours(0, 0, 0, 0);
        const toYMD = (d: Date) => d.toISOString().split('T')[0];
        return { from, to, date_start: toYMD(from), date_end: toYMD(to) };
    });

    const { data: analyticsData, loading: analyticsLoading, setParams } = useAnalytics({
        university_code: universityCode,
        date_start: initialDates.date_start,
        date_end: initialDates.date_end,
    });

    // Date range state for the picker UI
    const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
        from: initialDates.from,
        to: initialDates.to,
    });

    // Sync date picker changes → useAnalytics params
    const handleDateChange = (range: { from?: Date; to?: Date }) => {
        setDateRange(range);
        const toYMD = (d?: Date) => d ? d.toISOString().split('T')[0] : undefined;
        setParams({
            date_start: toYMD(range.from),
            date_end: toYMD(range.to),
        });
    };

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
        <div className="max-w-7xl mx-auto space-y-8 pb-12">
            {/* ── Premium Banner (matching HeadConsultant format) ─────────────── */}
            <div className="relative overflow-hidden rounded-[2rem] bg-[#0f172a] p-8 text-white shadow-2xl mb-8">
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
                <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-primary-600/5 blur-3xl" />

                {/* Back Button */}
                <Link
                    href="/ministry/universities"
                    className="relative z-10 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-white/90 hover:bg-white/20 hover:text-white transition-all text-sm font-medium border border-white/10 mb-6 group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    กลับหน้าหลัก
                </Link>

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        {/* University Logo */}
                        <div className="relative shrink-0">
                            <div className="absolute -inset-3 bg-primary/20 rounded-[1.5rem] blur-xl animate-pulse" />
                            <div className="relative w-20 h-20 rounded-[1.5rem] bg-white p-1.5 shadow-2xl ring-1 ring-white/20">
                                <Image
                                    src={university.logo}
                                    alt={university.name}
                                    width={80}
                                    height={80}
                                    className="object-contain w-full h-full rounded-xl"
                                />
                            </div>
                            <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-lg border border-white flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                                ONLINE
                            </div>
                        </div>

                        <div>
                            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">
                                {university.name}
                            </h1>
                            <div className="flex flex-wrap items-center gap-3 text-white/60 text-sm font-bold uppercase tracking-widest">
                                <span className="flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-emerald-400" /> {university.province}
                                </span>
                                <span className="h-1 w-1 rounded-full bg-primary/40" />
                                <span className="flex items-center gap-1.5">
                                    <Network className="w-3.5 h-3.5 text-amber-400" /> {university.regionNameTh || "ประเทศไทย"}
                                </span>
                                <span className="h-1 w-1 rounded-full bg-primary/40" />
                                <span className="text-primary">Ministry Portal</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-4 self-stretch md:self-auto">
                        <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1 opacity-70">สถานะปัจจุบัน</p>
                            <div className="text-sm font-bold flex items-center gap-2 justify-end">
                                อัปเดตล่าสุด: {new Date().toLocaleDateString('th-TH', {
                                    day: 'numeric', month: 'long', year: 'numeric'
                                })} เวลา {new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
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

            {/* ── Tab Navigation ─────────────────────────── */}
            <div className="mb-8 border-b border-slate-200">
                <div className="flex gap-10">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`relative pb-4 text-sm font-black transition-all ${
                                activeTab === tab.id ? "text-primary" : "text-slate-400 hover:text-slate-600"
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <tab.icon className="h-4 w-4" />
                                {tab.label}
                            </div>
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-0 h-1 w-full rounded-full bg-primary" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Content ─────────────────────────── */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {activeTab === "dashboard" && (
                    <div className="space-y-6">
                        {/* Date Range Filter (Dean-style) */}
                        <section className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-4">
                            <div />
                            <div className="flex flex-col items-end gap-2">
                                <FacultyDateRangePicker
                                    startDate={dateRange.from}
                                    endDate={dateRange.to}
                                    onChange={handleDateChange}
                                />
                                <p className="text-[9px] text-slate-400 font-black uppercase text-right">
                                    อัปเดตล่าสุด: {new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                            </div>
                        </section>

                        {/* KPIs */}
                        <section>
                            <SummaryKPICards data={analyticsData?.summary ?? null} loading={analyticsLoading} />
                        </section>

                        {/* Charts Row */}
                        <div className="grid gap-6 lg:grid-cols-2 items-stretch">
                            <div className="h-full">
                                <LoadIndexChart
                                    data={analyticsData?.loadIndex ?? []}
                                    loading={analyticsLoading}
                                    title="Load Index ตามคณะ"
                                    subtitle="คณะไหนมีภาระงานสูงสุด"
                                />
                            </div>
                            <div className="h-full">
                                <RiskDistributionChart data={analyticsData?.riskDistribution ?? null} loading={analyticsLoading} />
                            </div>
                        </div>

                        {/* Problems */}
                        <section>
                            <ProblemCategoryChart data={analyticsData?.problemCategories ?? []} loading={analyticsLoading} />
                        </section>

                        {/* Breakdowns */}
                        <div className="grid gap-6 lg:grid-cols-2 items-stretch">
                            <div className="h-full">
                                <AttendanceChart data={analyticsData?.attendanceByGroup ?? []} loading={analyticsLoading} />
                            </div>
                            <div className="h-full">
                                <CancellationSummary data={analyticsData?.cancellationByGroup ?? []} loading={analyticsLoading} />
                            </div>
                        </div>

                        {/* Trend */}
                        <section>
                            <TrendChart data={analyticsData?.trend ?? []} loading={analyticsLoading} />
                        </section>
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

            {/* ── Footer ─────────────────────────── */}
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


// Sub-components

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
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            onClick={() => setShowRankings(true)}
                            className="flex items-center gap-3 px-5 py-3 bg-card/90 backdrop-blur-xl text-fg font-bold text-sm rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all border border-border ring-1 ring-black/5 group"
                        >
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
                        initial={{ x: "-100%", opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: "-100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="absolute top-4 left-4 bottom-4 w-96 bg-card/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/50 z-[500] flex flex-col overflow-hidden ring-1 ring-black/5"
                    >
                        <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-white/50">
                            <div>
                                <h3 className="font-bold text-fg flex items-center gap-2 text-lg">
                                    <Trophy className="w-5 h-5 text-yellow-500" />
                                    10 อันดับใกล้เคียง
                                </h3>
                                <p className="text-xs text-muted mt-0.5">เรียงตามระยะทาง (Proximity)</p>
                            </div>
                            <button
                                onClick={() => setShowRankings(false)}
                                className="p-2 hover:bg-slate-100 rounded-full text-muted hover:text-fg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 space-y-2">
                            {networkUniversities.map((uni: any, idx: number) => (
                                <div key={uni.code} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-2xl transition-colors cursor-default group">
                                    <div className={`
                                        w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shadow-sm
                                        ${idx === 0 ? "bg-yellow-400 text-yellow-900 shadow-yellow-200" :
                                            idx === 1 ? "bg-slate-300 text-slate-800" :
                                                idx === 2 ? "bg-orange-300 text-orange-900 shadow-orange-200" :
                                                    "bg-card border border-border text-muted"}
                                    `}>
                                        {idx + 1}
                                    </div>
                                    <div className="relative w-10 h-10 rounded-full bg-card border border-border p-0.5 shadow-sm">
                                        <Image src={uni.logo} alt={uni.name} width={40} height={40} className="object-contain w-full h-full rounded-full" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-bold text-fg truncate group-hover:text-primary transition-colors">
                                            {uni.name}
                                        </div>
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
