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
  Clock,
  MessageSquareText,
  ArrowRight,
} from "lucide-react";
import type { BorrowRequestDetail } from "@/features/borrow-requests/types";

type Status = BorrowRequestDetail["borrowRequestStatus"];

/* ── Status helpers ── */

const STATUS_CONFIG: Record<
  Status,
  { label: string; bg: string; text: string; dot: string }
> = {
  DRAFT: {
    label: "ร่าง",
    bg: "bg-slate-100",
    text: "text-slate-600",
    dot: "bg-slate-400",
  },
  SUBMITTED: {
    label: "รอดำเนินการ",
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  APPROVED: {
    label: "อนุมัติแล้ว",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  ASSIGNED: {
    label: "มอบหมายแล้ว",
    bg: "bg-violet-50",
    text: "text-violet-700",
    dot: "bg-violet-500",
  },
  COMPLETED: {
    label: "เสร็จสิ้น",
    bg: "bg-slate-100",
    text: "text-slate-600",
    dot: "bg-slate-400",
  },
  CANCELLED: {
    label: "ยกเลิก",
    bg: "bg-red-50",
    text: "text-red-600",
    dot: "bg-red-400",
  },
};

function fmtDate(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
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

/* ── Reusable section wrapper ── */

function Section({
  icon,
  iconBg,
  iconColor,
  title,
  trailing,
  children,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
        <div
          className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}
        >
          <span className={iconColor}>{icon}</span>
        </div>
        <h3 className="text-[15px] font-bold text-slate-800 flex-1">
          {title}
        </h3>
        {trailing}
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

/* ── Main component ── */

export function BorrowRequestDetailPanel({
  data,
}: {
  data: BorrowRequestDetail;
}) {
  const fromUniName =
    data.fromUniversityNameTh ??
    (data as any).fromUniversity?.nameTh ??
    data.fromUniversityCode ??
    `University #${data.fromUniversityId}`;

  const requester =
    data.requestedByName ??
    (data as any).requestedBy?.account_username ??
    `Account #${data.requestedByAccountId}`;

  const needFrom = fmtDate(data.borrowNeededFrom ?? null);
  const needTo = fmtDate(data.borrowNeededTo ?? null);
  const status = STATUS_CONFIG[data.borrowRequestStatus] ?? STATUS_CONFIG.DRAFT;

  return (
    <div className="space-y-4">
      {/* ═══════════════ HERO CARD ═══════════════ */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-5">
          {/* Row 1: University + Status */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-md shadow-primary-500/20 shrink-0">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-[22px] font-black text-slate-900 tracking-tight leading-snug truncate">
                  {fromUniName}
                </h1>
                <p className="text-xs text-slate-400 font-medium -mt-0.5">
                  มหาวิทยาลัยผู้ขอยืม
                </p>
              </div>
            </div>

            {/* Status pill */}
            <div
              className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold ${status.bg} ${status.text}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${status.dot}`}
              />
              {status.label}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-dashed border-slate-200 my-4" />

          {/* Row 2: Title */}
          <div>
            <p className="text-xs text-slate-400 font-semibold mb-0.5">
              หัวข้อคำขอ
            </p>
            <p className="text-lg font-bold text-slate-800 leading-snug">
              {data.borrowRequestTitle || "—"}
            </p>
          </div>

          {/* Row 3: Meta */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-3 text-[13px] text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              ผู้ขอ:{" "}
              <span className="font-semibold text-slate-700">{requester}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {fmtDateTime(data.borrowRequestCreatedAt)}
            </span>
          </div>
        </div>

        {/* Stats strip */}
        <div className="bg-slate-50/80 border-t border-slate-100 px-6 py-3.5 flex flex-wrap gap-6">
          {/* Count */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center">
              <Users className="w-[18px] h-[18px] text-primary-600" />
            </div>
            <div className="leading-tight">
              <span className="text-[11px] text-slate-400 font-semibold block">
                จำนวนที่ต้องการ
              </span>
              <span className="text-base font-black text-slate-800">
                {data.borrowNeededCount}{" "}
                <span className="text-xs font-bold text-slate-400">คน</span>
              </span>
            </div>
          </div>

          {/* Date range */}
          {(needFrom || needTo) && (
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                <Calendar className="w-[18px] h-[18px] text-blue-600" />
              </div>
              <div className="leading-tight">
                <span className="text-[11px] text-slate-400 font-semibold block">
                  ช่วงเวลา
                </span>
                <span className="text-sm font-bold text-slate-700">
                  {needFrom ?? "—"}
                  <ArrowRight className="inline w-3.5 h-3.5 mx-1 text-slate-300 -mt-0.5" />
                  {needTo ?? "—"}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════ REASON ═══════════════ */}
      <Section
        icon={<MessageSquareText className="w-4 h-4" />}
        iconBg="bg-amber-100"
        iconColor="text-amber-600"
        title="เหตุผล"
      >
        <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
          {data.borrowRequestReason || "—"}
        </p>
      </Section>

      {/* ═══════════════ DETAIL ═══════════════ */}
      {data.borrowRequestDetail && (
        <Section
          icon={<FileText className="w-4 h-4" />}
          iconBg="bg-indigo-100"
          iconColor="text-indigo-600"
          title="รายละเอียดเพิ่มเติม"
        >
          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
            {data.borrowRequestDetail}
          </p>
        </Section>
      )}

      {/* ═══════════════ ASSIGNMENTS ═══════════════ */}
      <Section
        icon={<UserCheck className="w-4 h-4" />}
        iconBg="bg-violet-100"
        iconColor="text-violet-600"
        title="รายชื่อที่ปรึกษาที่ได้รับมอบหมาย"
        trailing={
          <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
            {data.assignments?.length ?? 0} คน
          </span>
        }
      >
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
                  className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-primary-200 hover:bg-primary-50/30 transition-colors"
                >
                  {/* Number circle */}
                  <div className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm font-bold shrink-0 shadow-sm">
                    {idx + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Name + Uni */}
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-[15px] font-bold text-slate-800">
                        {consultantLabel}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-primary-600 font-semibold bg-primary-50 px-2 py-0.5 rounded-md">
                        <Building2 className="w-3 h-3" />
                        {uniLabel}
                      </span>
                    </div>

                    {/* Time */}
                    {(start || end) && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {start} → {end}
                        </span>
                      </div>
                    )}

                    {/* Note */}
                    {a.borrowAssignmentNote && (
                      <div className="mt-2 text-xs text-amber-800 bg-amber-50 border border-amber-200/60 rounded-lg px-3 py-2 whitespace-pre-wrap">
                        <span className="font-bold">หมายเหตุ:</span>{" "}
                        {a.borrowAssignmentNote}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 text-slate-400">
            <UserCheck className="w-10 h-10 mx-auto mb-2 opacity-20" />
            <p className="text-sm">ยังไม่มีการมอบหมายผู้ให้คำปรึกษา</p>
          </div>
        )}
      </Section>
    </div>
  );
}
