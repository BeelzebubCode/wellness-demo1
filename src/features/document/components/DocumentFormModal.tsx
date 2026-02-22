"use client";

import { useState, useEffect, useRef } from "react";
import { Modal, ModalFooter, Button } from "@/components/ui";
import { AlertBox } from "@/components/notification/AlertBox";
import { Info, Upload } from "lucide-react";

interface DocumentFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    documentId: number | null;
    onSuccess: () => void;
}

export function DocumentFormModal({ isOpen, onClose, documentId, onSuccess }: DocumentFormModalProps) {
    const [title, setTitle] = useState("");
    const [slug, setSlug] = useState("");
    const [content, setContent] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [order, setOrder] = useState(0);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const fileInputRef = useRef<HTMLInputElement>(null);

    const isEdit = documentId !== null;

    useEffect(() => {
        if (isOpen && isEdit) {
            loadDocument();
        } else if (isOpen && !isEdit) {
            // Reset form
            setTitle("");
            setSlug("");
            setContent("");
            setIsActive(true);
            setOrder(0);
            setError("");
        }
    }, [isOpen, isEdit]);

    const loadDocument = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/v2/super-admin/docs?id=${documentId}`);
            const json = await res.json();
            if (json.valid) {
                setTitle(json.data.document_title);
                setSlug(json.data.document_slug);
                setContent(json.data.document_content);
                setIsActive(json.data.document_is_active);
                setOrder(json.data.document_order);
            } else {
                setError(json.message);
            }
        } catch (err) {
            setError("Failed to load document");
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result;
            if (typeof text === "string") {
                setContent(text);
            }
        };
        reader.readAsText(file);

        // Reset input to allow uploading the same file again if needed
        e.target.value = '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !slug || !content) {
            setError("กรุณากรอกข้อมูลให้ครบถ้วน");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const payload = {
                document_id: isEdit ? documentId : undefined,
                document_title: title,
                document_slug: slug,
                document_content: content,
                document_is_active: isActive,
                document_order: Number(order)
            };

            const res = await fetch("/api/v2/super-admin/docs", {
                method: isEdit ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const json = await res.json();
            if (json.valid) {
                onSuccess();
            } else {
                setError(json.message || "Something went wrong");
            }
        } catch (err) {
            setError("Failed to save document");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEdit ? "แก้ไขเนื้อหาเอกสาร" : "สร้างเอกสารใหม่"}
            size="xl"
            className="md:max-w-4xl max-w-[95vw] w-full"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {error && <AlertBox type="error" message={error} />}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                            ชื่อเอกสาร (Title) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. นโยบายการยกเลิก"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none"
                            disabled={loading}
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                            URL Slug <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                            placeholder="e.g. cancellation-policy"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none"
                            disabled={loading}
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">
                            ลำดับการแสดงผล (Order)
                        </label>
                        <input
                            type="number"
                            value={order}
                            onChange={(e) => setOrder(Number(e.target.value))}
                            placeholder="0"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none"
                            disabled={loading}
                        />
                    </div>

                    <div className="flex items-center gap-3 pt-6">
                        <div className="relative flex items-center">
                            <input
                                type="checkbox"
                                id="isActive"
                                checked={isActive}
                                onChange={(e) => setIsActive(e.target.checked)}
                                className="w-5 h-5 text-primary-600 border-slate-300 rounded focus:ring-primary-500 focus:ring-2 cursor-pointer transition-colors"
                                disabled={loading}
                            />
                        </div>
                        <label htmlFor="isActive" className="text-sm font-medium text-slate-700 cursor-pointer select-none">
                            เปิดใช้งาน (แสดงผลบนหน้าเว็บ)
                        </label>
                    </div>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                            เนื้อหา (HTML / Markdown Supported) <span className="text-red-500">*</span>
                        </label>

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            className="h-8 gap-2 text-xs text-slate-600 font-medium"
                            disabled={loading}
                        >
                            <Upload className="w-3.5 h-3.5" />
                            อัปโหลดไฟล์ (.md, .html)
                        </Button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept=".md,.markdown,.html,.txt"
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                    </div>

                    <div className="flex items-start gap-2 bg-blue-50/50 border border-blue-100 text-blue-700 text-[11px] p-2.5 rounded-lg">
                        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-500" />
                        <p className="leading-relaxed">
                            สามารถใส่แท็ก HTML พื้นฐานเพื่อจัดรูปแบบได้ เช่น <code className="bg-white px-1 py-0.5 rounded border border-blue-100">&lt;h1&gt;</code>, <code className="bg-white px-1 py-0.5 rounded border border-blue-100">&lt;p&gt;</code>, หรืออัปโหลดโค้ดเก่าได้จากปุ่มด้านบน
                        </p>
                    </div>

                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={16}
                        className="w-full p-4 font-mono text-xs leading-relaxed bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none resize-y min-h-[300px] scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent hover:scrollbar-thumb-slate-400"
                        disabled={loading}
                        required
                        placeholder={`<div className="space-y-4">\n  <h1 className="text-2xl font-bold text-primary-600">หัวข้อใหญ่</h1>\n  <p className="text-slate-600">เนื้อหาในย่อหน้า...</p>\n</div>`}
                    />
                </div>

                <ModalFooter>
                    <Button variant="ghost" onClick={onClose} disabled={loading} type="button">
                        ยกเลิก
                    </Button>
                    <Button variant="primary" type="submit" disabled={loading}>
                        {loading ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                    </Button>
                </ModalFooter>
            </form>
        </Modal>
    );
}
