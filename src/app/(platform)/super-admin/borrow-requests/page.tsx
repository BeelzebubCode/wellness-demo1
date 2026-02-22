// src/app/(platform)/super-admin/borrow-requests/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { usePlatformBorrowRequests } from "@/features/borrow-requests/hooks/usePlatformBorrowRequests";
import { BorrowRequestsTable } from "@/components/super-admin/borrow-requests";

export default function SuperBorrowRequestsPage() {
  const router = useRouter();
  const { rows, total, loading, error } = usePlatformBorrowRequests();

  console.log('📊 Page Data:', { rows, total, loading, error });

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <strong>เกิดข้อผิดพลาด:</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div>
      <BorrowRequestsTable
        rows={rows}
        loading={loading}
        onView={(id) => router.push(`/super-admin/borrow-requests/${id}`)}
        onApprove={(id) => router.push(`/super-admin/borrow-requests/${id}`)}
        onAssign={(id) => router.push(`/super-admin/borrow-requests/${id}?action=assign`)}
      />
    </div>
  );
}