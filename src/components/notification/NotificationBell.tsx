// src/components/notification/NotificationBell.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Bell, CheckCheck, X, CalendarDays, AlertTriangle, Info, UserCheck, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useNotificationContext } from "@/components/notification/NotificationProvider";

interface NotificationItem {
    id: number;
    title: string;
    body: string | null;
    icon: string;
    category: string;
    templateCode: string;
    bookingId?: number | null;
    universityId?: number | null;
    data?: Record<string, unknown> | null;
    readAt: string | null;
    createdAt: string;
}

const ICON_MAP: Record<string, React.ElementType> = {
    BELL: Bell,
    BOOKING: CalendarDays,
    ALERT: AlertTriangle,
    INFO: Info,
    ASSIGN: UserCheck,
    REWARD: Sparkles,
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
    BOOKING: { bg: "bg-blue-50", text: "text-blue-600", dot: "bg-blue-500" },
    ALERT: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500" },
    SYSTEM: { bg: "bg-slate-50", text: "text-slate-600", dot: "bg-slate-400" },
    ASSIGNMENT: { bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-500" },
    REWARD: { bg: "bg-amber-50", text: "text-amber-600", dot: "bg-amber-500" },
};

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "เมื่อสักครู่";
    if (mins < 60) return `${mins} นาทีที่แล้ว`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} ชม.ที่แล้ว`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} วันที่แล้ว`;
    return new Date(dateStr).toLocaleDateString("th-TH", { day: "2-digit", month: "short" });
}

function playGeneratedTone() {
    try {
        const WebkitAudioContext = (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        const AudioContextCtor = window.AudioContext || WebkitAudioContext;
        if (!AudioContextCtor) return;
        const audioContext = new AudioContextCtor();
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.type = "triangle";
        oscillator.frequency.value = 1046;
        gain.gain.value = 0.12;
        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.2);
    } catch {
        // silent fallback if browser blocks autoplay/audio context
    }
}

function playNotificationTone() {
    try {
        const audio = new Audio("/sounds/notification.mp3");
        audio.volume = 0.9;
        audio.play().catch(() => {
            playGeneratedTone();
        });
        return;
    } catch {
        playGeneratedTone();
    }
}

export function NotificationBell() {
    const router = useRouter();
    const { push } = useNotificationContext();
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const unreadCountRef = useRef(0);
    const hasInitializedUnreadRef = useRef(false);
    const lastToastNotificationIdRef = useRef<number | null>(null);

    // Fetch unread count (polling + refresh on window focus)
    const fetchCount = useCallback(async () => {
        try {
            const res = await fetch("/api/v2/notifications/count");
            const json = await res.json();
            if (json.success) {
                const nextCount = Number(json.count ?? 0);
                setUnreadCount(nextCount);
            }
        } catch {
            // silent
        }
    }, []);

    const maybeToastLatestAssignment = useCallback(async () => {
        try {
            const res = await fetch("/api/v2/notifications?unread=true&limit=1");
            const json = await res.json();
            if (!json?.success || !Array.isArray(json?.data) || json.data.length === 0) return;
            const latest = json.data[0] as NotificationItem;
            if (latest.id === lastToastNotificationIdRef.current) return;
            if (!["BOOKING_ASSIGNED", "BOOKING_REASSIGNED"].includes(latest.templateCode)) return;

            lastToastNotificationIdRef.current = latest.id;
            push({
                type: "info",
                title: "มีงานใหม่เข้า",
                message: latest.body ?? latest.title,
                duration: 5000,
            });
            playNotificationTone();
        } catch {
            // silent
        }
    }, [push]);

    useEffect(() => {
        fetchCount();
        const interval = setInterval(fetchCount, 60000);
        const onFocus = () => { fetchCount(); };
        window.addEventListener("focus", onFocus);
        return () => {
            clearInterval(interval);
            window.removeEventListener("focus", onFocus);
        };
    }, [fetchCount]);

    useEffect(() => {
        if (!hasInitializedUnreadRef.current) {
            hasInitializedUnreadRef.current = true;
            unreadCountRef.current = unreadCount;
            return;
        }
        const prev = unreadCountRef.current;
        if (unreadCount > prev && document.visibilityState === "visible") {
            void maybeToastLatestAssignment();
        }
        unreadCountRef.current = unreadCount;
    }, [unreadCount, maybeToastLatestAssignment]);

    // Fetch notification list
    const fetchList = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/v2/notifications?limit=15");
            const json = await res.json();
            if (json.success) setItems(json.data);
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    }, []);

    // Open panel
    const handleOpen = () => {
        setOpen(true);
        fetchList();
    };

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        if (open) document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    // Mark single as read
    const markRead = async (id: number) => {
        await fetch("/api/v2/notifications", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
        });
        setItems((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)));
        setUnreadCount((c) => Math.max(0, c - 1));
    };

    const handleNotificationClick = async (item: NotificationItem) => {
        const isUnread = !item.readAt;
        if (isUnread) {
            await markRead(item.id);
        }

        const data = item.data ?? {};
        const actionUrl = typeof data?.actionUrl === "string" ? data.actionUrl : null;
        const bookingId = Number(item.bookingId ?? (typeof data?.bookingId === "number" ? data.bookingId : NaN));
        const targetUrl = actionUrl || (Number.isFinite(bookingId) ? `/consultant/my-jobs?bookingId=${bookingId}` : null);

        if (targetUrl) {
            setOpen(false);
            router.push(targetUrl);
        }
    };

    // Mark all as read
    const markAllRead = async () => {
        await fetch("/api/v2/notifications", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ markAll: true }),
        });
        setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
        setUnreadCount(0);
    };

    return (
        <div className="relative" ref={panelRef}>
            {/* Bell Button */}
            <button
                type="button"
                onClick={() => (open ? setOpen(false) : handleOpen())}
                className={cn(
                    "relative p-2.5 rounded-xl transition-all duration-200",
                    open
                        ? "bg-primary-50 text-primary-600"
                        : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                )}
                aria-label="การแจ้งเตือน"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <motion.span
                        key={unreadCount}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-0.5 -right-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white"
                    >
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </motion.span>
                )}
            </button>

            {/* Dropdown Panel */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-[380px] max-h-[480px] rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden z-50"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/60">
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-semibold text-gray-800">การแจ้งเตือน</h3>
                                {unreadCount > 0 && (
                                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">
                                        {unreadCount} ใหม่
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllRead}
                                        className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-primary-600 hover:bg-primary-50 transition"
                                    >
                                        <CheckCheck className="w-3.5 h-3.5" />
                                        อ่านทั้งหมด
                                    </button>
                                )}
                                <button
                                    onClick={() => setOpen(false)}
                                    className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* List */}
                        <div className="overflow-y-auto max-h-[400px] divide-y divide-gray-50">
                            {loading ? (
                                <div className="flex items-center justify-center py-12 text-gray-400">
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-primary-500" />
                                    <span className="ml-2 text-sm">กำลังโหลด...</span>
                                </div>
                            ) : items.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                    <Bell className="w-8 h-8 mb-2 opacity-30" />
                                    <p className="text-sm font-medium">ไม่มีการแจ้งเตือน</p>
                                </div>
                            ) : (
                                items.map((item) => {
                                    const IconComp = ICON_MAP[item.icon] ?? Bell;
                                    const colors = CATEGORY_COLORS[item.category] ?? CATEGORY_COLORS.SYSTEM;
                                    const isUnread = !item.readAt;

                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => handleNotificationClick(item)}
                                            className={cn(
                                                "w-full text-left px-4 py-3 flex gap-3 transition-colors",
                                                isUnread
                                                    ? "bg-primary-50/40 hover:bg-primary-50/70"
                                                    : "hover:bg-gray-50"
                                            )}
                                        >
                                            <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", colors.bg)}>
                                                <IconComp className={cn("w-4 h-4", colors.text)} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className={cn("text-[13px] leading-snug", isUnread ? "font-semibold text-gray-900" : "text-gray-700")}>
                                                        {item.title}
                                                    </p>
                                                    {isUnread && <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", colors.dot)} />}
                                                </div>
                                                {item.body && (
                                                    <p className="text-[12px] text-gray-500 line-clamp-2 mt-0.5 leading-relaxed">
                                                        {item.body}
                                                    </p>
                                                )}
                                                <p className="text-[11px] text-gray-400 mt-1">
                                                    {timeAgo(item.createdAt)}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
