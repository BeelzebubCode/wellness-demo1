'use client';

import { AlertTriangle } from 'lucide-react';

interface AlertBoxProps {
  message?: string | null;
}

export function AlertBox({ message }: AlertBoxProps) {
  if (!message) return null;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
      <AlertTriangle className="w-5 h-5 mt-0.5 text-red-500" />
      <p className="text-sm leading-relaxed">{message}</p>
    </div>
  );
}
