// src/components/head-consultant/borrow-requests/BorrowRequestDetailPanel.tsx

"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { BorrowRequestDetail } from "@/features/borrow-requests/types";
import {
  Users,
  Calendar,
  Clock,
  MapPin,
  FileText,
  AlertCircle,
  MoreVertical,
  Edit2,
  Trash2,
  Send,
  UserCheck,
} from "lucide-react";

type Status = BorrowRequestDetail["borrowRequestStatus"];

function tone(status: Status) {
  switch (status) {
    case "DRAFT":
      return "bg-slate-100 text-slate-700 border-slate-200";
    case "SUBMITTED":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "APPROVED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "ASSIGNED":
      return "bg-violet-50 text-violet-700 border-violet-200";
    case "COMPLETED":
      return "bg-green-50 text-green-700 border-green-200";
    case "CANCELLED":
      return "bg-slate-50 text-slate-500 border-slate-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function statusLabel(status: Status) {
  switch (status) {
    case "DRAFT":
      return "ร่าง";
    case "SUBMITTED":
      return "ส่งแล้ว";
    case "APPROVED":
      return "อนุมัติ";
    case "ASSIGNED":
      return "มอบหมายแล้ว";
    case "COMPLETED":
      return "เสร็จสิ้น";
    case "CANCELLED":
      return "ยกเลิก";
    default:
      return status;
  }
}

function fmtDateTime(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDate(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

type Props = {
  data: BorrowRequestDetail;
  loading?: boolean;
  onEdit?: () => void;
  onSubmit?: () => Promise<void> | void;
  onCancel?: () => Promise<void> | void;
  // TODO: Add onWithdraw/onDelete if needed
};

export function BorrowRequestDetailPanel({
  data,
  onEdit,
  onSubmit,
  onCancel,
  loading,
}: Props) {
  const canEdit = data.borrowRequestStatus === "DRAFT";
  const canSubmit = data.borrowRequestStatus === "DRAFT";
  const canCancel =
    data.borrowRequestStatus === "DRAFT" ||
    data.borrowRequestStatus === "SUBMITTED";

  // ✅ มหาลัยต้นทาง (เอาชื่อมาโชว์แทน id)
  const fromUniName =
    data.fromUniversityNameTh ??
    data.fromUniversity?.nameTh ??
    data.fromUniversityCode ??
    `University #${data.fromUniversityId}`;

  const fromUniCode =
    data.fromUniversityCode ?? data.fromUniversity?.code ?? null;

  // ✅ title ตอนนี้ใช้แทน "ประเภทปัญหา"
  const problemCategoryLabel = data.borrowRequestTitle?.trim() || "—";

  const needWindow = useMemo(() => {
    const a = fmtDate(data.borrowNeededFrom ?? null);
    const b = fmtDate(data.borrowNeededTo ?? null);
    if (!a && !b) return null;
    if (a && b) return `${a} - ${b}`;
    if (a && !b) return `เริ่ม ${a}`;
    if (!a && b) return `ถึง ${b}`;
    return null;
  }, [data.borrowNeededFrom, data.borrowNeededTo]);

  const createdAt = fmtDate(data.borrowRequestCreatedAt);

  return (
    <div className="space-y-6">
      {/* ===== Main Card ===== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header Section */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <Badge
                  variant="outline"
                  className={`px-2.5 py-0.5 rounded-full border ${tone(
                    data.borrowRequestStatus
                  )}`}
                >
                  {statusLabel(data.borrowRequestStatus)}
                </Badge>
                <div className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  สร้างเมื่อ {createdAt}
                </div>
              </div>

              <h1 className="text-2xl font-bold text-slate-900 mb-4">
                {problemCategoryLabel}
              </h1>

              <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                  <MapPin className="w-4 h-4 text-primary-600" />
                  <span className="font-medium text-slate-900">
                    {fromUniName}
                  </span>
                  {fromUniCode && (
                    <span className="text-slate-400">({fromUniCode})</span>
                  )}
                </div>

                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                  <Users className="w-4 h-4 text-primary-600" />
                  <span>ต้องการ</span>
                  <span className="font-semibold text-slate-900">
                    {data.borrowNeededCount}
                  </span>
                  <span>คน</span>
                </div>

                {needWindow && (
                  <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                    <Calendar className="w-4 h-4 text-primary-600" />
                    <span className="font-medium text-slate-900">
                      {needWindow}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 space-y-6">
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-slate-900">เหตุผล</h3>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {data.borrowRequestReason?.trim() || "-"}
                </p>
              </div>
            </div>
          </div>

          {data.borrowRequestDetail && (
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-slate-900">
                    รายละเอียดเพิ่มเติม
                  </h3>
                  <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {data.borrowRequestDetail}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Footer */}
        {(canEdit || canCancel || canSubmit) && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-wrap justify-end gap-3">
            {canEdit && onEdit && (
              <Button
                variant="outline"
                disabled={loading}
                onClick={onEdit}
                className="bg-white hover:bg-slate-50"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                แก้ไข
              </Button>
            )}

            {canCancel && onCancel && (
              <Button
                variant="ghost"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                disabled={loading}
                onClick={async () => {
                  const ok = confirm("ยืนยันยกเลิกคำขอ?");
                  if (!ok) return;
                  await onCancel();
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                ยกเลิกคำขอ
              </Button>
            )}

            {canSubmit && onSubmit && (
              <Button
                disabled={loading}
                onClick={async () => {
                  const ok = confirm("ยืนยันส่งคำขอ?");
                  if (!ok) return;
                  await onSubmit();
                }}
                className="bg-primary-600 hover:bg-primary-700 text-white shadow-sm shadow-primary-200"
              >
                <Send className="w-4 h-4 mr-2" />
                ส่งคำขอ
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Assignments Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
              <UserCheck className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg leading-none">
                รายชื่อที่ปรึกษาที่ได้รับมอบหมาย
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                รายการที่ปรึกษาที่ได้รับการยืนยันและมอบหมายงานแล้ว
              </p>
            </div>
            <div className="ml-auto">
              <Badge
                variant="secondary"
                className="rounded-lg px-2.5 py-1 text-sm font-medium bg-primary-100 text-primary-700 border border-primary-200"
              >
                {data.assignments?.length || 0} คน
              </Badge>
            </div>
          </div>
        </div>

        <div className="p-0">
          {data.assignments?.length ? (
            <div className="divide-y divide-slate-100">
              {data.assignments.map((a) => {
                const startDate = new Date(a.borrowAssignStartAt);
                const endDate = new Date(a.borrowAssignEndAt);

                return (
                  <div
                    key={a.borrowAssignmentId}
                    className="p-5 hover:bg-slate-50 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0">
                        {a.consultantName?.[0] || "C"}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-900 text-base">
                          {a.consultantName ?? `Consultant #${a.consultantId}`}
                        </h4>

                        {a.consultantUniversity && (
                          <div className="text-sm text-slate-500 font-medium mb-1">
                            {a.consultantUniversity.nameTh}
                            {a.consultantUniversity.code && (
                              <span className="ml-1 text-slate-400 font-normal">
                                ({a.consultantUniversity.code})
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mt-1">
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            <span className="text-xs font-medium text-slate-700">
                              {startDate.toLocaleDateString("th-TH", {
                                day: "numeric",
                                month: "short",
                                year: "2-digit",
                              })}
                              {" - "}
                              {endDate.toLocaleDateString("th-TH", {
                                day: "numeric",
                                month: "short",
                                year: "2-digit",
                              })}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Clock className="w-3.5 h-3.5" />
                            <span>
                              {startDate.toLocaleTimeString("th-TH", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}{" "}
                              -{" "}
                              {endDate.toLocaleTimeString("th-TH", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Note */}
                    {a.borrowAssignmentNote && (
                      <div className="mt-3 ml-16 bg-amber-50 border border-amber-200/60 rounded-xl p-3 flex items-start gap-3">
                        <FileText className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                        <div className="text-sm text-amber-900">
                          <span className="font-semibold block sm:inline sm:mr-1">
                            Note:
                          </span>
                          {a.borrowAssignmentNote}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <UserCheck className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium">
                ยังไม่มีการมอบหมายที่ปรึกษาในขณะนี้
              </p>
              <p className="text-xs text-slate-400 mt-1">
                รายชื่อที่ปรึกษาจะปรากฏที่นี่เมื่อคำขอได้รับการดำเนินการ
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
