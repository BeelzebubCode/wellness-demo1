//src\app\(platform)\super-admin\borrow-requests\[id]\page.tsx

"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, RefreshCw, CheckCircle, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui";
import {
  BorrowRequestDetailPanel,
  AssignBorrowRequestModal,
} from "@/components/super-admin/borrow-requests";
import { usePlatformBorrowRequest } from "@/features/borrow-requests/hooks/usePlatformBorrowRequest";

export default function SuperBorrowRequestDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const search = useSearchParams();

  const id = useMemo(() => Number(params?.id), [params]);
  const action = (search.get("action") || "").toLowerCase();

  const { data, loading, refetch, approve, assign } =
    usePlatformBorrowRequest(id);

  const [openAssign, setOpenAssign] = useState(action === "assign");
  const [isApproving, setIsApproving] = useState(false);

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
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3 bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-200 shadow-sm">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            กลับ
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch?.()}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              รีเฟรช
            </Button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-lg font-semibold">ไม่พบคำขอยืมนี้</div>
          <div className="text-sm text-slate-600 mt-1">
            อาจถูกลบ / ไม่มีสิทธิ์เข้าถึง / หรือ id ไม่ถูกต้อง
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-200 shadow-sm">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          กลับ
        </Button>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch?.()}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            รีเฟรช
          </Button>

          {data.borrowRequestStatus === "SUBMITTED" && (
            <Button
              variant="primary"
              size="sm"
              onClick={async () => {
                setIsApproving(true);
                try {
                  await approve();
                  await refetch?.();
                } finally {
                  setIsApproving(false);
                }
              }}
              isLoading={isApproving}
              leftIcon={!isApproving ? <CheckCircle className="w-4 h-4" /> : undefined}
            >
              อนุมัติคำขอ
            </Button>
          )}

          {data.borrowRequestStatus === "APPROVED" && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setOpenAssign(true)}
              leftIcon={<UserPlus className="w-4 h-4" />}
            >
              Assign
            </Button>
          )}
        </div>
      </div>

      <BorrowRequestDetailPanel data={data} />


      <AssignBorrowRequestModal
        open={openAssign}
        onOpenChange={(v) => {
          setOpenAssign(v);
          if (!v) router.replace(`./${id}`);
        }}
        loading={loading}
        neededCount={data.borrowNeededCount ?? 1}

        borrowRequestId={id}
        fromUniversityId={data.fromUniversityId}

        // ✅ ใช้เวลาจาก borrow request
        defaultStartAt={data.borrowNeededFrom || new Date().toISOString()}
        defaultEndAt={data.borrowNeededTo || new Date().toISOString()}

        onConfirm={async (items) => {
          await assign({ items });
          setOpenAssign(false);
          await refetch?.();
        }}
      />
    </div>
  );
}
