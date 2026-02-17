// src/components/notification/AlertBox.tsx
'use client';

import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { NotificationType } from './types';

const styleMap = {
  error: {
    bg: 'bg-red-50 border-red-200 text-red-700',
    icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
    action: 'text-red-600 hover:text-red-700',
  },
  success: {
    bg: 'bg-green-50 border-green-200 text-green-700',
    icon: <CheckCircle className="w-5 h-5 text-green-500" />,
    action: 'text-green-600 hover:text-green-700',
  },
  warning: {
    bg: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
    action: 'text-yellow-700 hover:text-yellow-800',
  },
  info: {
    bg: 'bg-blue-50 border-blue-200 text-blue-700',
    icon: <Info className="w-5 h-5 text-blue-500" />,
    action: 'text-blue-600 hover:text-blue-700',
  },
  reward: {
    bg: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    icon: <Info className="w-5 h-5 text-indigo-500" />, // Using Info for now, or Star if available
    action: 'text-indigo-600 hover:text-indigo-700',
  },
};

interface AlertBoxProps {
  type: NotificationType;
  message: string;

  /** optional action */
  actionLabel?: string;
  onAction?: () => void;
}

export function AlertBox({
  type,
  message,
  actionLabel,
  onAction,
}: AlertBoxProps) {
  const style = styleMap[type];

  return (
    <div className={`flex items-start justify-between gap-3 rounded-xl border p-4 ${style.bg}`}>
      <div className="flex items-start gap-3">
        {style.icon}
        <p className="text-sm leading-relaxed">{message}</p>
      </div>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className={`text-xs font-medium underline whitespace-nowrap ${style.action}`}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
