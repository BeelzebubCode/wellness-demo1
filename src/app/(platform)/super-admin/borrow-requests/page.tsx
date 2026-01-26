"use client";

import { useRouter } from "next/navigation";
import { usePlatformBorrowRequests } from "@/features/borrow-requests/hooks/usePlatformBorrowRequests";
import { BorrowRequestsTable } from "@/components/super-admin/borrow-requests";

export default function SuperBorrowRequestsPage() {
  const router = useRouter();
  const { rows, loading, approve, reject, openAssign } = usePlatformBorrowRequests();

  return (
    <BorrowRequestsTable
      rows={rows || []}
      loading={loading}
      onView={(id) => router.push(`./borrow-requests/${id}`)}
      onApprove={async (id) => {
        await approve(id);
      }}
      onReject={(id) => {
        // จะเปิด modal ก็ได้ หรือไปหน้า detail ก็ได้
        router.push(`./borrow-requests/${id}?action=reject`);
      }}
      onAssign={(id) => {
        // เปิด modal assign หรือไปหน้า detail
        if (openAssign) openAssign(id);
        else router.push(`./borrow-requests/${id}?action=assign`);
      }}
    />
  );
}
