// src/components/admin/bookings/CompleteBookingModal.tsx
'use client';

import React, { useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/ui';

interface CompleteBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { note: string; nextStep?: string; riskLevel: number }) => Promise<void>;
  bookingId?: number;
  studentName?: string;
}

export function CompleteBookingModal({
  isOpen,
  onClose,
  onSubmit,
  bookingId,
  studentName,
}: CompleteBookingModalProps) {
  const [note, setNote] = useState('');
  const [nextStep, setNextStep] = useState('');
  const [riskLevel, setRiskLevel] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!note.trim()) {
      setError('กรุณากรอกบันทึกผลการให้คำปรึกษา');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        note: note.trim(),
        nextStep: nextStep.trim() || undefined,
        riskLevel,
      });
      
      // Reset form
      setNote('');
      setNextStep('');
      setRiskLevel(1);
      onClose();
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setIsSubmitting(false);
    }
  };

  const riskLabels = ['ต่ำมาก', 'ต่ำ', 'ปานกลาง', 'สูง', 'สูงมาก'];
  const riskColors = ['bg-emerald-500', 'bg-green-500', 'bg-amber-500', 'bg-orange-500', 'bg-red-500'];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="บันทึกผลการให้คำปรึกษา" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {studentName && (
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600">
              นิสิต: <span className="font-semibold text-slate-900">{studentName}</span>
            </p>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Note */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">
            บันทึกผลการให้คำปรึกษา <span className="text-red-500">*</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="สรุปเนื้อหาการให้คำปรึกษา..."
            rows={4}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
            disabled={isSubmitting}
          />
        </div>

        {/* Next Step */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">
            ขั้นตอนถัดไป (ถ้ามี)
          </label>
          <textarea
            value={nextStep}
            onChange={(e) => setNextStep(e.target.value)}
            placeholder="เช่น นัดพบครั้งถัดไป, ส่งต่อหน่วยงานอื่น..."
            rows={2}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
            disabled={isSubmitting}
          />
        </div>

        {/* Risk Level */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-slate-700">
            ระดับความเสี่ยง
          </label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setRiskLevel(level)}
                className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                  riskLevel === level
                    ? `${riskColors[level - 1]} text-white`
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                disabled={isSubmitting}
              >
                {level}
              </button>
            ))}
          </div>
          <p className="text-sm text-slate-500 text-center">
            ระดับที่เลือก: <span className="font-medium">{riskLabels[riskLevel - 1]}</span>
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium"
            disabled={isSubmitting}
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium flex items-center justify-center gap-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                กำลังบันทึก...
              </>
            ) : (
              'บันทึกผล'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default CompleteBookingModal;