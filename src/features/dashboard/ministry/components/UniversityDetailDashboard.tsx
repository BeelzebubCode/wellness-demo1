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
import { useAnalytics } from "../../shared/useAnalytics";
import { AnalyticsFilterBar } from "../../shared/AnalyticsFilterBar";
import { SummaryKPICards } from "../../shared/SummaryKPICards";
import { CancellationSummary } from "../../shared/CancellationSummary";

const LoadIndexChart = dynamic(
    () => import("../../shared/LoadIndexChart").then((m) => ({ default: m.LoadIndexChart })),
    { loading: () => <div className="h-80 bg-slate-50 animate-pulse rounded-xl" />, ssr: false },
);
const ProblemCategoryChart = dynamic(
    () => import("../../shared/ProblemCategoryChart").then((m) => ({ default: m.ProblemCategoryChart })),
    { loading: () => <div className="h-80 bg-slate-50 animate-pulse rounded-xl" />, ssr: false },
);
const AttendanceChart = dynamic(
    () => import("../../shared/AttendanceChart").then((m) => ({ default: m.AttendanceChart })),
    { loading: () => <div className="h-80 bg-slate-50 animate-pulse rounded-xl" />, ssr: false },
);
const RiskDistributionChart = dynamic(
    () => import("../../shared/RiskDistributionChart").then((m) => ({ default: m.RiskDistributionChart })),
    { loading: () => <div className="h-80 bg-slate-50 animate-pulse rounded-xl" />, ssr: false },
);
const TrendChart = dynamic(
    () => import("../../shared/TrendChart").then((m) => ({ default: m.TrendChart })),
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
    const [activeTab, setActiveTab] = useState("dashboard"); // Default to Dashboard
    const [showRankings, setShowRankings] = useState(false);

    // Fetch analytical data
    const { data: analyticsData, loading: analyticsLoading, params, setParams } = useAnalytics({
        university_code: universityCode
    });

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

    if (isUniLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div></div>;
    if (!university) return <div>Not Found</div>;

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
        <div className="min-h-screen bg-bg font-sans text-fg pb-20">

            {/* 💎 Premium Immersive Header - "Fiew Fiew" Style */}
            <div className="relative w-full h-[400px] group overflow-hidden bg-slate-900">
                {/* Background Image with Zoom Effect */}
                <div className="absolute inset-0 transition-transform duration-1000 scale-105 group-hover:scale-100 z-0">
                    <Image src="/images/pattern-bg.png" alt="pattern" fill className="object-cover opacity-60 mix-blend-overlay" />
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-900/80 via-primary-800/80 to-primary-900/80"></div>
                </div>

                {/* Gradient Overlay for Readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent z-10 pointer-events-none"></div>

                {/* Navigation Back Button */}
                <Link
                    href="/ministry"
                    className="absolute top-6 left-6 z-30 flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-white/90 hover:bg-white/20 hover:text-white transition-all text-sm font-medium border border-white/10 group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    กลับหน้าหลัก
                </Link>

                {/* Content Container */}
                <div className="absolute bottom-0 left-0 right-0 z-20 px-4 sm:px-6 pb-6">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-end gap-8">
                        {/* 🌟 Glowing Logo */}
                        <div className="relative shrink-0 mb-2">
                            <div className="absolute -inset-4 bg-primary/30 rounded-full blur-xl animate-pulse"></div>
                            <div className="relative w-36 h-36 rounded-3xl bg-white p-2 shadow-2xl ring-4 ring-white/10 backdrop-blur-sm">
                                <Image
                                    src={university.logo}
                                    alt={university.name}
                                    width={144}
                                    height={144}
                                    className="object-contain w-full h-full"
                                />
                            </div>
                            <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg border border-white flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                                ONLINE
                            </div>
                        </div>

                        {/* Typography Info */}
                        <div className="flex-1 pb-2 text-white">
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3 leading-tight drop-shadow-xl text-white">
                                {university.name}
                            </h1>
                            <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-white/90">
                                <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-lg backdrop-blur-md border border-white/10 shadow-sm">
                                    <MapPin className="w-4 h-4 text-emerald-300" /> {university.province}
                                </span>
                                <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-lg backdrop-blur-md border border-white/10 shadow-sm">
                                    <Network className="w-4 h-4 text-amber-300" /> {university.regionNameTh || "ประเทศไทย"}
                                </span>
                                <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-lg backdrop-blur-md border border-white/10 shadow-sm">
                                    <Users className="w-4 h-4 text-sky-300" /> {university.students.toLocaleString()} คน
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs Bar */}
            <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-8 overflow-x-auto no-scrollbar">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                        relative py-4 px-2 text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2
                        ${activeTab === tab.id ? "text-primary" : "text-muted hover:text-fg"}
                    `}
                        >
                            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? "text-primary" : "text-muted"}`} />
                            {tab.label}
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full"
                                />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 min-h-[500px] space-y-12">

                {/* Dashboard View */}
                {activeTab === "dashboard" && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        {/* Filters */}
                        <section>
                            <AnalyticsFilterBar params={params} onChange={setParams} />
                        </section>

                        {/* KPIs */}
                        <section>
                            <SummaryKPICards data={analyticsData?.summary ?? null} loading={analyticsLoading} />
                        </section>

                        {/* Charts Row */}
                        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <LoadIndexChart
                                data={analyticsData?.loadIndex ?? []}
                                loading={analyticsLoading}
                                title="Load Index ตามคณะ"
                                subtitle="คณะไหนมีภาระงานสูงสุด"
                            />
                            <RiskDistributionChart data={analyticsData?.riskDistribution ?? null} loading={analyticsLoading} />
                        </section>

                        {/* Problems */}
                        <section>
                            <ProblemCategoryChart data={analyticsData?.problemCategories ?? []} loading={analyticsLoading} />
                        </section>

                        {/* Breakdowns */}
                        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <AttendanceChart data={analyticsData?.attendanceByGroup ?? []} loading={analyticsLoading} />
                            <CancellationSummary data={analyticsData?.cancellationByGroup ?? []} loading={analyticsLoading} />
                        </section>

                        {/* Trend */}
                        <section>
                            <TrendChart data={analyticsData?.trend ?? []} loading={analyticsLoading} />
                        </section>
                    </div>
                )}

                {/* Network Map */}
                {activeTab === "network-map" && (
                    <div className="animate-in fade-in duration-500">
                        <NetworkMapContent
                            university={university}
                            networkUniversities={networkUniversities}
                            showRankings={showRankings}
                            setShowRankings={setShowRankings}
                        />
                    </div>
                )}
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
