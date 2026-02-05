// ==========================================
// 📌 Admin Component: ConsultantCard
// ==========================================

import { Card, Badge, Button } from '@/components/ui';
import { cn } from '@/lib/cn';
import type { Consultant } from '@/types';

export interface ConsultantCardProps {
  consultant: Consultant;
  onEdit: () => void;
  onToggleActive: () => void;
}

export function ConsultantCard({ consultant, onEdit, onToggleActive }: ConsultantCardProps) {
  return (
    <Card className={cn('relative overflow-hidden', !consultant.isActive && 'opacity-60')}>
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
          {consultant.avatar ? (
            <img src={consultant.avatar} alt={consultant.name} className="w-full h-full rounded-2xl object-cover" />
          ) : (
            consultant.name.charAt(0)
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-gray-800 truncate">{consultant.name}</h3>
            <Badge variant={consultant.isActive ? 'success' : 'default'} size="sm">
              {consultant.isActive ? 'ใช้งาน' : 'ไม่ใช้งาน'}
            </Badge>
          </div>
          
          {consultant.specialty && (
            <p className="text-sm text-gray-500 mb-2">🎯 {consultant.specialty}</p>
          )}
          
          <div className="flex flex-wrap gap-3 text-xs text-gray-400">
            {consultant.email && <span>📧 {consultant.email}</span>}
            {consultant.phone && <span>📱 {consultant.phone}</span>}
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
        <Button variant="ghost" size="sm" onClick={onEdit}>
          ✏️ แก้ไข
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleActive}
          className={consultant.isActive ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}
        >
          {consultant.isActive ? '🚫 ปิดใช้งาน' : '✅ เปิดใช้งาน'}
        </Button>
      </div>
    </Card>
  );
}