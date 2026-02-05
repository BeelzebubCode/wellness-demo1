// src/components/admin/schedule/AutoGenerateModal.tsx
'use client';

import { useState, useMemo } from 'react';
import { Modal, Button } from '@/components/ui';
import { Sparkles, Clock, Users, Loader2, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

interface AutoGenerateConfig {
  startHour: number;
  endHour: number;
  slotDuration: number;
  maxCapacity: number;
}

interface AutoGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (config: AutoGenerateConfig) => Promise<void>;
  date: Date;
}

const PRESETS = [
  {
    id: 'morning',
    name: 'เช้า (8:00-12:00)',
    config: { startHour: 8, endHour: 12, slotDuration: 60, maxCapacity: 1 },
  },
  {
    id: 'afternoon',
    name: 'บ่าย (13:00-17:00)',
    config: { startHour: 13, endHour: 17, slotDuration: 60, maxCapacity: 1 },
  },
  {
    id: 'fullday',
    name: 'เต็มวัน (8:00-17:00)',
    config: { startHour: 8, endHour: 17, slotDuration: 60, maxCapacity: 1 },
  },
  {
    id: 'intensive',
    name: 'ถี่ 30 นาที (8:00-17:00)',
    config: { startHour: 8, endHour: 17, slotDuration: 30, maxCapacity: 1 },
  },
];

export function AutoGenerateModal({
  isOpen,
  onClose,
  onGenerate,
  date
}: AutoGenerateModalProps) {
  const [config, setConfig] = useState<AutoGenerateConfig>({
    startHour: 8,
    endHour: 17,
    slotDuration: 60,
    maxCapacity: 1
  });
  const [selectedPreset, setSelectedPreset] = useState<string | null>('fullday');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate slots preview
  const slotsCount = useMemo(() => {
    let count = 0;
    let currentMinutes = config.startHour * 60;
    const endMinutes = config.endHour * 60;

    while (currentMinutes + config.slotDuration <= endMinutes) {
      count++;
      currentMinutes += config.slotDuration;
    }

    return count;
  }, [config]);

  // Apply preset
  const applyPreset = (presetId: string) => {
    const preset = PRESETS.find(p => p.id === presetId);
    if (preset) {
      setConfig(preset.config);
      setSelectedPreset(presetId);
    }
  };

  // Format date
  const formattedDate = date.toLocaleDateString('th-TH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  // Handle submit
  const handleSubmit = async () => {
    if (slotsCount === 0) return;

    setIsSubmitting(true);
    try {
      await onGenerate(config);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="สร้างช่วงเวลาอัตโนมัติ"
      size="md"
    >
      <div className="space-y-4">
        {/* Date Display */}
        <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl">
          <Sparkles className="w-5 h-5 text-emerald-600" />
          <div>
            <p className="text-sm font-medium text-emerald-800">สร้างช่วงเวลาสำหรับ</p>
            <p className="text-xs text-emerald-600">{formattedDate}</p>
          </div>
        </div>

        {/* Presets */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">รูปแบบที่แนะนำ</label>
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map(preset => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.id)}
                className={cn(
                  'flex items-center justify-between p-2.5 rounded-lg border-2 transition-all text-left',
                  selectedPreset === preset.id
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                )}
                disabled={isSubmitting}
              >
                <span className={cn(
                  'text-sm font-medium',
                  selectedPreset === preset.id ? 'text-emerald-700' : 'text-slate-700'
                )}>
                  {preset.name}
                </span>
                <ChevronRight className={cn(
                  'w-4 h-4',
                  selectedPreset === preset.id ? 'text-emerald-500' : 'text-slate-300'
                )} />
              </button>
            ))}
          </div>
        </div>

        {/* Custom Config */}
        <div className="space-y-3 p-3 bg-slate-50 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">ปรับแต่งเอง</span>
            {selectedPreset && (
              <button
                type="button"
                onClick={() => setSelectedPreset(null)}
                className="text-xs text-emerald-600 hover:underline"
              >
                ใช้ค่าที่กำหนดเอง
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                <Clock className="w-3 h-3 inline mr-1" />
                เริ่ม
              </label>
              <select
                value={config.startHour}
                onChange={(e) => {
                  setConfig({ ...config, startHour: Number(e.target.value) });
                  setSelectedPreset(null);
                }}
                className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg bg-white"
                disabled={isSubmitting}
              >
                {Array.from({ length: 14 }, (_, i) => i + 7).map(h => (
                  <option key={h} value={h}>{h.toString().padStart(2, '0')}:00</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">
                <Clock className="w-3 h-3 inline mr-1" />
                สิ้นสุด
              </label>
              <select
                value={config.endHour}
                onChange={(e) => {
                  setConfig({ ...config, endHour: Number(e.target.value) });
                  setSelectedPreset(null);
                }}
                className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg bg-white"
                disabled={isSubmitting}
              >
                {Array.from({ length: 14 }, (_, i) => i + 8).map(h => (
                  <option key={h} value={h}>{h.toString().padStart(2, '0')}:00</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">ระยะเวลา/ช่วง</label>
              <select
                value={config.slotDuration}
                onChange={(e) => {
                  setConfig({ ...config, slotDuration: Number(e.target.value) });
                  setSelectedPreset(null);
                }}
                className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg bg-white"
                disabled={isSubmitting}
              >
                <option value={30}>30 นาที</option>
                <option value={45}>45 นาที</option>
                <option value={60}>60 นาที</option>
                <option value={90}>90 นาที</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">
                <Users className="w-3 h-3 inline mr-1" />
                รับได้/ช่วง
              </label>
              <select
                value={config.maxCapacity}
                onChange={(e) => {
                  setConfig({ ...config, maxCapacity: Number(e.target.value) });
                  setSelectedPreset(null);
                }}
                className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg bg-white"
                disabled={isSubmitting}
              >
                {[1, 2, 3, 4, 5].map(n => (
                  <option key={n} value={n}>{n} คน</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="flex items-center justify-between p-3 bg-slate-100 rounded-lg">
          <span className="text-sm text-slate-600">จะสร้างทั้งหมด</span>
          <span className="text-lg font-bold text-emerald-600">{slotsCount} ช่วงเวลา</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1"
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={slotsCount === 0 || isSubmitting}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-1" />
                สร้าง {slotsCount} ช่วงเวลา
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default AutoGenerateModal;