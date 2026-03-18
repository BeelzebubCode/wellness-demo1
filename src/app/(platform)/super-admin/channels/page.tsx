// src/app/(platform)/super-admin/channels/page.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/cn";
import {
    Settings2, Save, X, ToggleLeft, ToggleRight, Pencil, Loader2,
    ChevronUp, Plus,
} from "lucide-react";
import { ChannelIcon, ICON_REGISTRY } from "@/features/booking/components/forms/ServiceMode/ServiceModeIcons";
import { IconPicker } from "@/features/booking/components/forms/ServiceMode/IconPicker";

interface Channel {
    online_channel_category_id: number;
    online_channel_code: string;
    online_channel_name_th: string;
    online_channel_name_en: string | null;
    online_channel_icon_key: string | null;
    is_active: boolean;
}

export default function ChannelsPage() {
    const [channels, setChannels] = useState<Channel[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [showCreate, setShowCreate] = useState(false);

    // Edit form state
    const [editIconKey, setEditIconKey] = useState("");
    const [editNameTh, setEditNameTh] = useState("");
    const [editNameEn, setEditNameEn] = useState("");

    // Create form state
    const [createCode, setCreateCode] = useState("");
    const [createNameTh, setCreateNameTh] = useState("");
    const [createNameEn, setCreateNameEn] = useState("");
    const [createIconKey, setCreateIconKey] = useState("message");

    const fetchChannels = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/v2/master/online-channels", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "list_all" }),
            });
            const json = await res.json();
            if (Array.isArray(json.channels)) setChannels(json.channels);
        } catch { /* silent */ } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchChannels(); }, [fetchChannels]);

    const startEdit = (ch: Channel) => {
        setEditingId(ch.online_channel_category_id);
        setEditIconKey(ch.online_channel_icon_key ?? "message");
        setEditNameTh(ch.online_channel_name_th);
        setEditNameEn(ch.online_channel_name_en ?? "");
        setShowCreate(false);
    };

    const cancelEdit = () => setEditingId(null);

    const saveEdit = async () => {
        if (!editingId) return;
        setSaving(true);
        try {
            await fetch("/api/v2/master/online-channels", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "update", id: editingId,
                    icon_key: editIconKey, name_th: editNameTh, name_en: editNameEn,
                }),
            });
            setEditingId(null);
            await fetchChannels();
        } catch { /* silent */ } finally { setSaving(false); }
    };

    const toggleActive = async (ch: Channel) => {
        await fetch("/api/v2/master/online-channels", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "update", id: ch.online_channel_category_id, is_active: !ch.is_active }),
        });
        await fetchChannels();
    };

    const createChannel = async () => {
        if (!createCode.trim() || !createNameTh.trim()) return;
        setSaving(true);
        try {
            await fetch("/api/v2/master/online-channels", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "create",
                    code: createCode.toUpperCase().replace(/\s+/g, "_"),
                    name_th: createNameTh, name_en: createNameEn, icon_key: createIconKey,
                }),
            });
            setShowCreate(false);
            setCreateCode(""); setCreateNameTh(""); setCreateNameEn(""); setCreateIconKey("message");
            await fetchChannels();
        } catch { /* silent */ } finally { setSaving(false); }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 grid place-items-center shadow-lg shadow-violet-200">
                        <Settings2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">จัดการช่องทางออนไลน์</h1>
                        <p className="text-sm text-slate-500">แก้ไขชื่อ เปลี่ยนไอคอน เปิด/ปิด หรือสร้างช่องทางใหม่</p>
                    </div>
                </div>
                <button
                    onClick={() => { setShowCreate(true); setEditingId(null); }}
                    className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold text-white
                     bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl
                     hover:shadow-lg hover:shadow-violet-200 transition-all"
                >
                    <Plus className="w-4 h-4" /> สร้างช่องทางใหม่
                </button>
            </div>

            {/* Create panel */}
            {showCreate && (
                <div className="rounded-2xl border-2 border-dashed border-violet-300 bg-violet-50/40 p-5 space-y-4 animate-[fadeUp_0.3s_ease-out]">
                    <p className="text-sm font-bold text-violet-700">สร้างช่องทางใหม่</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className="text-xs font-semibold text-slate-600 mb-1 block">Code <span className="text-red-400">*</span></label>
                            <input value={createCode} onChange={(e) => setCreateCode(e.target.value)} placeholder="เช่น DISCORD"
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white uppercase" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-600 mb-1 block">ชื่อไทย <span className="text-red-400">*</span></label>
                            <input value={createNameTh} onChange={(e) => setCreateNameTh(e.target.value)} placeholder="เช่น ดิสคอร์ด"
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-600 mb-1 block">ชื่ออังกฤษ</label>
                            <input value={createNameEn} onChange={(e) => setCreateNameEn(e.target.value)} placeholder="เช่น Discord"
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1 block">เลือกไอคอน</label>
                        <IconPicker value={createIconKey} onChange={setCreateIconKey} />
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2">
                        <button onClick={() => setShowCreate(false)}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all">
                            <X className="w-3.5 h-3.5" /> ยกเลิก
                        </button>
                        <button onClick={createChannel} disabled={saving || !createCode.trim() || !createNameTh.trim()}
                            className={cn("flex items-center gap-1.5 px-5 py-2 text-sm font-bold text-white rounded-lg transition-all shadow-sm",
                                saving ? "bg-violet-300 cursor-wait" : "bg-gradient-to-r from-violet-500 to-purple-600 hover:shadow-md")}>
                            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} สร้าง
                        </button>
                    </div>
                </div>
            )}

            {/* Channel list */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                    <span className="ml-2 text-sm text-slate-400">กำลังโหลด...</span>
                </div>
            ) : (
                <div className="space-y-3">
                    {channels.map((ch) => {
                        const isEditing = editingId === ch.online_channel_category_id;
                        const iconKey = ch.online_channel_icon_key ?? "message";
                        const iconMeta = ICON_REGISTRY[iconKey];

                        return (
                            <div key={ch.online_channel_category_id}
                                className={cn(
                                    "rounded-2xl border bg-white shadow-sm transition-all duration-300",
                                    isEditing ? "border-violet-300 ring-2 ring-violet-100 shadow-md" : "border-slate-100",
                                    !ch.is_active && !isEditing && "opacity-50"
                                )}>
                                <div className="flex items-center gap-4 p-4">
                                    <div className={cn("h-12 w-12 rounded-xl grid place-items-center shrink-0", ch.is_active ? "bg-slate-50" : "bg-slate-100")}>
                                        <ChannelIcon iconKey={iconKey} className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-800 truncate">{ch.online_channel_name_th}</p>
                                        <p className="text-xs text-slate-400 truncate">
                                            {ch.online_channel_name_en ?? "—"} · <code className="text-[10px] bg-slate-100 px-1 rounded">{ch.online_channel_code}</code>
                                        </p>
                                        <p className="text-[10px] text-slate-300 mt-0.5">
                                            icon: <code className="bg-slate-50 px-1 rounded">{iconKey}</code>
                                            {iconMeta && <span className="ml-1">({iconMeta.label})</span>}
                                        </p>
                                    </div>
                                    <button onClick={() => toggleActive(ch)} title={ch.is_active ? "ปิดใช้งาน" : "เปิดใช้งาน"} className="shrink-0">
                                        {ch.is_active
                                            ? <ToggleRight className="h-7 w-7 text-emerald-500 hover:text-emerald-600 transition-colors" />
                                            : <ToggleLeft className="h-7 w-7 text-slate-300 hover:text-slate-400 transition-colors" />}
                                    </button>
                                    <button onClick={() => isEditing ? cancelEdit() : startEdit(ch)}
                                        className={cn("shrink-0 p-2 rounded-lg transition-all",
                                            isEditing ? "bg-violet-100 text-violet-600" : "bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600")}>
                                        {isEditing ? <ChevronUp className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                                    </button>
                                </div>

                                {isEditing && (
                                    <div className="border-t border-violet-100 p-4 space-y-4 bg-violet-50/30 rounded-b-2xl">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-xs font-semibold text-slate-600 mb-1 block">ชื่อไทย</label>
                                                <input value={editNameTh} onChange={(e) => setEditNameTh(e.target.value)}
                                                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white" />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-slate-600 mb-1 block">ชื่ออังกฤษ</label>
                                                <input value={editNameEn} onChange={(e) => setEditNameEn(e.target.value)}
                                                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-slate-600 mb-1 block">เลือกไอคอน</label>
                                            <IconPicker value={editIconKey} onChange={setEditIconKey} />
                                        </div>
                                        <div className="flex items-center justify-end gap-2 pt-2">
                                            <button onClick={cancelEdit}
                                                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all">
                                                <X className="w-3.5 h-3.5" /> ยกเลิก
                                            </button>
                                            <button onClick={saveEdit} disabled={saving || !editNameTh.trim()}
                                                className={cn("flex items-center gap-1.5 px-5 py-2 text-sm font-bold text-white rounded-lg transition-all shadow-sm",
                                                    saving ? "bg-violet-300 cursor-wait" : "bg-gradient-to-r from-violet-500 to-purple-600 hover:shadow-md")}>
                                                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} บันทึก
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
