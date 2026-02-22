// src/features/booking/components/my-appointments/CancelBookingModal.tsx

"use client";

import { useState, useEffect } from "react";
import { AlertBox } from "@/components/notification/AlertBox";
import { Button, Modal, ModalFooter } from "@/components/ui";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { AlertCircle, AlertTriangle, Info, BookOpen } from "lucide-react";
import Link from "next/link";

interface CancellationReason {
  cancellation_reason_id: number;
  cancellation_reason_code: string;
  cancellation_reason_name_th: string;
  cancellation_reason_name_en: string | null;
}

import type { MyBookingDto } from "@/features/booking/types";

export function CancelBookingModal({
  open,
  booking,
  trustStatus,
  onClose,
  cancellationReasonId,
  onChangeCancellationReasonId,
  cancellationNote,
  onChangeCancellationNote,
  error,
  hasSubmitted,
  onConfirm,
  isLoading,
}: {
  open: boolean;
  booking: MyBookingDto | null;
  trustStatus?: any;
  onClose: () => void;

  cancellationReasonId: number | null;
  onChangeCancellationReasonId: (id: number) => void;

  cancellationNote: string;
  onChangeCancellationNote: (note: string) => void;

  error: string | null;
  hasSubmitted: boolean;

  onConfirm: () => void;
  isLoading?: boolean;
}) {
  const [reasons, setReasons] = useState<CancellationReason[]>([]);
  const [loadingReasons, setLoadingReasons] = useState(true);

  useEffect(() => {
    if (open) {
      fetchReasons();
    }
  }, [open]);

  async function fetchReasons() {
    try {
      setLoadingReasons(true);
      const response = await fetch("/api/v2/master/cancellation-reasons");
      const result = await response.json();

      if (result.success) {
        setReasons(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch cancellation reasons:", error);
    } finally {
      setLoadingReasons(false);
    }
  }

  const reasonOptions = reasons.map((r) => ({
    value: r.cancellation_reason_id.toString(),
    label: r.cancellation_reason_name_th,
  }));

  const timeDiffHours = booking?.startAt ? (new Date(booking.startAt).getTime() - Date.now()) / (1000 * 60 * 60) : Number.MAX_SAFE_INTEGER;
  const isVeryLateCancel = timeDiffHours < 6;
  const isLateCancel = timeDiffHours >= 6 && timeDiffHours < 24;

  const currentLateCancelCount = trustStatus?.student_trust_late_cancel_count ?? 0;
  const isCriticalWarning = currentLateCancelCount >= 2;

  return (
    <Modal isOpen={open} onClose={onClose} title="ยืนยันการยกเลิก" size="lg">
      <div className="space-y-4">
        {isVeryLateCancel && (
          <div className="bg-red-50/80 border border-red-200 rounded-xl p-4 flex gap-3 items-start shadow-sm flex-col sm:flex-row">
            <div className="flex items-start gap-3 w-full">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
              <div className="text-sm flex-1">
                <strong className="text-red-800 text-sm block mb-1">
                  คำเตือน: ยกเลิกกระชั้นชิด (น้อยกว่า 6 ชั่วโมง)
                </strong>
                <p className="text-red-700 leading-relaxed text-sm">
                  การยกเลิกนัดหมายนี้ ระบบจะพิจารณาว่าท่าน <b>"ไม่มาตามนัด"</b> (No Show)<br />
                  และจะถูกระงับสิทธิ์การจองชั่วคราวทันที
                </p>
                
                <div className="mt-3 p-3 bg-red-100/60 border border-red-200/70 rounded-lg flex flex-col gap-3">
                  <div className="flex items-start gap-2 text-sm text-red-800 font-medium min-w-0 flex-1">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="leading-snug">หากมีเหตุสุดวิสัย ท่านสามารถยื่น "ขอยกเว้นโทษ" ได้ภายหลัง</span>
                  </div>
                  <Link href="/docs?topic=cancellation-policy" target="_blank" className="w-full inline-flex items-center justify-center text-sm font-semibold text-red-700 bg-white hover:bg-white/90 px-3 py-2 rounded-md shadow-sm border border-red-200/80 transition-all">
                    <BookOpen className="w-4 h-4 mr-1.5" /> อ่านรายละเอียดและบทลงโทษ
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {!isVeryLateCancel && isLateCancel && (
          <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 flex gap-3 items-start shadow-sm flex-col sm:flex-row">
            <div className="flex items-start gap-3 w-full">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div className="text-sm flex-1">
                <strong className="text-amber-800 text-sm block mb-1">
                  คำเตือน: ยกเลิกล่วงหน้าน้อยกว่า 24 ชั่วโมง
                </strong>
                <p className="text-amber-700 leading-relaxed text-sm">
                  การยกเลิกนี้จะถูกบันทึกเป็นประวัติ <b>"ยกเลิกกระชั้นชิด"</b><br />
                  ขณะนี้ท่านมีประวัติสะสม <span className="inline-block bg-amber-200 text-amber-900 font-bold px-1.5 py-0.5 rounded ml-1 leading-none">{currentLateCancelCount}/3</span> ครั้ง
                </p>

                {isCriticalWarning ? (
                  <div className="mt-3 p-3 bg-red-100/80 border border-red-200 rounded-lg flex flex-col gap-3">
                    <div className="flex items-start gap-2 text-sm text-red-800 font-semibold min-w-0 flex-1">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span className="leading-snug break-words">หากท่านยืนยัน ระบบจะระงับสิทธิ์การจองชั่วคราวทันที ครบ 3 ครั้ง</span>
                    </div>
                    <Link href="/docs?topic=cancellation-policy" target="_blank" className="w-full inline-flex items-center justify-center text-sm font-semibold text-red-700 bg-white hover:bg-white/90 px-3 py-2 rounded-md shadow-sm border border-red-200 transition-all">
                      <BookOpen className="w-4 h-4 mr-1.5" /> อ่านเงื่อนไขการระงับสิทธิ์
                    </Link>
                  </div>
                ) : (
                  <div className="mt-3 p-3 bg-amber-100/60 border border-amber-200/70 rounded-lg flex flex-col gap-3">
                    <div className="flex items-start gap-2 text-sm text-amber-800 font-medium min-w-0 flex-1">
                      <Info className="w-4 h-4 shrink-0 mt-0.5" />
                      <span className="leading-snug">หากสะสมครบ 3 ครั้ง ระบบจะระงับสิทธิ์การจอง</span>
                    </div>
                    <Link href="/docs?topic=cancellation-policy" target="_blank" className="w-full inline-flex items-center justify-center text-sm font-semibold text-amber-700 bg-white hover:bg-white/90 px-3 py-2 rounded-md shadow-sm border border-amber-200/80 transition-all">
                      <BookOpen className="w-4 h-4 mr-1.5" /> อ่านเงื่อนไขเพิ่มเติม
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <p className="text-sm text-gray-600">คุณแน่ใจหรือไม่ที่จะยกเลิกการจองนี้?</p>

        {/* Cancellation Reason Dropdown */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            เหตุผลในการยกเลิก <span className="text-red-500">*</span>
          </label>
          {loadingReasons ? (
            <div className="animate-pulse h-12 bg-gray-100 rounded-xl"></div>
          ) : (
            <CustomSelect
              placeholder="เลือกเหตุผล"
              options={reasonOptions}
              value={cancellationReasonId?.toString() || ""}
              onValueChange={(val) => onChangeCancellationReasonId(Number(val))}
              error={!!(error && hasSubmitted && !cancellationReasonId)}
            />
          )}
        </div>

        {/* Optional Note */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            รายละเอียดเพิ่มเติม (ไม่บังคับ)
          </label>
          <textarea
            value={cancellationNote}
            onChange={(e) => {
              onChangeCancellationNote(e.target.value);
              // Auto-expand textarea
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
            placeholder="ระบุรายละเอียดเพิ่มเติม..."
            rows={2}
            className="w-full p-3 rounded-xl text-sm transition border border-gray-200 shadow-sm hover:border-gray-300 focus:border-primary-500 focus:ring-primary-300 focus:outline-none focus:ring-2 resize-none overflow-hidden min-h-[60px] max-h-[200px]"
            style={{ height: 'auto' }}
          />
        </div>

        {error ? <AlertBox type="error" message={error} /> : null}
      </div>

      <ModalFooter>
        <Button variant="ghost" onClick={onClose} disabled={isLoading}>
          ยกเลิก
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={isLoading || loadingReasons}>
          ยืนยันยกเลิกการจอง
        </Button>
      </ModalFooter>
    </Modal>
  );
}
