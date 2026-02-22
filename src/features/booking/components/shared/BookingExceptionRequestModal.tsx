// src/features/booking/components/shared/BookingExceptionRequestModal.tsx
"use client";

import { useState } from "react";
import { AlertTriangle, Upload, CheckCircle2, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui";
import { useToast } from "@/contexts/ToastContext";
import { requestException, uploadExceptionEvidencesFiles, submitExceptionRequest } from "../../api/exceptionRequests";

interface Props {
    isOpen: boolean;
    bookingId: number | null;
    onClose: () => void;
    onSuccess: () => void;
}

export function BookingExceptionRequestModal({ isOpen, bookingId, onClose, onSuccess }: Props) {
    const [reasonCode, setReasonCode] = useState("");
    const [reasonDetail, setReasonDetail] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { success: toastSuccess, error: toastError } = useToast();

    if (!isOpen || !bookingId) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reasonCode.trim() || !reasonDetail.trim()) {
            setError("กรุณากรอกข้อมูลให้ครบถ้วน");
            return;
        }

        setError(null);
        setLoading(true);

        try {
            // 1. Create request
            const reqRes = await requestException(bookingId, reasonCode, reasonDetail);
            const reqId = reqRes.data.booking_exception_request_id;

            // 2. Upload evidences if any
            if (files.length > 0) {
                await uploadExceptionEvidencesFiles(reqId, files);
            }

            // 3. Submit
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

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="ยื่นคำขอยกเว้นโทษ (Exception)"
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                {error && (
                    <div className="bg-red-50 text-red-600 border border-red-200 p-3 rounded-lg text-sm text-center">
                        {error}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">เหตุผลหลัก</label>
                    <select
                        value={reasonCode}
                        onChange={e => setReasonCode(e.target.value)}
                        disabled={loading}
                        className="w-full border-gray-300 rounded-lg p-2.5 text-sm focus:ring-primary focus:border-primary border"
                        required
                    >
                        <option value="">-- เลือกเหตุผล --</option>
                        <option value="MEDICAL">ป่วย/เหตุผลทางสุขภาพ (MEDICAL)</option>
                        <option value="EMERGENCY">เหตุฉุกเฉินกะทันหัน (EMERGENCY)</option>
                        <option value="ACADEMIC">เหตุผลทางวิชาการ/สอบ (ACADEMIC)</option>
                        <option value="OTHER">อื่นๆ (OTHER)</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">รายละเอียดเพิ่มเติม</label>
                    <textarea
                        value={reasonDetail}
                        onChange={e => setReasonDetail(e.target.value)}
                        disabled={loading}
                        className="w-full border-gray-300 rounded-lg p-2.5 text-sm focus:ring-primary focus:border-primary border min-h-[100px]"
                        placeholder="อธิบายเหตุผลความจำเป็นที่ต้องยกเลิก/ไม่มาตามนัด"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                        <Upload className="w-4 h-4" /> ลิงก์ไฟล์หลักฐาน (ถ้ามี)
                    </label>
                    <input
                        type="file"
                        multiple
                        accept=".pdf, .png, .jpg, .jpeg"
                        onChange={e => {
                            if (e.target.files) {
                                setFiles(Array.from(e.target.files));
                            }
                        }}
                        disabled={loading}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 border border-gray-300 rounded-lg p-2 bg-gray-50"
                    />
                    {files.length > 0 && (
                        <ul className="mt-2 text-xs text-gray-600 list-disc list-inside">
                            {files.map((file, i) => (
                                <li key={i}>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</li>
                            ))}
                        </ul>
                    )}
                    <p className="text-[10px] text-gray-500 mt-1">* หากแนบเอกสารจะช่วยให้การพิจารณาเร็วขึ้น</p>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                        ยกเลิก
                    </button>
                    <button
                        type="submit"
                        disabled={loading || !reasonCode || !reasonDetail}
                        className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        ยื่นคำขอ
                    </button>
                </div>
            </form>
        </Modal>
    );
}
