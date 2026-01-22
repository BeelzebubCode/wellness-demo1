// ==========================================
// 📌 LIFF Entry Point
// ==========================================

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLine } from '@/contexts/LineContext';
import { LoadingSpinner } from '@/components/ui';

export default function LiffPage() {
  const router = useRouter();
  const { isLoading } = useLine();

  useEffect(() => {
    if (!isLoading) {
      router.replace('/booking');
    }
  }, [isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-cyan-50">
      <div className="text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg animate-pulse">
          <span className="text-4xl">💚</span>
        </div>
        <LoadingSpinner size="lg" label="กำลังเชื่อมต่อ LINE..." />
      </div>
    </div>
  );
}