// src/components/admin/schedule/SlotEditor.tsx
"use client";

import { useState, useCallback } from "react";
import { DayHeader } from "./DayHeader";
import { SlotGrid } from "./SlotGrid";
import { SlotFormModal } from "./SlotFormModal";
import { AutoGenerateModal } from "./AutoGenerateModal";
import { AlertTriangle, Trash2, Loader2 } from "lucide-react";
import { Modal, Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { TimeSlot } from "@/features/schedule/types";

interface SlotEditorProps {
  selectedDate: Date;
  slots: TimeSlot[];
  isLoading: boolean;
  onAddSlot: (data: {
    startTime: string;
    endTime: string;
    maxCapacity: number;
  }) => Promise<void>;
  onAddSlotsBatch: (
    payload: Array<{ startTime: string; endTime: string; maxCapacity: number }>
  ) => Promise<void>;
  onEditSlot: (
    slotId: number,
    data: { startTime?: string; endTime?: string; maxCapacity?: number }
  ) => Promise<void>;
  onDeleteSlot: (slotId: number) => Promise<void>;
  onDeleteAllSlots: () => Promise<void>;
  onToggleSlotAvailability: (
    slotId: number,
    isAvailable: boolean
  ) => Promise<void>;
}

export function SlotEditor({
  selectedDate,
  slots,
  isLoading,
  onAddSlot,
  onAddSlotsBatch,
  onEditSlot,
  onDeleteSlot,
  onDeleteAllSlots,
  onToggleSlotAvailability,
}: SlotEditorProps) {
  // Modal states
  const [showSlotForm, setShowSlotForm] = useState(false);
  const [showAutoGenerate, setShowAutoGenerate] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Handlers
  const handleAddSlot = useCallback(() => {
    setEditingSlot(null);
    setShowSlotForm(true);
  }, []);

  const handleSlotClick = useCallback((slot: TimeSlot) => {
    setEditingSlot(slot);
    setShowSlotForm(true);
  }, []);

  // Form submit handler
  const handleSlotFormSubmit = useCallback(
    async (data: {
      startTime: string;
      endTime: string;
      maxCapacity: number;
    }) => {
      if (editingSlot) {
        await onEditSlot(editingSlot.id, {
          startTime: data.startTime,
          endTime: data.endTime,
          maxCapacity: data.maxCapacity,
        });
      } else {
        await onAddSlot(data);
      }
    },
    [editingSlot, onAddSlot, onEditSlot]
  );

  // Toggle availability handler
  const handleToggleAvailability = useCallback(
    async (slotId: number, isAvailable: boolean) => {
      await onToggleSlotAvailability(slotId, isAvailable);
    },
    [onToggleSlotAvailability]
  );

  // Delete slot handler
  const handleDeleteSlot = useCallback(
    async (slotId: number) => {
      await onDeleteSlot(slotId);
    },
    [onDeleteSlot]
  );

  // Auto generate handler
  const handleAutoGenerate = useCallback(
    async (config: {
      startHour: number;
      endHour: number;
      slotDuration: number;
      maxCapacity: number;
    }) => {
      const payload: Array<{
        startTime: string;
        endTime: string;
        maxCapacity: number;
      }> = [];

      let currentMinutes = config.startHour * 60;
      const endMinutes = config.endHour * 60;

      while (currentMinutes + config.slotDuration <= endMinutes) {
        const startH = Math.floor(currentMinutes / 60);
        const startM = currentMinutes % 60;
        const endH = Math.floor((currentMinutes + config.slotDuration) / 60);
        const endM = (currentMinutes + config.slotDuration) % 60;

        payload.push({
          startTime: `${startH.toString().padStart(2, "0")}:${startM
            .toString()
            .padStart(2, "0")}`,
          endTime: `${endH.toString().padStart(2, "0")}:${endM
            .toString()
            .padStart(2, "0")}`,
          maxCapacity: config.maxCapacity,
        });

        currentMinutes += config.slotDuration;
      }
      
      await onAddSlotsBatch(payload);
    },
    [onAddSlotsBatch]
  );

  // Delete all confirm handler
  const handleDeleteAllConfirm = useCallback(async () => {
    setIsDeleting(true);
    try {
      await onDeleteAllSlots();
      setShowDeleteAllConfirm(false);
      setDeleteConfirmText("");
    } finally {
      setIsDeleting(false);
    }
  }, [onDeleteAllSlots]);

  const hasBookings = slots.some((s) => s.bookedCount > 0);
  const deleteConfirmKeyword = "ลบทั้งหมด";
  const canConfirmDelete = deleteConfirmText === deleteConfirmKeyword;

  return (
    <div className="space-y-3">
      {/* Day Header */}
      <DayHeader
        date={selectedDate}
        slots={slots}
        isLoading={isLoading}
        onAutoGenerate={() => setShowAutoGenerate(true)}
        onDeleteAll={() => setShowDeleteAllConfirm(true)}
        onAddSlot={handleAddSlot}
      />

      {/* Slot Grid */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3">
        <SlotGrid
          slots={slots}
          isLoading={isLoading}
          onSlotClick={handleSlotClick}
          onAddSlot={handleAddSlot}
        />
      </div>

      {/* Slot Form Modal */}
      <SlotFormModal
        isOpen={showSlotForm}
        onClose={() => {
          setShowSlotForm(false);
          setEditingSlot(null);
        }}
        onSubmit={handleSlotFormSubmit}
        onToggleAvailability={handleToggleAvailability}
        onDelete={handleDeleteSlot}
        editingSlot={editingSlot}
        existingSlots={slots}
      />

      {/* Auto Generate Modal */}
      <AutoGenerateModal
        isOpen={showAutoGenerate}
        onClose={() => setShowAutoGenerate(false)}
        onGenerate={handleAutoGenerate}
        date={selectedDate}
      />

      {/* Delete All Confirmation Modal */}
      <Modal
        isOpen={showDeleteAllConfirm}
        onClose={() => {
          setShowDeleteAllConfirm(false);
          setDeleteConfirmText("");
        }}
        title="ยืนยันการลบทั้งหมด"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-red-600" />
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-slate-600 mb-2">
              คุณกำลังจะลบช่วงเวลาทั้งหมด ({slots.length} ช่วง) ในวันนี้
            </p>
            {hasBookings && (
              <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 mb-2">
                ⚠️ มีบางช่วงเวลาที่มีการจองแล้ว จะลบเฉพาะที่ไม่มีการจอง
              </div>
            )}
            <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              ⚠️ การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs text-slate-600 text-center">
              พิมพ์{" "}
              <span className="font-bold text-red-600">
                "{deleteConfirmKeyword}"
              </span>{" "}
              เพื่อยืนยัน
            </label>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={deleteConfirmKeyword}
              className={cn(
                "w-full px-3 py-2 text-sm text-center border rounded-lg outline-none transition-all",
                canConfirmDelete
                  ? "border-red-500 bg-red-50 focus:ring-2 focus:ring-red-500/20"
                  : "border-slate-200 focus:ring-2 focus:ring-slate-200"
              )}
              disabled={isDeleting}
              autoFocus
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowDeleteAllConfirm(false);
                setDeleteConfirmText("");
              }}
              disabled={isDeleting}
              className="flex-1"
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleDeleteAllConfirm}
              disabled={!canConfirmDelete || isDeleting}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-1" />
                  ลบทั้งหมด
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default SlotEditor;
