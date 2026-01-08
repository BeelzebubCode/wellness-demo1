// src/components/admin/schedule/SlotCard.tsx

'use client';

import { cn } from '@/lib/cn';
import { Edit2, Trash2 } from 'lucide-react';
import type { TimeSlot } from '@/types';

interface SlotCardProps {
  slot: TimeSlot;
  index: number;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
}

export function SlotCard({ slot, index, onEdit, onDelete }: SlotCardProps) {
  return (
    <div className="group relative bg-white border border-gray-200 hover:border-primary-400 hover:shadow-md rounded-lg p-3 transition-all cursor-default">
      <div className="flex justify-between items-start mb-1">
        <span className="text-sm font-bold text-gray-700 font-mono tracking-tight">
          {slot.startTime}
        </span>
        
        {/* Hover Actions */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 bg-white shadow-sm rounded-md p-0.5 border border-gray-100">
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(index); }} 
            className="p-1 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded"
          >
            <Edit2 className="w-3 h-3" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(index); }} 
            className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
      
      <div className="text-[10px] text-gray-400 mb-2">
        ถึง {slot.endTime}
      </div>
      
      <div className="flex items-center justify-between">
         <span className={cn(
           "text-[10px] px-1.5 py-0.5 rounded border font-medium",
           slot.maxBookings > 1 
            ? "bg-blue-50 text-blue-600 border-blue-100"
            : "bg-gray-50 text-gray-600 border-gray-100"
         )}>
            {slot.maxBookings} คิว
         </span>
      </div>
    </div>
  );
}