// src/components/admin/schedule/SlotFormModal.tsx

'use client';

import { Modal, ModalFooter, Button } from '@/components/ui';
import { Save, Plus } from 'lucide-react';

interface SlotFormData {
  startTime: string;
  endTime: string;
  maxBookings: number;
}

interface SlotFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  isEditing: boolean;
  formData: SlotFormData;
  setFormData: (data: SlotFormData) => void;
}

export function SlotFormModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isEditing, 
  formData, 
  setFormData 
}: SlotFormModalProps) {
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'แก้ไขช่วงเวลา' : 'เพิ่มช่วงเวลา'} size="sm">
      <div className="space-y-4 p-1">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">เวลาเริ่ม</label>
            <input 
              type="time" 
              value={formData.startTime} 
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} 
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all" 
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">เวลาจบ</label>
            <input 
              type="time" 
              value={formData.endTime} 
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} 
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all" 
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">จำนวนรับสูงสุด (คิว)</label>
          <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-lg border border-gray-200 w-fit">
            <button onClick={() => setFormData({ ...formData, maxBookings: Math.max(1, formData.maxBookings - 1) })} className="w-8 h-8 bg-white border border-gray-200 rounded-md hover:border-primary-300 hover:text-primary-600 transition-colors flex items-center justify-center shadow-sm">
              <span className="text-lg leading-none mb-0.5">-</span>
            </button>
            <span className="text-lg font-bold w-8 text-center text-gray-700">{formData.maxBookings}</span>
            <button onClick={() => setFormData({ ...formData, maxBookings: formData.maxBookings + 1 })} className="w-8 h-8 bg-white border border-gray-200 rounded-md hover:border-primary-300 hover:text-primary-600 transition-colors flex items-center justify-center shadow-sm">
              <span className="text-lg leading-none mb-0.5">+</span>
            </button>
          </div>
        </div>
      </div>
      <ModalFooter>
        <Button variant="ghost" size="sm" onClick={onClose}>ยกเลิก</Button>
        <Button size="sm" onClick={onSubmit} className="bg-primary-600 hover:bg-primary-700 text-white">
          {isEditing ? <><Save className="w-4 h-4 mr-2" /> บันทึกการแก้ไข</> : <><Plus className="w-4 h-4 mr-2" /> เพิ่มช่วงเวลา</>}
        </Button>
      </ModalFooter>
    </Modal>
  );
}