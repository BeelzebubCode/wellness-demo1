// src/components/head-consultant/borrow-requests/BorrowRequestDetailPanel.tsx

"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { BorrowRequestDetail } from "@/features/borrow-requests/types";
import {
  Users,
  Calendar,
  Clock,
  MapPin,
  FileText,
  Info,
  Edit2,
  Trash2,
  Send,
  UserCheck,
  CheckCircle2,
  Circle,
  XCircle,
  FilePenLine,
  type LucideIcon,
} from "lucide-react";

type Status = BorrowRequestDetail["borrowRequestStatus"];

/* ─────────── Status Helpers ─────────── */

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    bg: string;
    text: string;
    border: string;
    dot: string;
    gradient: string;
    icon: LucideIcon;
  }
> = {
  DRAFT: {
    label: "ร่าง",
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
    dot: "bg-slate-400",
    gradient: "from-slate-500 to-slate-600",
    icon: FilePenLine,
  },
  SUBMITTED: {
    label: "ส่งแล้ว",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-500",
    gradient: "from-blue-500 to-blue-600",
    icon: Send,
  },
  APPROVED: {
    label: "อนุมัติ",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    gradient: "from-emerald-500 to-emerald-600",
    icon: CheckCircle2,
  },
  ASSIGNED: {
    label: "มอบหมายแล้ว",
    bg: "bg-violet-50",
    text: "text-violet-700",
    border: "border-violet-200",
    dot: "bg-violet-500",
    gradient: "from-violet-500 to-violet-600",
    icon: UserCheck,
  },
  COMPLETED: {
    label: "เสร็จสิ้น",
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
    dot: "bg-green-500",
    gradient: "from-green-500 to-green-600",
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: "ยกเลิก",
    bg: "bg-red-50",
    text: "text-red-500",
    border: "border-red-200",
    dot: "bg-red-400",
    gradient: "from-red-400 to-red-500",
    icon: XCircle,
  },
};

function getStatusConfig(status: Status) {
  return (
    STATUS_CONFIG[status] ?? {
      label: status,
      bg: "bg-slate-100",
      text: "text-slate-700",
      border: "border-slate-200",
      dot: "bg-slate-400",
      gradient: "from-slate-500 to-slate-600",
      icon: FileText,
    }
  );
}

/* ─────────── Date Formatters ─────────── */

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

/* ─────────── Step Progress ─────────── */

const STEPS = [
  { key: "DRAFT", label: "สร้างคำขอ" },
  { key: "SUBMITTED", label: "ส่งคำขอ" },
  { key: "APPROVED", label: "อนุมัติ" },
  { key: "ASSIGNED", label: "มอบหมาย" },
  { key: "COMPLETED", label: "เสร็จสิ้น" },
] as const;

const STATUS_ORDER: Record<string, number> = {
  DRAFT: 0,
  SUBMITTED: 1,
  APPROVED: 2,
  ASSIGNED: 3,
  COMPLETED: 4,
  CANCELLED: -1,
};

function StepProgress({ status }: { status: Status }) {
  const currentIdx = STATUS_ORDER[status] ?? -1;
  const isCancelled = status === "CANCELLED";

  if (isCancelled) {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">
        <Trash2 className="w-4 h-4" />
        คำขอนี้ถูกยกเลิกแล้ว
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 overflow-x-auto py-1">
      {STEPS.map((step, i) => {
        const isDone = i < currentIdx;
        const isCurrent = i === currentIdx;
        const isFuture = i > currentIdx;

        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`
                  w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                  transition-all duration-300
                  ${isDone
                    ? "bg-primary-600 text-white shadow-sm shadow-primary-200"
                    : isCurrent
                      ? "bg-primary-100 text-primary-700 ring-2 ring-primary-400 ring-offset-1"
                      : "bg-slate-100 text-slate-400"
                  }
                `}
              >
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : isCurrent ? (
                  <Circle className="w-3 h-3 fill-current" />
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>
              <span
                className={`text-[10px] font-medium whitespace-nowrap ${isDone
                  ? "text-primary-600"
                  : isCurrent
                    ? "text-primary-700 font-semibold"
                    : "text-slate-400"
                  }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`w-6 sm:w-10 h-0.5 mx-1 mb-4 rounded-full transition-all duration-300 ${isDone ? "bg-primary-400" : "bg-slate-200"
                  }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─────────── Info Pill ─────────── */

function InfoPill({
  icon: Icon,
  children,
  color = "slate",
}: {
  icon: typeof MapPin;
  children: React.ReactNode;
  color?: "slate" | "primary" | "blue" | "amber";
}) {
  const colorMap = {
    slate: "bg-slate-50 border-slate-200 text-slate-700",
    primary: "bg-primary-50 border-primary-200 text-primary-700",
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    amber: "bg-amber-50 border-amber-200 text-amber-700",
  };

  const iconColorMap = {
    slate: "text-slate-500",
    primary: "text-primary-600",
    blue: "text-blue-600",
    amber: "text-amber-600",
  };

  return (
    <div
      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-medium ${colorMap[color]}`}
    >
      <Icon className={`w-4 h-4 shrink-0 ${iconColorMap[color]}`} />
      {children}
    </div>
  );
}

/* ─────────── Detail Card ─────────── */

function DetailCard({
  icon: Icon,
  title,
  children,
  variant = "default",
}: {
  icon: typeof FileText;
  title: string;
  children: React.ReactNode;
  variant?: "default" | "muted";
}) {
  return (
    <div
      className={`rounded-2xl p-5 border transition-colors ${variant === "muted"
        ? "bg-slate-50/70 border-slate-100"
        : "bg-white border-slate-200 shadow-sm"
        }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`p-2 rounded-lg shrink-0 ${variant === "muted"
            ? "bg-white border border-slate-200"
            : "bg-primary-50 border border-primary-100"
            }`}
        >
          <Icon
            className={`w-4 h-4 ${variant === "muted" ? "text-slate-500" : "text-primary-600"
              }`}
          />
        </div>
        <div className="flex-1 min-w-0 space-y-1.5">
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────── Main Component ─────────── */

type Props = {
  data: BorrowRequestDetail;
  loading?: boolean;
  onEdit?: () => void;
  onSubmit?: () => Promise<void> | void;
  onCancel?: () => Promise<void> | void;
};

export function BorrowRequestDetailPanel({
  data,
  onEdit,
  onSubmit,
  onCancel,
  loading,
}: Props) {
  const cfg = getStatusConfig(data.borrowRequestStatus);
  const { confirm: showConfirm } = useConfirmDialog();
  const canEdit = data.borrowRequestStatus === "DRAFT";
  const canSubmit = data.borrowRequestStatus === "DRAFT";
  const canCancel =
    data.borrowRequestStatus === "DRAFT" ||
    data.borrowRequestStatus === "SUBMITTED";

  const fromUniName =
    data.fromUniversityNameTh ??
    data.fromUniversity?.nameTh ??
    data.fromUniversityCode ??
    `University #${data.fromUniversityId}`;

  const fromUniCode =
    data.fromUniversityCode ?? data.fromUniversity?.code ?? null;

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
    <div className="space-y-5">
      {/* ===== Hero Header Card ===== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Gradient Top Bar */}
        <div
          className={`h-1.5 bg-gradient-to-r ${cfg.gradient}`}
        />

        {/* Header Content */}
        <div className="p-6 pb-5">
          {/* Status + Date Row */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${cfg.bg} ${cfg.text} ${cfg.border}`}
            >
              <span
                className={`w-2 h-2 rounded-full ${cfg.dot} animate-pulse`}
              />
              {cfg.label}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              สร้างเมื่อ {createdAt}
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-slate-900 mb-5 leading-tight">
            {problemCategoryLabel}
          </h1>

          {/* Info Pills */}
          <div className="flex flex-wrap gap-2.5 mb-5">
            <InfoPill icon={MapPin} color="primary">
              {fromUniName}
              {fromUniCode && (
                <span className="text-primary-400 ml-0.5">({fromUniCode})</span>
              )}
            </InfoPill>

            <InfoPill icon={Users} color="blue">
              ต้องการ{" "}
              <span className="font-bold">{data.borrowNeededCount}</span> คน
            </InfoPill>

            {needWindow && (
              <InfoPill icon={Calendar} color="amber">
                {needWindow}
              </InfoPill>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="px-6 pb-6 space-y-4">
          <DetailCard icon={FileText} title="เหตุผล">
            {data.borrowRequestReason?.trim() || "—"}
          </DetailCard>

          {data.borrowRequestDetail && (
            <DetailCard icon={Info} title="รายละเอียดเพิ่มเติม" variant="muted">
              {data.borrowRequestDetail}
            </DetailCard>
          )}
        </div>

        {/* Action Footer */}
        {(canEdit || canCancel || canSubmit) && (
          <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-50/50 border-t border-slate-100">
            <div className="flex flex-wrap justify-end gap-3">
              {canEdit && onEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={loading}
                  onClick={onEdit}
                  className="bg-white hover:bg-slate-50 rounded-xl border-slate-200 shadow-sm"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  แก้ไข
                </Button>
              )}

              {canCancel && onCancel && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl"
                  disabled={loading}
                  onClick={async () => {
                    const ok = await showConfirm({
                      title: "ยกเลิกคำขอ",
                      message: "คุณต้องการยกเลิกคำขอยืมตัวที่ปรึกษานี้ใช่ไหม? การดำเนินการนี้ไม่สามารถย้อนกลับได้",
                      variant: "danger",
                      confirmLabel: "ยกเลิกคำขอ",
                      cancelLabel: "ไม่ใช่",
                    });
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
                  size="sm"
                  disabled={loading}
                  onClick={async () => {
                    const ok = await showConfirm({
                      title: "ส่งคำขอ",
                      message: "ยืนยันส่งคำขอยืมตัวที่ปรึกษา? หลังส่งแล้วจะไม่สามารถแก้ไขข้อมูลได้",
                      variant: "confirm",
                      confirmLabel: "ส่งคำขอ",
                      cancelLabel: "ยกเลิก",
                    });
                    if (!ok) return;
                    await onSubmit();
                  }}
                  className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white shadow-md shadow-primary-200/50 rounded-xl px-6"
                >
                  <Send className="w-4 h-4 mr-2" />
                  ส่งคำขอ
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ===== Assignments Section ===== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Section Header */}
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-sm shadow-primary-200/50">
              <UserCheck className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-900 text-base">
                รายชื่อที่ปรึกษาที่ได้รับมอบหมาย
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                รายการที่ปรึกษาที่ได้รับการยืนยันและมอบหมายงานแล้ว
              </p>
            </div>
            <Badge
              variant="secondary"
              className={`rounded-full px-3 py-1 text-sm font-bold ${(data.assignments?.length ?? 0) > 0
                ? "bg-primary-100 text-primary-700 border border-primary-200"
                : "bg-slate-100 text-slate-500 border border-slate-200"
                }`}
            >
              {data.assignments?.length || 0} คน
            </Badge>
          </div>
        </div>

        {/* Assignments List */}
        <div>
          {data.assignments?.length ? (
            <div className="divide-y divide-slate-100">
              {data.assignments.map((a, index) => {
                const startDate = new Date(a.borrowAssignStartAt);
                const endDate = new Date(a.borrowAssignEndAt);
                const initial = a.consultantName?.[0]?.toUpperCase() || "C";

                // Generate different gradient colors for each consultant
                const gradients = [
                  "from-primary-500 to-primary-600",
                  "from-violet-500 to-violet-600",
                  "from-blue-500 to-blue-600",
                  "from-emerald-500 to-emerald-600",
                  "from-amber-500 to-orange-500",
                ];

                return (
                  <div
                    key={a.borrowAssignmentId}
                    className="p-5 hover:bg-slate-50/50 transition-all duration-200 group"
                  >
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div
                        className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradients[index % gradients.length]
                          } flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0 group-hover:shadow-md transition-shadow duration-200`}
                      >
                        {initial}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-900 text-base">
                          {a.consultantName ?? `Consultant #${a.consultantId}`}
                        </h4>

                        {a.consultantUniversity && (
                          <div className="text-sm text-slate-500 mt-0.5">
                            {a.consultantUniversity.nameTh}
                            {a.consultantUniversity.code && (
                              <span className="ml-1 text-slate-400">
                                ({a.consultantUniversity.code})
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-2 mt-2.5">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-100 text-xs font-medium text-blue-700">
                            <Calendar className="w-3.5 h-3.5" />
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
                          </div>

                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
                            <Clock className="w-3.5 h-3.5" />
                            {startDate.toLocaleTimeString("th-TH", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {" - "}
                            {endDate.toLocaleTimeString("th-TH", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Note */}
                    {a.borrowAssignmentNote && (
                      <div className="mt-3 ml-16 bg-amber-50 border border-amber-100 rounded-xl p-3.5 flex items-start gap-3">
                        <FileText className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                        <div className="text-sm text-amber-900">
                          <span className="font-semibold mr-1">Note:</span>
                          {a.borrowAssignmentNote}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-14 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-slate-50 to-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200">
                <UserCheck className="w-9 h-9 text-slate-300" />
              </div>
              <p className="text-slate-500 font-semibold text-base">
                ยังไม่มีการมอบหมายที่ปรึกษา
              </p>
              <p className="text-xs text-slate-400 mt-1.5 max-w-xs mx-auto">
                รายชื่อที่ปรึกษาจะปรากฏที่นี่เมื่อคำขอได้รับการดำเนินการ
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
