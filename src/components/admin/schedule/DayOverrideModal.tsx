// src/components/admin/schedule/DayOverrideModal.tsx
'use client';

import React, { useState } from 'react';
import { Loader2, AlertTriangle, Trash2, Plus } from 'lucide-react';
import { Modal } from '@/components/ui';

interface DayOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  onAutoGenerate: (config: {
    startHour: number;
    endHour: number;
    slotDuration: number;
    maxCapacity: number;
  }) => Promise<void>;
  onDeleteAll: () => Promise<void>;
}

export function DayOverrideModal({
  isOpen,
  onClose,
  date,
  onAutoGenerate,
  onDeleteAll,
}: DayOverrideModalProps) {
  const [mode, setMode] = useState<'generate' | 'delete' | null>(null);
  const [config, setConfig] = useState({
    startHour: 9,
    endHour: 16,
    slotDuration: 60,
    maxCapacity: 1,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      await onAutoGenerate(config);
      onClose();
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      await onDeleteAll();
      onClose();
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('th-TH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="จัดการตารางวัน" size="md">
      <div className="space-y-4">
        <div className="p-3 bg-slate-50 rounded-lg text-center">
          <p className="text-sm text-slate-600">วันที่เลือก</p>
          <p className="font-semibold text-slate-900">{formatDate(date)}</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
        )}

        {!mode && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setMode('generate')}
              className="p-4 border-2 border-dashed border-emerald-300 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all flex flex-col items-center gap-2"
            >
              <Plus className="w-8 h-8 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700">สร้างช่วงเวลาอัตโนมัติ</span>
            </button>
            <button
              onClick={() => setMode('delete')}
              className="p-4 border-2 border-dashed border-red-300 rounded-xl hover:border-red-500 hover:bg-red-50 transition-all flex flex-col items-center gap-2"
            >
              <Trash2 className="w-8 h-8 text-red-600" />
              <span className="text-sm font-medium text-red-700">ลบช่วงเวลาทั้งหมด</span>
            </button>
          </div>
        )}

        {mode === 'generate' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">เวลาเริ่ม</label>
                <select
                  value={config.startHour}
                  onChange={(e) => setConfig({ ...config, startHour: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  disabled={isSubmitting}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 7).map((h) => (
                    <option key={h} value={h}>{`${h.toString().padStart(2, '0')}:00`}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">เวลาสิ้นสุด</label>
                <select
                  value={config.endHour}
                  onChange={(e) => setConfig({ ...config, endHour: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  disabled={isSubmitting}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 8).map((h) => (
                    <option key={h} value={h}>{`${h.toString().padStart(2, '0')}:00`}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ระยะเวลา (นาที)</label>
                <select
                  value={config.slotDuration}
                  onChange={(e) => setConfig({ ...config, slotDuration: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  disabled={isSubmitting}
                >
                  <option value={30}>30 นาที</option>
                  <option value={60}>60 นาที</option>
                  <option value={90}>90 นาที</option>
                  <option value={120}>120 นาที</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">จำนวนที่รับ</label>
                <select
                  value={config.maxCapacity}
                  onChange={(e) => setConfig({ ...config, maxCapacity: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  disabled={isSubmitting}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n} คน</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setMode(null)}
                className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                disabled={isSubmitting}
              >
                ย้อนกลับ
              </button>
              <button
                onClick={handleGenerate}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                สร้างช่วงเวลา
              </button>
            </div>
          </div>
        )}

        {mode === 'delete' && (
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-800 text-sm">
                <strong>คำเตือน:</strong> การดำเนินการนี้จะลบช่วงเวลาทั้งหมดที่ยังไม่มีการจอง
                ไม่สามารถย้อนกลับได้
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setMode(null)}
                className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                disabled={isSubmitting}
              >
                ยกเลิก
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                ยืนยันลบ
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default DayOverrideModal;