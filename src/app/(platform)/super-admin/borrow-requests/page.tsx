//src\app\(platform)\super-admin\borrow-requests\page.tsx
// src/app/(platform)/super-admin/borrow-requests/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { usePlatformBorrowRequests } from "@/features/borrow-requests/hooks/usePlatformBorrowRequests";
import { BorrowRequestsTable } from "@/components/super-admin/borrow-requests";

export default function SuperBorrowRequestsPage() {
  const router = useRouter();
  const { rows, loading } = usePlatformBorrowRequests();

  const safeRows = Array.isArray(rows) ? rows : [];

  return (
    <BorrowRequestsTable
      rows={safeRows}
      loading={loading}
      onView={(id) => router.push(`./${id}`)}
      onApprove={(id) => router.push(`./${id}`)}
      onReject={(id) => router.push(`./${id}?action=reject`)}
      onAssign={(id) => router.push(`./${id}?action=assign`)}
    />
  );
}

