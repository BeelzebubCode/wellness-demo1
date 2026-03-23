// src/features/dashboard/ministry/components/executive/AlertPanel.tsx
// ─────────────────────────────────────────────────────────────────────────────
// 🚨 Alert panel — real-time risk/anomaly alerts with severity badges
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import React, { useState } from "react";
import { AlertTriangle, ShieldAlert, Info, ChevronDown, ChevronUp, ExternalLink, CheckCircle } from "lucide-react";

interface Alert {
    id: string;
    severity: "critical" | "warning" | "info";
    title: string;
    description: string;
    universityName?: string;
    universityId?: number;
    metric?: { value: number; label: string };
    action?: string;
}

const SEVERITY_CONFIG = {
    critical: {
        bg: "bg-rose-50 border-rose-200",
        icon: <ShieldAlert className="w-5 h-5 text-rose-600" />,
        badge: "bg-rose-600 text-white",
        label: "วิกฤต",
        pulse: "animate-pulse",
    },
    warning: {
        bg: "bg-amber-50 border-amber-200",
        icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
        badge: "bg-amber-500 text-white",
        label: "เตือน",
        pulse: "",
    },
    info: {
        bg: "bg-blue-50 border-blue-200",
        icon: <Info className="w-5 h-5 text-blue-600" />,
        badge: "bg-blue-500 text-white",
        label: "ข้อมูล",
        pulse: "",
    },
};

function AlertItem({ alert }: { alert: Alert }) {
    const config = SEVERITY_CONFIG[alert.severity];

    return (
        <div className={`rounded-xl border p-4 ${config.bg} transition-all hover:shadow-md`}>
            <div className="flex items-start gap-3">
                <div className={`mt-0.5 shrink-0 ${config.pulse}`}>{config.icon}</div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${config.badge}`}>
                            {config.label}
                        </span>
                        <h4 className="text-sm font-bold text-slate-800">{alert.title}</h4>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed mb-2">{alert.description}</p>

                    {alert.metric && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/80 border border-slate-200 mb-2">
                            <span className="text-lg font-black text-slate-900">{alert.metric.value}</span>
                            <span className="text-[10px] text-slate-500">{alert.metric.label}</span>
                        </div>
                    )}

                    {alert.action && (
                        <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">แนะนำ:</span>
                            <span className="text-xs text-slate-600 font-medium">{alert.action}</span>
                        </div>
                    )}

                    {alert.universityId && (
                        <a
                            href={`/ministry/universities/${alert.universityId}`}
                            className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                            ดูรายละเอียด <ExternalLink className="w-3 h-3" />
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}

export function AlertPanel({ alerts }: { alerts: Alert[] }) {
    const [expanded, setExpanded] = useState(false);
    const criticalCount = alerts.filter(a => a.severity === "critical").length;
    const warningCount = alerts.filter(a => a.severity === "warning").length;

    const visibleAlerts = expanded ? alerts : alerts.slice(0, 3);

    return (
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-lg shadow-rose-100 ${criticalCount > 0 ? "animate-pulse" : ""}`}>
                        <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">แจ้งเตือน</h3>
                        <p className="text-xs text-slate-400">
                            {alerts.length === 0
                                ? "ไม่มีการแจ้งเตือน"
                                : `${criticalCount > 0 ? `${criticalCount} วิกฤต` : ""}${criticalCount > 0 && warningCount > 0 ? " · " : ""}${warningCount > 0 ? `${warningCount} เตือน` : ""}`
                            }
                        </p>
                    </div>
                </div>

                {alerts.length > 0 && (
                    <div className="flex items-center gap-2">
                        {criticalCount > 0 && (
                            <span className="px-2.5 py-1 rounded-full bg-rose-600 text-white text-xs font-bold animate-pulse">
                                {criticalCount}
                            </span>
                        )}
                        {warningCount > 0 && (
                            <span className="px-2.5 py-1 rounded-full bg-amber-500 text-white text-xs font-bold">
                                {warningCount}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Alert Items */}
            {alerts.length === 0 ? (
                <div className="px-6 py-8 text-center">
                    <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-500 font-medium">ไม่พบความผิดปกติในขณะนี้</p>
                    <p className="text-xs text-slate-400">ระบบจะแจ้งเตือนอัตโนมัติเมื่อตรวจพบ</p>
                </div>
            ) : (
                <div className="p-4 space-y-3">
                    {visibleAlerts.map(alert => (
                        <AlertItem key={alert.id} alert={alert} />
                    ))}

                    {alerts.length > 3 && (
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="w-full flex items-center justify-center gap-1 py-2 text-xs text-slate-500 hover:text-slate-700 font-medium transition-colors"
                        >
                            {expanded ? (
                                <>ซ่อน <ChevronUp className="w-3 h-3" /></>
                            ) : (
                                <>ดูเพิ่มเติม ({alerts.length - 3} รายการ) <ChevronDown className="w-3 h-3" /></>
                            )}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
