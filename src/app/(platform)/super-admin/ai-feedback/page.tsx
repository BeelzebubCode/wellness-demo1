"use client";

import { useEffect, useState, useCallback } from "react";
import {
    MessageSquareWarning,
    RefreshCw,
    CheckCircle2,
    XCircle,
    Clock,
    ChevronDown,
    ChevronUp,
    User,
    Building2,
    Calendar,
} from "lucide-react";
import { cn } from "@/lib/cn";

type FeedbackStatus = "OPEN" | "RESOLVED" | "IGNORED";
type FeedbackType =
    | "CANT_ANSWER"
    | "LOW_CONFIDENCE"
    | "POLICY_BLOCK"
    | "PROVIDER_ERROR"
    | "USER_NEGATIVE";

interface FeedbackItem {
    ai_feedback_event_id: number;
    ai_feedback_type: FeedbackType;
    ai_feedback_status: FeedbackStatus;
    ai_user_question_text: string;
    ai_assistant_reply_excerpt: string | null;
    ai_user_role: string | null;
    ai_created_at: string;
    account: {
        account_id: number;
        account_username: string;
        roleCategory: { code: string };
    } | null;
    university: { university_name_th: string } | null;
}

const STATUS_CONFIG: Record<
    FeedbackStatus,
    { label: string; icon: React.ReactNode; dot: string; chip: string }
> = {
    OPEN: {
        label: "รอดำเนินการ",
        icon: <Clock size={11} />,
        dot: "bg-amber-400",
        chip: "bg-amber-50 text-amber-700 border border-amber-200",
    },
    RESOLVED: {
        label: "แก้ไขแล้ว",
        icon: <CheckCircle2 size={11} />,
        dot: "bg-emerald-400",
        chip: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    },
    IGNORED: {
        label: "ไม่ดำเนินการ",
        icon: <XCircle size={11} />,
        dot: "bg-slate-300",
        chip: "bg-slate-100 text-slate-500 border border-slate-200",
    },
};

const TYPE_LABEL: Record<FeedbackType, { label: string; color: string }> = {
    CANT_ANSWER: { label: "ตอบไม่ได้", color: "bg-red-50 text-red-600 border-red-100" },
    LOW_CONFIDENCE: { label: "ไม่มั่นใจ", color: "bg-orange-50 text-orange-600 border-orange-100" },
    POLICY_BLOCK: { label: "ถูกบล็อก", color: "bg-purple-50 text-purple-600 border-purple-100" },
    PROVIDER_ERROR: { label: "AI Error", color: "bg-rose-50 text-rose-600 border-rose-100" },
    USER_NEGATIVE: { label: "User รายงาน", color: "bg-blue-50 text-blue-600 border-blue-100" },
};

function FeedbackCard({
    item,
    onUpdateStatus,
    isUpdating,
}: {
    item: FeedbackItem;
    onUpdateStatus: (id: number, status: FeedbackStatus) => void;
    isUpdating: boolean;
}) {
    const [expanded, setExpanded] = useState(false);
    const statusCfg = STATUS_CONFIG[item.ai_feedback_status];
    const typeCfg = TYPE_LABEL[item.ai_feedback_type];

    const questionLong = item.ai_user_question_text.length > 120;
    const answerLong = item.ai_assistant_reply_excerpt
        ? item.ai_assistant_reply_excerpt.length > 120
        : false;

    const date = new Date(item.ai_created_at).toLocaleDateString("th-TH", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <div
            className={cn(
                "group rounded-2xl border bg-white shadow-xs transition-shadow hover:shadow-sm overflow-hidden",
                item.ai_feedback_status === "OPEN"
                    ? "border-amber-100"
                    : item.ai_feedback_status === "RESOLVED"
                        ? "border-emerald-100"
                        : "border-slate-100 opacity-75"
            )}
        >
            {/* Status accent bar */}
            <div
                className={cn(
                    "h-0.5 w-full",
                    item.ai_feedback_status === "OPEN"
                        ? "bg-amber-300"
                        : item.ai_feedback_status === "RESOLVED"
                            ? "bg-emerald-300"
                            : "bg-slate-200"
                )}
            />

            <div className="p-5">
                {/* Top row: meta info */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span
                        className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
                            typeCfg.color
                        )}
                    >
                        {typeCfg.label}
                    </span>
                    <span
                        className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
                            statusCfg.chip
                        )}
                    >
                        {statusCfg.icon}
                        {statusCfg.label}
                    </span>

                    <div className="ml-auto flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        {item.university && (
                            <span className="flex items-center gap-1">
                                <Building2 size={11} />
                                {item.university.university_name_th}
                            </span>
                        )}
                        {item.account && (
                            <span className="flex items-center gap-1">
                                <User size={11} />
                                {item.account.account_username}
                            </span>
                        )}
                        <span className="flex items-center gap-1">
                            <Calendar size={11} />
                            {date}
                        </span>
                        <span className="text-slate-300">#{item.ai_feedback_event_id}</span>
                    </div>
                </div>

                {/* Content grid */}
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                    {/* Question */}
                    <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
                        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                            คำถามของ User
                        </p>
                        <p
                            className={cn(
                                "text-sm leading-relaxed text-slate-700",
                                !expanded && questionLong ? "line-clamp-3" : ""
                            )}
                        >
                            {item.ai_user_question_text}
                        </p>
                    </div>

                    {/* Answer */}
                    <div className="rounded-xl bg-indigo-50/50 p-3.5 border border-indigo-100/50">
                        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-indigo-400">
                            คำตอบของ AI
                        </p>
                        {item.ai_assistant_reply_excerpt ? (
                            <p
                                className={cn(
                                    "text-sm leading-relaxed text-slate-600 italic",
                                    !expanded && answerLong ? "line-clamp-3" : ""
                                )}
                            >
                                {item.ai_assistant_reply_excerpt}
                            </p>
                        ) : (
                            <p className="text-xs text-slate-400">ไม่มีข้อมูลคำตอบ</p>
                        )}
                    </div>
                </div>

                {/* Expand toggle */}
                {(questionLong || answerLong) && (
                    <button
                        onClick={() => setExpanded((v) => !v)}
                        className="mt-2 flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        {expanded ? "ย่อ" : "ดูเพิ่มเติม"}
                    </button>
                )}

                {/* Actions */}
                <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-50 pt-3">
                    {item.ai_feedback_status !== "RESOLVED" && (
                        <button
                            disabled={isUpdating}
                            onClick={() => onUpdateStatus(item.ai_feedback_event_id, "RESOLVED")}
                            className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-40"
                        >
                            <CheckCircle2 size={12} />
                            แก้ไขแล้ว
                        </button>
                    )}
                    {item.ai_feedback_status !== "IGNORED" && (
                        <button
                            disabled={isUpdating}
                            onClick={() => onUpdateStatus(item.ai_feedback_event_id, "IGNORED")}
                            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-40"
                        >
                            <XCircle size={12} />
                            ไม่ดำเนินการ
                        </button>
                    )}
                    {item.ai_feedback_status !== "OPEN" && (
                        <button
                            disabled={isUpdating}
                            onClick={() => onUpdateStatus(item.ai_feedback_event_id, "OPEN")}
                            className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-40"
                        >
                            <Clock size={12} />
                            เปิดใหม่
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function AiFeedbackPage() {
    const [items, setItems] = useState<FeedbackItem[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>("OPEN");
    const [updatingId, setUpdatingId] = useState<number | null>(null);

    const counts = {
        OPEN: items.filter((i) => i.ai_feedback_status === "OPEN").length,
        RESOLVED: items.filter((i) => i.ai_feedback_status === "RESOLVED").length,
        IGNORED: items.filter((i) => i.ai_feedback_status === "IGNORED").length,
    };

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const params = filterStatus !== "ALL" ? `?status=${filterStatus}&limit=100` : "?limit=100";
            const res = await fetch(`/api/v2/super-admin/ai-feedback${params}`);
            const json = await res.json();
            if (json.valid) {
                setItems(json.data);
                setTotal(json.total);
            }
        } finally {
            setLoading(false);
        }
    }, [filterStatus]);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    const updateStatus = async (id: number, status: FeedbackStatus) => {
        setUpdatingId(id);
        try {
            const res = await fetch("/api/v2/super-admin/ai-feedback", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, status }),
            });
            const json = await res.json();
            if (json.valid) {
                setItems((prev) =>
                    prev.map((item) =>
                        item.ai_feedback_event_id === id
                            ? { ...item, ai_feedback_status: status }
                            : item
                    )
                );
            }
        } finally {
            setUpdatingId(null);
        }
    };

    const FILTER_OPTIONS = [
        { key: "ALL", label: "ทั้งหมด", count: total },
        { key: "OPEN", label: "รอดำเนินการ", count: counts.OPEN },
        { key: "RESOLVED", label: "แก้ไขแล้ว", count: counts.RESOLVED },
        { key: "IGNORED", label: "ไม่ดำเนินการ", count: counts.IGNORED },
    ];

    return (
        <div className="min-h-screen bg-slate-50/60 p-6">
            <div className="mx-auto max-w-5xl space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                            <MessageSquareWarning size={20} />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold text-slate-800">AI Feedback</h1>
                            <p className="text-sm text-slate-500">คำถามที่ AI ตอบไม่ได้ หรือ User รายงาน</p>
                        </div>
                    </div>
                    <button
                        onClick={fetchAll}
                        disabled={loading}
                        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-xs hover:bg-slate-50 disabled:opacity-50 transition-colors"
                    >
                        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                        รีเฟรช
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                    {(["OPEN", "RESOLVED", "IGNORED"] as FeedbackStatus[]).map((s) => {
                        const cfg = STATUS_CONFIG[s];
                        return (
                            <div
                                key={s}
                                className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-xs"
                            >
                                <div className={cn("h-2.5 w-2.5 rounded-full flex-shrink-0", cfg.dot)} />
                                <div>
                                    <p className="text-xs text-slate-500">{cfg.label}</p>
                                    <p className="text-2xl font-bold text-slate-800">{counts[s]}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Filter tabs */}
                <div className="flex items-center gap-1.5 rounded-xl border border-slate-100 bg-white p-1 shadow-xs w-fit">
                    {FILTER_OPTIONS.map((opt) => (
                        <button
                            key={opt.key}
                            onClick={() => setFilterStatus(opt.key)}
                            className={cn(
                                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
                                filterStatus === opt.key
                                    ? "bg-slate-800 text-white shadow-sm"
                                    : "text-slate-600 hover:bg-slate-50"
                            )}
                        >
                            {opt.label}
                            <span
                                className={cn(
                                    "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                                    filterStatus === opt.key
                                        ? "bg-white/20 text-white"
                                        : "bg-slate-100 text-slate-500"
                                )}
                            >
                                {opt.count}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Cards */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-24 text-slate-400">
                        <RefreshCw size={24} className="animate-spin mb-3 opacity-50" />
                        <p className="text-sm">กำลังโหลด...</p>
                    </div>
                ) : items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-24 text-slate-400">
                        <MessageSquareWarning size={40} className="mb-3 opacity-30" />
                        <p className="font-medium">ไม่มีรายการ Feedback</p>
                        <p className="mt-1 text-xs">ยังไม่มี User รายงานปัญหากับ AI</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {items.map((item) => (
                            <FeedbackCard
                                key={item.ai_feedback_event_id}
                                item={item}
                                onUpdateStatus={updateStatus}
                                isUpdating={updatingId === item.ai_feedback_event_id}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
