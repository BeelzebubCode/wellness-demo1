//src\app\(platform)\super-admin\borrow-requests\[id]\page.tsx

"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui";
import {
  BorrowRequestDetailPanel,
  AssignBorrowRequestModal,
  RejectBorrowRequestModal,
} from "@/components/super-admin/borrow-requests";
import { usePlatformBorrowRequest } from "@/features/borrow-requests/hooks/usePlatformBorrowRequest";

export default function SuperBorrowRequestDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const search = useSearchParams();

  const id = useMemo(() => Number(params?.id), [params]);
  const action = (search.get("action") || "").toLowerCase();

  const { data, loading, refetch, approve, reject, assign } =
    usePlatformBorrowRequest(id);

  const [openReject, setOpenReject] = useState(action === "reject");
  const [openAssign, setOpenAssign] = useState(action === "assign");

  if (!Number.isFinite(id) || id <= 0) return <div className="text-red-600">id ไม่ถูกต้อง</div>;

  if (loading) {
    return (
      <div className="py-16 flex justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // ✅ กัน null ก่อนส่งเข้า Panel
  if (!data) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            กลับ
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch?.()}>
              รีเฟรช
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur-xl p-4">
          <div className="text-lg font-semibold">ไม่พบคำขอยืมนี้</div>
          <div className="text-sm text-zinc-600 mt-1">
            อาจถูกลบ / ไม่มีสิทธิ์เข้าถึง / หรือ id ไม่ถูกต้อง
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" onClick={() => router.back()}>
          กลับ
        </Button>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch?.()}>
            รีเฟรช
          </Button>
          <Button
            onClick={async () => {
              await approve();
              await refetch?.();
            }}
          >
            Approve
          </Button>
          <Button variant="danger" onClick={() => setOpenReject(true)}>
            Reject
          </Button>
          <Button onClick={() => setOpenAssign(true)}>Assign</Button>
        </div>
      </div>

      <BorrowRequestDetailPanel data={data} />

      <RejectBorrowRequestModal
        open={openReject}
        onOpenChange={(v) => {
          setOpenReject(v);
          if (!v) router.replace(`./${id}`);
        }}
        loading={loading}
        onConfirm={async (payload) => {
          await reject({ reason: payload }); 
          setOpenReject(false);
          await refetch?.();
        }}
      />

      <AssignBorrowRequestModal
        open={openAssign}
        onOpenChange={(v) => {
          setOpenAssign(v);
          if (!v) router.replace(`./${id}`);
        }}
        loading={loading}
        neededCount={data.borrowNeededCount ?? 1}
        onConfirm={async (items) => {
          await assign({ items });
          setOpenAssign(false);
          await refetch?.();
        }}
      />
    </div>
  );
}
