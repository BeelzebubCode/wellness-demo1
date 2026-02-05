// src/components/super-admin/borrow-requests/BorrowRequestDetailPanel.tsx

"use client";

import { useMemo } from "react";
import {
  Building2,
  User,
  Users,
  Calendar,
  FileText,
  UserCheck,
  Clock
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { BorrowRequestDetail } from "@/features/borrow-requests/types";

type Status = BorrowRequestDetail["borrowRequestStatus"];

function tone(status: Status) {
  switch (status) {
    case "DRAFT":
      return "bg-slate-100 text-slate-700 border-slate-200";
    case "SUBMITTED":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "APPROVED":
      return "bg-green-100 text-green-800 border-green-200";
    case "ASSIGNED":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "COMPLETED":
      return "bg-gray-100 text-gray-800 border-gray-200";
    case "CANCELLED":
      return "bg-gray-100 text-gray-600 border-gray-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function statusLabel(status: Status) {
  switch (status) {
    case "DRAFT":
      return "ร่าง";
    case "SUBMITTED":
      return "รอดำเนินการ";
    case "APPROVED":
      return "อนุมัติแล้ว";
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
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("th-TH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function BorrowRequestDetailPanel({ data }: { data: BorrowRequestDetail }) {
  const fromUniName =
    data.fromUniversityNameTh ??
    (data as any).fromUniversity?.nameTh ??
    data.fromUniversityCode ??
    `University #${data.fromUniversityId}`;

  const requester =
    data.requestedByName ??
    (data as any).requestedBy?.account_username ??
    `Account #${data.requestedByAccountId}`;

  const needWindow = useMemo(() => {
    const a = fmtDateTime(data.borrowNeededFrom ?? null);
    const b = fmtDateTime(data.borrowNeededTo ?? null);
    if (!a && !b) return null;
    if (a && b) return `${a} → ${b}`;
    if (a && !b) return `เริ่ม ${a}`;
    if (!a && b) return `ถึง ${b}`;
    return null;
  }, [data.borrowNeededFrom, data.borrowNeededTo]);

  return (
    <div className="space-y-5">
      {/* ===== Hero Card with University Name ===== */}
      <Card className="overflow-hidden border-0 shadow-lg rounded-3xl">
        {/* Gradient Header */}
        <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-6 text-white rounded-t-3xl">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* University Badge */}
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-3">
                <Building2 className="w-4 h-4" />
                <span className="text-sm font-semibold">{fromUniName}</span>
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold mb-2">
                {data.borrowRequestTitle || "—"}
              </h2>

              {/* Requester */}
              <div className="flex items-center gap-2 text-white/90 text-sm">
                <User className="w-4 h-4" />
                <span>ผู้ขอ: {requester}</span>
              </div>
            </div>

            {/* Status Badge */}
            <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border-2 shadow-sm ${tone(data.borrowRequestStatus)}`}>
              {statusLabel(data.borrowRequestStatus)}
            </span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="p-6 bg-slate-50 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200">
            <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-primary-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">จำนวนผู้ให้คำปรึกษา</div>
              <div className="text-2xl font-bold text-slate-900">{data.borrowNeededCount} คน</div>
            </div>
          </div>

          {needWindow && (
            <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200">
              <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <div className="text-xs text-slate-500 font-medium">ช่วงเวลาที่ต้องการ</div>
                <div className="text-sm font-semibold text-slate-900 truncate">{needWindow}</div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* ===== Reason & Details ===== */}
      <Card className="p-6 space-y-5 border-slate-200 shadow-sm rounded-3xl">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-2xl bg-amber-100 flex items-center justify-center">
              <FileText className="w-4 h-4 text-amber-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">เหตุผล</h3>
          </div>
          <div className="text-sm text-slate-700 whitespace-pre-wrap pl-10 leading-relaxed">
            {data.borrowRequestReason || "-"}
          </div>
        </div>

        {data.borrowRequestDetail && (
          <div className="pt-5 border-t border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-2xl bg-indigo-100 flex items-center justify-center">
                <FileText className="w-4 h-4 text-indigo-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">รายละเอียดเพิ่มเติม</h3>
            </div>
            <div className="text-sm text-slate-700 whitespace-pre-wrap pl-10 leading-relaxed">
              {data.borrowRequestDetail}
            </div>
          </div>
        )}
      </Card>

      {/* ===== Assignments ===== */}
      <Card className="p-6 border-slate-200 shadow-sm rounded-3xl">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-2xl bg-purple-100 flex items-center justify-center">
            <UserCheck className="w-4 h-4 text-purple-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            การมอบหมายผู้ให้คำปรึกษา
          </h3>
          <span className="ml-auto text-sm font-semibold text-slate-500">
            ({data.assignments?.length ?? 0})
          </span>
        </div>

        {data.assignments?.length ? (
          <div className="space-y-3">
            {data.assignments.map((a, idx) => {
              const start = fmtDateTime(a.borrowAssignStartAt);
              const end = fmtDateTime(a.borrowAssignEndAt);

              const consultantLabel =
                a.consultantName ?? `Consultant #${a.consultantId}`;

              const uniLabel =
                a.consultantUniversity?.nameTh ||
                a.consultantUniversityCode ||
                `uni ${a.consultantUniversityId}`;

              return (
                <div
                  key={a.borrowAssignmentId}
                  className="group relative overflow-hidden rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 hover:border-primary-300 hover:shadow-md transition-all"
                >
                  {/* Number Badge */}
                  <div className="absolute -top-3 -left-3 w-12 h-12 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold text-lg shadow-lg">
                    {idx + 1}
                  </div>

                  <div className="pl-8">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-lg font-bold text-slate-900 mb-1">
                          {consultantLabel}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Building2 className="w-4 h-4 text-primary-600" />
                          <span className="font-medium">{uniLabel}</span>
                        </div>
                      </div>
                    </div>

                    {(start || end) && (
                      <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-100 rounded-2xl px-3 py-2">
                        <Clock className="w-4 h-4" />
                        <span>{start} → {end}</span>
                      </div>
                    )}

                    {a.borrowAssignmentNote && (
                      <div className="mt-3 text-sm text-slate-700 bg-amber-50 border border-amber-200 rounded-2xl p-3 whitespace-pre-wrap">
                        <span className="font-semibold text-amber-900">หมายเหตุ:</span> {a.borrowAssignmentNote}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400">
            <UserCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">ยังไม่มีการมอบหมายผู้ให้คำปรึกษา</p>
          </div>
        )}
      </Card>
    </div>
  );
}
