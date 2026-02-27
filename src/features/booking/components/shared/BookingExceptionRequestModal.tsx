// src/features/booking/components/shared/BookingExceptionRequestModal.tsx
"use client";

import { useEffect, useState } from "react";
import {
    Upload, CheckCircle2, Loader2, X, FileText, AlertCircle,
    Stethoscope, Siren, GraduationCap, HelpCircle,
} from "lucide-react";
import { Modal } from "@/components/ui";
import { useToast } from "@/contexts/ToastContext";
import { requestException, uploadExceptionEvidencesFiles, submitExceptionRequest } from "../../api/exceptionRequests";

// ─── Types ───────────────────────────────────────────────────────────────────
type ExceptionReasonOption = {
    exception_reason_id: number;
    exception_reason_code: string;
    exception_reason_name_th: string;
    exception_reason_name_en: string | null;
};

interface Props {
    isOpen: boolean;
    bookingId: number | null;
    onClose: () => void;
    onSuccess: () => void;
}

// ─── Reason icons ────────────────────────────────────────────────────────────
const REASON_ICONS: Record<string, typeof Stethoscope> = {
    MEDICAL: Stethoscope,
    EMERGENCY: Siren,
    ACADEMIC: GraduationCap,
    OTHER: HelpCircle,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatFileSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function getFileIcon(name: string) {
    const ext = name.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return "📄";
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "")) return "🖼";
    return "📎";
}

// ─── Component ───────────────────────────────────────────────────────────────
export function BookingExceptionRequestModal({ isOpen, bookingId, onClose, onSuccess }: Props) {
    const [reasonId, setReasonId] = useState<number | null>(null);
    const [reasonDetail, setReasonDetail] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { success: toastSuccess, error: toastError } = useToast();

    // Fetch reasons from API
    const [reasons, setReasons] = useState<ExceptionReasonOption[]>([]);
    const [reasonsLoading, setReasonsLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        // Reset form on open
        setReasonId(null);
        setReasonDetail("");
        setFiles([]);
        setError(null);

        setReasonsLoading(true);
        fetch("/api/v2/exception-reasons")
            .then(r => r.json())
            .then(res => { if (res.success) setReasons(res.data); })
            .catch(() => { })
            .finally(() => setReasonsLoading(false));
    }, [isOpen]);

    if (!isOpen || !bookingId) return null;

    const removeFile = (idx: number) => {
        setFiles(prev => prev.filter((_, i) => i !== idx));
    };

    const addFiles = (newFiles: FileList | null) => {
        if (!newFiles) return;
        setFiles(prev => [...prev, ...Array.from(newFiles)]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reasonId) { setError("กรุณาเลือกเหตุผล"); return; }
        if (!reasonDetail.trim()) { setError("กรุณากรอกรายละเอียด"); return; }

        setError(null);
        setLoading(true);

        try {
            const reqRes = await requestException(bookingId, "", reasonDetail, reasonId);
            const reqId = reqRes.data.booking_exception_request_id;

            if (files.length > 0) {
                await uploadExceptionEvidencesFiles(reqId, files);
            }

            await submitExceptionRequest(reqId);

            toastSuccess("ยื่นคำขอยกเว้นโทษสำเร็จ");
            onSuccess();
            onClose();
        } catch (err: any) {
            toastError(err.message ?? "ไม่สามารถยื่นคำขอได้");
            setError(err.message ?? "ไม่สามารถยื่นคำขอได้");
        } finally {
            setLoading(false);
        }
    };

    const selectedReason = reasons.find(r => r.exception_reason_id === reasonId);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="ยื่นคำขอยกเว้นโทษ" size="md">
            <form onSubmit={handleSubmit} className="space-y-5 pt-1">
                {error && (
                    <div className="flex items-start gap-2 bg-red-50 text-red-600 border border-red-200 p-3 rounded-xl text-sm">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* ── Step 1: Reason selector ── */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        เหตุผลหลัก <span className="text-red-400">*</span>
                    </label>
                    {reasonsLoading ? (
                        <div className="flex items-center gap-2 text-sm text-gray-400 p-3">
                            <Loader2 className="w-4 h-4 animate-spin" /> กำลังโหลด...
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {reasons.map(r => {
                                const Icon = REASON_ICONS[r.exception_reason_code] || HelpCircle;
                                const selected = reasonId === r.exception_reason_id;
                                return (
                                    <button
                                        key={r.exception_reason_id}
                                        type="button"
                                        onClick={() => setReasonId(r.exception_reason_id)}
                                        disabled={loading}
                                        className={`
                                            flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all duration-150
                                            ${selected
                                                ? "border-primary bg-primary/5 shadow-sm shadow-primary/10"
                                                : "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50"
                                            }
                                        `}
                                    >
                                        <div className={`
                                            w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors
                                            ${selected ? "bg-primary/15 text-primary" : "bg-gray-100 text-gray-400"}
                                        `}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className={`text-[13px] font-semibold leading-snug ${selected ? "text-primary" : "text-gray-700"}`}>
                                                {r.exception_reason_name_th}
                                            </div>
                                            {r.exception_reason_name_en && (
                                                <div className="text-[10px] text-gray-400 leading-tight">{r.exception_reason_name_en}</div>
                                            )}
                                        </div>
                                        {selected && (
                                            <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ── Step 2: Detail ── */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        รายละเอียดเพิ่มเติม <span className="text-red-400">*</span>
                    </label>
                    <textarea
                        value={reasonDetail}
                        onChange={e => setReasonDetail(e.target.value)}
                        disabled={loading}
                        className="w-full border border-gray-200 rounded-xl p-3 text-sm bg-gray-50/50
                                   focus:ring-2 focus:ring-primary/20 focus:border-primary/40 focus:bg-white
                                   outline-none transition-all duration-150 min-h-[90px] resize-none
                                   placeholder:text-gray-300"
                        placeholder="อธิบายเหตุผลความจำเป็นที่ต้องยกเลิก/ไม่มาตามนัด"
                        required
                    />
                </div>

                {/* ── Step 3: File upload ── */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                        <Upload className="w-4 h-4" /> หลักฐานประกอบ
                        <span className="text-xs font-normal text-gray-400">(ไม่บังคับ)</span>
                    </label>

                    {/* File list with remove buttons */}
                    {files.length > 0 && (
                        <div className="space-y-1.5 mb-2">
                            {files.map((file, idx) => (
                                <div
                                    key={`${file.name}-${idx}`}
                                    className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 border border-gray-100"
                                >
                                    <span className="text-sm shrink-0">{getFileIcon(file.name)}</span>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-xs font-medium text-gray-700 truncate">{file.name}</div>
                                        <div className="text-[10px] text-gray-400">{formatFileSize(file.size)}</div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeFile(idx)}
                                        disabled={loading}
                                        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0
                                                   text-gray-400 hover:text-red-500 hover:bg-red-50
                                                   active:bg-red-100 transition-all duration-150"
                                        title="ลบไฟล์นี้"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Native visible file input — works reliably in portals */}
                    <input
                        type="file"
                        multiple
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={e => {
                            const picked = Array.from(e.target.files || []);
                            const ALLOWED = [".pdf", ".png", ".jpg", ".jpeg"];
                            const valid: File[] = [];
                            const rejected: string[] = [];
                            for (const f of picked) {
                                const ext = f.name.slice(f.name.lastIndexOf(".")).toLowerCase();
                                if (ALLOWED.includes(ext)) {
                                    valid.push(f);
                                } else {
                                    rejected.push(f.name);
                                }
                            }
                            if (rejected.length > 0) {
                                toastError(`รับเฉพาะ PDF, PNG, JPG เท่านั้น`);
                            }
                            if (valid.length > 0) {
                                setFiles(prev => [...prev, ...valid]);
                                toastSuccess(`เพิ่มไฟล์สำเร็จ ${valid.length} ไฟล์`);
                            }
                            e.target.value = "";
                        }}
                        disabled={loading}
                        className="w-full text-sm text-gray-500
                                   file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border file:border-gray-200
                                   file:text-sm file:font-semibold file:bg-white file:text-primary
                                   hover:file:bg-primary/5 file:cursor-pointer file:transition-colors
                                   border border-gray-200 rounded-xl p-2 bg-gray-50/50"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">* หากแนบเอกสารจะช่วยให้การพิจารณาเร็วขึ้น</p>
                </div>

                {/* ── Actions ── */}
                <div className="pt-1 flex justify-end gap-2 border-t border-gray-100 pt-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        ยกเลิก
                    </button>
                    <button
                        type="submit"
                        disabled={loading || !reasonId || !reasonDetail.trim()}
                        className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white
                                   bg-primary hover:bg-primary/90 rounded-xl shadow-sm shadow-primary/20
                                   disabled:opacity-40 disabled:cursor-not-allowed
                                   transition-all duration-150 active:scale-[0.98]"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        ยื่นคำขอ
                    </button>
                </div>
            </form>
        </Modal>
    );
}
