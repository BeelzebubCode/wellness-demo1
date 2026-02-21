// src/features/dashboard/ministry/components/UniversityDetailDashboard.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import Image from "next/image";
import {
    ArrowLeft, Users, TrendingUp, MapPin, Network,
    BarChart3, Activity, Heart, Brain, ChevronRight, X, Trophy
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

// Components
const UniversityNetworkMap = dynamic(
    () => import("./map/UniversityNetworkMap").then((mod) => mod.UniversityNetworkMap),
    { ssr: false }
);
import { UniversityRankings } from "./map/UniversityRankings";

interface UniversityDetailProps {
    universityCode: string;
}

// ChartJS setup
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
} from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";

ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title
);

export function UniversityDetailDashboard({ universityCode }: UniversityDetailProps) {
    const [university, setUniversity] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("dashboard"); // Default to Dashboard (Combined View)
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
                setIsLoading(false);
            }
        }
        fetchUniversity();
    }, [universityCode]);

    if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div></div>;
    if (!university) return <div>Not Found</div>;

    // --- Data Mapping ---
    const networkUniversities = (university.connections || [])
        .sort((a: any, b: any) => a.distance - b.distance)
        .slice(0, 10)
        .map((conn: any) => ({
            code: conn.universityCode,
            name: conn.universityName,
            logo: `/images/logo/${conn.universityCode}_logo.png`,
            students: conn.students || 0,
            dominantProblemCount: Math.round(conn.distance * 10) / 10,
            problemBreakdown: {}
        }));

    const genderStats = university.stats?.gender || [];
    const genderData = {
        labels: genderStats.map((g: any) => g.label === "MALE" ? "ชาย" : g.label === "FEMALE" ? "หญิง" : "อื่นๆ"),
        datasets: [{
            data: genderStats.map((g: any) => g.count),
            backgroundColor: ["#3b82f6", "#ec4899", "#9ca3af"],
            borderWidth: 0,
        }],
    };

    const problemStats = university.stats?.problems || [];
    const problemData = {
        labels: problemStats.map((p: any) => p.label),
        datasets: [{
            label: "จำนวนเคส",
            data: problemStats.map((p: any) => p.count),
            backgroundColor: "#818cf8",
            borderRadius: 4,
        }],
    };

    const facultyStats = university.stats?.faculties || [];
    const facultyData = {
        labels: facultyStats.map((f: any) => f.label),
        datasets: [{
            label: "จำนวนนักศึกษา",
            data: facultyStats.map((f: any) => f.count),
            backgroundColor: "#34d399",
            borderRadius: 4,
        }],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'bottom' as const, labels: { font: { family: "'IBM Plex Sans Thai', sans-serif", size: 12 }, usePointStyle: true, color: 'rgb(var(--fg))' } },
        },
        scales: {
            x: { grid: { display: false }, ticks: { font: { family: "'IBM Plex Sans Thai', sans-serif" }, color: 'rgb(var(--muted))' } },
            y: { border: { display: false }, ticks: { font: { family: "'IBM Plex Sans Thai', sans-serif" }, color: 'rgb(var(--muted))' } }
        }
    };

    const tabs = [
        { id: "dashboard", label: "ภาพรวมทั้งหมด", icon: BarChart3 },
        { id: "students", label: "นักศึกษา", icon: Users },
        { id: "mental-health", label: "สุขภาพจิต", icon: Brain },
        { id: "network-map", label: "แผนที่เครือข่าย", icon: Network },
    ];

    return (
        <div className="min-h-screen bg-bg font-sans text-fg pb-20">

            {/* 💎 Premium Immersive Header - "Fiew Fiew" Style (Full Height, No White Gap) */}
            <div className="relative w-full h-[400px] group overflow-hidden bg-slate-900">
                {/* Background Image with Zoom Effect */}
                <div className="absolute inset-0 transition-transform duration-1000 scale-105 group-hover:scale-100 z-0">
                    <Image src="/images/pattern-bg.png" alt="pattern" fill className="object-cover opacity-60 mix-blend-overlay" />
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-900/80 via-primary-800/80 to-primary-900/80"></div>
                </div>

                {/* Gradient Overlay for Readability (Bottom Up) */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent z-10 pointer-events-none"></div>

                {/* Navigation Back Button */}
                <Link
                    href="/ministry"
                    className="absolute top-6 left-6 z-30 flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-white/90 hover:bg-white/20 hover:text-white transition-all text-sm font-medium border border-white/10 group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    กลับหน้าหลัก
                </Link>

                {/* Content Container (Positioned Absolute Bottom) */}
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

                        {/* Typography Info (White Text) */}
                        <div className="flex-1 pb-2 text-white">
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3 leading-tight drop-shadow-xl text-white">
                                {university.name}
                            </h1>
                            <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-white/90">
                                <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-lg backdrop-blur-md border border-white/10 hover:bg-white/20 transition-colors shadow-sm">
                                    <MapPin className="w-4 h-4 text-emerald-300" /> {university.province}
                                </span>
                                <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-lg backdrop-blur-md border border-white/10 hover:bg-white/20 transition-colors shadow-sm">
                                    <Network className="w-4 h-4 text-amber-300" /> {university.regionNameTh || "ประเทศไทย"}
                                </span>
                                <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-lg backdrop-blur-md border border-white/10 hover:bg-white/20 transition-colors shadow-sm">
                                    <Users className="w-4 h-4 text-sky-300" /> {university.students.toLocaleString()} คน
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs Bar (Sticky below header) */}
            <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-8 overflow-x-auto no-scrollbar">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                        relative py-4 px-2 text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2
                        ${activeTab === tab.id
                                    ? "text-primary"
                                    : "text-muted hover:text-fg"
                                }
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

                {/* Combined Dashboard View */}
                {activeTab === "dashboard" && (
                    <div className="space-y-12 animate-in fade-in duration-500">
                        <SectionWrapper title="ภาพรวม (Overview)">
                            <OverviewContent university={university} />
                        </SectionWrapper>

                        <SectionWrapper title="ข้อมูลนักศึกษา (Students)">
                            <StudentsContent genderData={genderData} facultyData={facultyData} chartOptions={chartOptions} />
                        </SectionWrapper>

                        <SectionWrapper title="สุขภาพจิต (Mental Health)">
                            <MentalHealthContent problemData={problemData} chartOptions={chartOptions} />
                        </SectionWrapper>

                        <SectionWrapper title="เครือข่าย (Network)">
                            <NetworkMapContent
                                university={university}
                                networkUniversities={networkUniversities}
                                showRankings={showRankings}
                                setShowRankings={setShowRankings}
                            />
                        </SectionWrapper>
                    </div>
                )}

                {/* Individual Tabs */}
                {activeTab === "overview" && <OverviewContent university={university} />}
                {activeTab === "students" && <StudentsContent genderData={genderData} facultyData={facultyData} chartOptions={chartOptions} />}
                {activeTab === "mental-health" && <MentalHealthContent problemData={problemData} chartOptions={chartOptions} />}
                {activeTab === "network-map" && (
                    <NetworkMapContent
                        university={university}
                        networkUniversities={networkUniversities}
                        showRankings={showRankings}
                        setShowRankings={setShowRankings}
                    />
                )}
            </div>
        </div>
    );
}

// --- Sub-components (Extracted for Dashboard Reuse) ---

function SectionWrapper({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-fg flex items-center gap-2">
                <div className="w-1.5 h-6 bg-primary rounded-full"></div>
                {title}
            </h2>
            {children}
        </div>
    );
}

function OverviewContent({ university }: { university: any }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-card p-6 rounded-3xl shadow-sm border border-border hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-rose-50 rounded-2xl text-rose-500"><Heart className="w-6 h-6" /></div>
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">+12%</span>
                </div>
                <div className="text-4xl font-black text-fg tracking-tight">87%</div>
                <div className="text-sm font-medium text-muted mt-1">คะแนนสุขภาพ (Wellbeing)</div>
            </div>
            <div className="bg-card p-6 rounded-3xl shadow-sm border border-border hover:shadow-md transition-all">
                <div className="p-3 w-fit bg-amber-50 rounded-2xl text-amber-500 mb-4"><Activity className="w-6 h-6" /></div>
                <div className="text-4xl font-black text-fg tracking-tight">23</div>
                <div className="text-sm font-medium text-muted mt-1">นักศึกษาเสี่ยงสูง (High Risk)</div>
            </div>
            <div className="bg-card p-6 rounded-3xl shadow-sm border border-border hover:shadow-md transition-all">
                <div className="p-3 w-fit bg-indigo-50 rounded-2xl text-indigo-500 mb-4"><Users className="w-6 h-6" /></div>
                <div className="text-4xl font-black text-fg tracking-tight">142</div>
                <div className="text-sm font-medium text-muted mt-1">การให้คำปรึกษา (Sessions)</div>
            </div>
            <div className="bg-card p-6 rounded-3xl shadow-sm border border-border hover:shadow-md transition-all">
                <div className="p-3 w-fit bg-cyan-50 rounded-2xl text-cyan-500 mb-4"><BarChart3 className="w-6 h-6" /></div>
                <div className="text-4xl font-black text-fg tracking-tight">4.8</div>
                <div className="text-sm font-medium text-muted mt-1">คะแนนความพึงพอใจ (Rating)</div>
            </div>
        </div>
    )
}

function StudentsContent({ genderData, facultyData, chartOptions }: any) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card p-6 rounded-3xl shadow-sm border border-border">
                <h3 className="text-lg font-bold text-fg mb-6">สัดส่วนนักศึกษา (Gender Ratio)</h3>
                <div className="h-72 flex justify-center">
                    <Doughnut data={genderData} options={chartOptions} />
                </div>
            </div>
            <div className="bg-card p-6 rounded-3xl shadow-sm border border-border">
                <h3 className="text-lg font-bold text-fg mb-6">จำนวนนักศึกษาแยกตามคณะ (By Faculty)</h3>
                <div className="h-72">
                    <Bar data={facultyData} options={{ ...chartOptions, indexAxis: 'y' as const }} />
                </div>
            </div>
        </div>
    );
}

function MentalHealthContent({ problemData, chartOptions }: any) {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl text-center shadow-sm">
                    <div className="text-3xl font-bold text-emerald-700">78%</div>
                    <div className="text-sm text-emerald-600 font-medium">ความเสี่ยงต่ำ (Low)</div>
                </div>
                <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl text-center shadow-sm">
                    <div className="text-3xl font-bold text-amber-700">19%</div>
                    <div className="text-sm text-amber-600 font-medium">ความเสี่ยงปานกลาง (Medium)</div>
                </div>
                <div className="bg-rose-50 border border-rose-100 p-6 rounded-3xl text-center shadow-sm">
                    <div className="text-3xl font-bold text-rose-700">3%</div>
                    <div className="text-sm text-rose-600 font-medium">ความเสี่ยงสูง (High)</div>
                </div>
            </div>
            <div className="bg-card p-6 rounded-3xl shadow-sm border border-border">
                <h3 className="text-lg font-bold text-fg mb-6">ประเภทปัญหาที่พบ (Issues Breakdown)</h3>
                <div className="h-80">
                    <Bar data={problemData} options={{ ...chartOptions, indexAxis: 'y' as const }} />
                </div>
            </div>
        </div>
    );
}

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
