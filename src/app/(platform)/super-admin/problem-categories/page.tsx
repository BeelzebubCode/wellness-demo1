// src/app/(platform)/super-admin/problem-categories/page.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/cn";
import {
    ClipboardList, Save, X, Pencil, Loader2, ChevronUp, Plus,
} from "lucide-react";

interface Category {
    id: number;
    code: string;
    nameTh: string;
    nameEn: string | null;
    description: string | null;
}

export default function ProblemCategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [showCreate, setShowCreate] = useState(false);

    // Edit state
    const [editCode, setEditCode] = useState("");
    const [editNameTh, setEditNameTh] = useState("");
    const [editNameEn, setEditNameEn] = useState("");
    const [editDesc, setEditDesc] = useState("");

    // Create state
    const [createCode, setCreateCode] = useState("");
    const [createNameTh, setCreateNameTh] = useState("");
    const [createNameEn, setCreateNameEn] = useState("");
    const [createDesc, setCreateDesc] = useState("");

    const fetchCategories = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/v2/master/problem-categories");
            const json = await res.json();
            if (json.success && Array.isArray(json.categories)) setCategories(json.categories);
        } catch { /* silent */ } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchCategories(); }, [fetchCategories]);

    const startEdit = (cat: Category) => {
        setEditingId(cat.id);
        setEditCode(cat.code);
        setEditNameTh(cat.nameTh);
        setEditNameEn(cat.nameEn ?? "");
        setEditDesc(cat.description ?? "");
        setShowCreate(false);
    };

    const cancelEdit = () => setEditingId(null);

    const saveEdit = async () => {
        if (!editingId) return;
        setSaving(true);
        try {
            await fetch("/api/v2/master/problem-categories", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: editingId,
                    code: editCode, nameTh: editNameTh, nameEn: editNameEn, description: editDesc,
                }),
            });
            setEditingId(null);
            await fetchCategories();
        } catch { /* silent */ } finally { setSaving(false); }
    };

    const createCategory = async () => {
        if (!createCode.trim() || !createNameTh.trim()) return;
        setSaving(true);
        try {
            await fetch("/api/v2/master/problem-categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code: createCode.toUpperCase().replace(/\s+/g, "_"),
                    nameTh: createNameTh, nameEn: createNameEn, description: createDesc,
                }),
            });
            setShowCreate(false);
            setCreateCode(""); setCreateNameTh(""); setCreateNameEn(""); setCreateDesc("");
            await fetchCategories();
        } catch { /* silent */ } finally { setSaving(false); }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 grid place-items-center shadow-lg shadow-amber-200">
                        <ClipboardList className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">จัดการประเภทปัญหา</h1>
                        <p className="text-sm text-slate-500">เพิ่ม แก้ไข ประเภทปัญหาที่ใช้ในระบบ</p>
                    </div>
                </div>
                <button
                    onClick={() => { setShowCreate(true); setEditingId(null); }}
                    className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold text-white
                     bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl
                     hover:shadow-lg hover:shadow-amber-200 transition-all"
                >
                    <Plus className="w-4 h-4" /> เพิ่มประเภทใหม่
                </button>
            </div>

            {/* Create panel */}
            {showCreate && (
                <div className="rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/40 p-5 space-y-4 animate-[fadeUp_0.3s_ease-out]">
                    <p className="text-sm font-bold text-amber-700">เพิ่มประเภทปัญหาใหม่</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className="text-xs font-semibold text-slate-600 mb-1 block">Code <span className="text-red-400">*</span></label>
                            <input value={createCode} onChange={(e) => setCreateCode(e.target.value)} placeholder="เช่น ACADEMIC"
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white uppercase" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-600 mb-1 block">ชื่อไทย <span className="text-red-400">*</span></label>
                            <input value={createNameTh} onChange={(e) => setCreateNameTh(e.target.value)} placeholder="เช่น ปัญหาด้านการเรียน"
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-600 mb-1 block">ชื่ออังกฤษ</label>
                            <input value={createNameEn} onChange={(e) => setCreateNameEn(e.target.value)} placeholder="เช่น Academic Issues"
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1 block">รายละเอียด</label>
                        <textarea value={createDesc} onChange={(e) => setCreateDesc(e.target.value)} rows={2} placeholder="คำอธิบายเพิ่มเติม (ไม่บังคับ)"
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white resize-none" />
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2">
                        <button onClick={() => setShowCreate(false)}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all">
                            <X className="w-3.5 h-3.5" /> ยกเลิก
                        </button>
                        <button onClick={createCategory} disabled={saving || !createCode.trim() || !createNameTh.trim()}
                            className={cn("flex items-center gap-1.5 px-5 py-2 text-sm font-bold text-white rounded-lg transition-all shadow-sm",
                                saving ? "bg-amber-300 cursor-wait" : "bg-gradient-to-r from-amber-500 to-orange-600 hover:shadow-md")}>
                            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} สร้าง
                        </button>
                    </div>
                </div>
            )}

            {/* Category list */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                    <span className="ml-2 text-sm text-slate-400">กำลังโหลด...</span>
                </div>
            ) : (
                <div className="space-y-3">
                    {categories.map((cat) => {
                        const isEditing = editingId === cat.id;
                        const isOther = cat.code === "OTHER";

                        return (
                            <div key={cat.id}
                                className={cn(
                                    "rounded-2xl border bg-white shadow-sm transition-all duration-300",
                                    isEditing ? "border-amber-300 ring-2 ring-amber-100 shadow-md" : "border-slate-100"
                                )}>
                                {/* Row */}
                                <div className="flex items-center gap-4 p-4">
                                    {/* Number badge */}
                                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 grid place-items-center shrink-0 border border-slate-200">
                                        <span className="text-sm font-bold text-slate-500">{cat.id}</span>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-800 truncate">
                                            {cat.nameTh}
                                            {isOther && <span className="ml-1.5 text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full font-semibold">อยู่ท้ายสุดเสมอ</span>}
                                        </p>
                                        <p className="text-xs text-slate-400 truncate">
                                            {cat.nameEn ?? "—"} · <code className="text-[10px] bg-slate-100 px-1 rounded">{cat.code}</code>
                                        </p>
                                        {cat.description && (
                                            <p className="text-[11px] text-slate-400 mt-0.5 truncate">{cat.description}</p>
                                        )}
                                    </div>

                                    {/* Edit button */}
                                    <button onClick={() => isEditing ? cancelEdit() : startEdit(cat)}
                                        className={cn("shrink-0 p-2 rounded-lg transition-all",
                                            isEditing ? "bg-amber-100 text-amber-600" : "bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600")}>
                                        {isEditing ? <ChevronUp className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                                    </button>
                                </div>

                                {/* Edit panel */}
                                {isEditing && (
                                    <div className="border-t border-amber-100 p-4 space-y-4 bg-amber-50/30 rounded-b-2xl">
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <div>
                                                <label className="text-xs font-semibold text-slate-600 mb-1 block">Code</label>
                                                <input value={editCode} onChange={(e) => setEditCode(e.target.value)}
                                                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white uppercase" />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-slate-600 mb-1 block">ชื่อไทย</label>
                                                <input value={editNameTh} onChange={(e) => setEditNameTh(e.target.value)}
                                                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white" />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-slate-600 mb-1 block">ชื่ออังกฤษ</label>
                                                <input value={editNameEn} onChange={(e) => setEditNameEn(e.target.value)}
                                                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-slate-600 mb-1 block">รายละเอียด</label>
                                            <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={2}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white resize-none" />
                                        </div>
                                        <div className="flex items-center justify-end gap-2 pt-2">
                                            <button onClick={cancelEdit}
                                                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all">
                                                <X className="w-3.5 h-3.5" /> ยกเลิก
                                            </button>
                                            <button onClick={saveEdit} disabled={saving || !editNameTh.trim()}
                                                className={cn("flex items-center gap-1.5 px-5 py-2 text-sm font-bold text-white rounded-lg transition-all shadow-sm",
                                                    saving ? "bg-amber-300 cursor-wait" : "bg-gradient-to-r from-amber-500 to-orange-600 hover:shadow-md")}>
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
