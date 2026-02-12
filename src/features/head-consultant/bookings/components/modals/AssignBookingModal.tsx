// src/features/head-consultant/bookings/components/modals/AssignBookingModal.tsx
"use client";

import { useMemo, useState } from "react";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/cn";
import { Star, Briefcase, User2, CheckCircle2, Search, AlertCircle, Sparkles } from "lucide-react";
import type { AdminBookingRow, AssigneeOption } from "../../types";

/* ─── Utils ─────────────────────────────────── */

function hasClash(booking: AdminBookingRow, assignee: AssigneeOption): boolean {
  if (!booking.date || !booking.startTime || !booking.endTime || !assignee.busySlots?.length) return false;

  // Use a reference date (or just dummy date if we only care about time comparison within the same day)
  // Actually, booking.date is "YYYY-MM-DD", so we can build full ISO
  const bStart = new Date(`${booking.date}T${booking.startTime}:00Z`).getTime();
  const bEnd = new Date(`${booking.date}T${booking.endTime}:00Z`).getTime();

  return assignee.busySlots.some((s) => {
    const sStart = new Date(s.start).getTime();
    const sEnd = new Date(s.end).getTime();
    // Overlap condition: (StartA < EndB) && (EndA > StartB)
    return bStart < sEnd && bEnd > sStart;
  });
}

function getSpecMatchScore(booking: AdminBookingRow, assignee: AssigneeOption): number {
  if (!assignee.specializations?.length) return 0;

  const bText = (
    (booking.problemType ?? "") +
    " " +
    (booking.problemCategoryCode ?? "")
  ).toLowerCase();

  // Normalize and tokenize booking text
  const bTokens = bText.split(/[\/\s,]+/).map(t => t.trim()).filter(t => t.length > 1);

  let matches = 0;
  for (const spec of assignee.specializations) {
    const sLow = spec.toLowerCase();

    // Direct match or partial match
    if (bText.includes(sLow) || sLow.includes(bText)) {
      matches += 2; // High weight for direct match
      continue;
    }

    // Token match
    const sTokens = sLow.split(/[\/\s,]+/).map(t => t.trim()).filter(t => t.length > 1);
    for (const bt of bTokens) {
      if (sTokens.some(st => st.includes(bt) || bt.includes(st))) {
        matches += 1;
        break;
      }
    }
  }

  if (matches > 0) {
    console.log(`[SpecMatch] ${assignee.name} matches ${booking.problemType}: score ${matches}`);
  }

  return matches;
}

/* ─── Workload Bar ─────────────────────────── */

function WorkloadBar({ count, max = 15 }: { count: number; max?: number }) {
  const pct = Math.min((count / max) * 100, 100);
  const color =
    pct >= 70
      ? "from-red-400 to-rose-500"
      : pct >= 40
        ? "from-amber-400 to-orange-400"
        : "from-emerald-400 to-teal-500";

  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full bg-gradient-to-r transition-all duration-500",
            color,
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[11px] font-bold text-gray-500 tabular-nums w-7 text-right">
        {count}
      </span>
    </div>
  );
}

/* ─── Rating Stars ─────────────────────────── */

function RatingStars({ rating }: { rating: number | null | undefined }) {
  if (rating == null) return <span className="text-[11px] text-gray-400">ยังไม่มีคะแนน</span>;

  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn(
            "h-3 w-3",
            s <= Math.round(rating)
              ? "text-amber-400 fill-amber-400"
              : "text-gray-200 fill-gray-200",
          )}
        />
      ))}
      <span className="ml-1 text-[11px] font-bold text-gray-600 tabular-nums">
        {rating.toFixed(1)}
      </span>
    </span>
  );
}

/* ─── Consultant Card ──────────────────────── */

function ConsultantCard({
  a,
  selected,
  onClick,
  isClash,
  isSpecMatch,
}: {
  a: AssigneeOption;
  selected: boolean;
  onClick: () => void;
  isClash: boolean;
  isSpecMatch: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isClash}
      className={cn(
        "relative w-full text-left rounded-xl border p-3 transition-all duration-200",
        "hover:shadow-md group",
        isClash ? "opacity-50 grayscale cursor-not-allowed bg-gray-50 border-gray-100" : "hover:border-primary-300",
        selected
          ? "border-primary-400 bg-primary-50/80 ring-2 ring-primary-400/30 shadow-md"
          : !isClash && "border-gray-200 bg-white hover:bg-gray-50/50",
      )}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold shrink-0 transition-colors",
            selected
              ? "bg-primary-500 text-white"
              : isClash
                ? "bg-gray-300 text-white"
                : "bg-gradient-to-br from-violet-400 to-indigo-500 text-white",
          )}
        >
          {a.name.charAt(0)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <p className="text-sm font-bold text-gray-800 truncate">{a.name}</p>
              {selected && (
                <CheckCircle2 className="h-4 w-4 text-primary-500 shrink-0" />
              )}
            </div>
            {/* Status Tags */}
            <div className="flex items-center gap-1 shrink-0">
              {isSpecMatch && (
                <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-100 text-[10px] font-bold text-amber-600 animate-pulse">
                  <Sparkles className="h-2.5 w-2.5" />
                  เชี่ยวชาญตรงจุด
                </div>
              )}
              {isClash && (
                <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-red-100 text-[10px] font-bold text-red-600">
                  <AlertCircle className="h-2.5 w-2.5" />
                  เวลาชนกัน
                </div>
              )}
            </div>
          </div>

          {/* Rating */}
          <div className="mt-1">
            <RatingStars rating={a.avgRating} />
            {(a.feedbackCount ?? 0) > 0 && (
              <span className="ml-1.5 text-[10px] text-gray-400">
                ({a.feedbackCount} reviews)
              </span>
            )}
          </div>

          {/* Workload */}
          <div className="mt-2">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Briefcase className="h-3 w-3 text-gray-400" />
              <span className="text-[11px] text-gray-500 font-medium">
                เคสที่ดูแล
              </span>
            </div>
            <WorkloadBar count={a.activeBookings ?? 0} />
          </div>

          {/* Specializations list (tiny) */}
          {a.specializations && a.specializations.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {a.specializations.slice(0, 3).map((s, idx) => (
                <span key={idx} className="px-1.5 py-0.5 rounded-md bg-gray-100 text-[9px] text-gray-500 border border-gray-200">
                  {s}
                </span>
              ))}
              {a.specializations.length > 3 && (
                <span className="text-[9px] text-gray-400">+{a.specializations.length - 3}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

/* ─── Main Modal ───────────────────────────── */

export function AssignBookingModal({
  open,
  onOpenChange,
  booking,
  assignees,
  isLoadingAssignees,
  isSaving,
  onConfirmAssign,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  booking: AdminBookingRow | null;

  assignees: AssigneeOption[];
  isLoadingAssignees?: boolean;

  isSaving?: boolean;
  onConfirmAssign: (
    bookingId: number,
    consultantId: number,
    borrowAssignmentId?: number,
  ) => Promise<void> | void;
}) {
  const [consultantId, setConsultantId] = useState<number | "">("");
  const [search, setSearch] = useState("");

  // ✅ Advanced Ranking Logic
  const sortedAssignees = useMemo(() => {
    if (!booking) return [];

    const q = search.trim().toLowerCase();
    let list = [...assignees];

    if (q) {
      list = list.filter((a) => a.name.toLowerCase().includes(q));
    }

    return list.sort((a, b) => {
      // 1. Clash Detection (Hard Penalty)
      const clashA = hasClash(booking, a);
      const clashB = hasClash(booking, b);
      if (clashA !== clashB) return clashA ? 1 : -1;

      // 2. Specialization Match (First Priority after possibilities)
      const specA = getSpecMatchScore(booking, a);
      const specB = getSpecMatchScore(booking, b);
      if (specA !== specB) return specB - specA;

      // 3. Workload (Active Bookings)
      const wa = a.activeBookings ?? 0;
      const wb = b.activeBookings ?? 0;
      if (wa !== wb) return wa - wb;

      // 4. Rating (Tie breaker)
      const ra = a.avgRating ?? 0;
      const rb = b.avgRating ?? 0;
      return rb - ra;
    });
  }, [assignees, search, booking]);

  const canSubmit =
    !!booking &&
    Number.isFinite(Number(consultantId)) &&
    Number(consultantId) > 0 &&
    !isSaving;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="มอบหมายที่ปรึกษา"
      size="lg"
    >
      {!booking ? (
        <div className="text-sm text-gray-500">ยังไม่ได้เลือกรายการ</div>
      ) : (
        <div className="space-y-4">
          {/* Booking info */}
          <div className="rounded-xl border border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50/30 p-3">
            <div className="flex items-center gap-2">
              <User2 className="h-4 w-4 text-primary-500" />
              <span className="text-sm font-bold text-gray-800">
                {booking.student?.name ?? booking.student?.username ?? "นิสิต"}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
              <span>
                Booking #{booking.id}
              </span>
              <span className="text-gray-300">•</span>
              <span className="font-medium text-primary-600">{booking.problemType ?? "-"}</span>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาที่ปรึกษา..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400/30 focus:border-primary-400 transition"
            />
          </div>

          {/* Consultant list */}
          <div className="space-y-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-600">
                รายชื่อที่แนะนำ
              </span>
              <span className="text-[11px] text-gray-400">
                {sortedAssignees.length} คน • เรียงตามความเหมาะสม
              </span>
            </div>

            {isLoadingAssignees ? (
              <div className="flex items-center gap-2 py-8 justify-center text-sm text-gray-500">
                <Spinner /> กำลังโหลดรายชื่อ...
              </div>
            ) : sortedAssignees.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">
                ไม่พบที่ปรึกษา
              </div>
            ) : (
              <div className="max-h-[320px] overflow-y-auto space-y-2 pr-1 -mr-1 scrollbar-thin">
                {sortedAssignees.map((a) => (
                  <ConsultantCard
                    key={a.id}
                    a={a}
                    selected={consultantId === a.id}
                    onClick={() => setConsultantId(a.id)}
                    isClash={hasClash(booking, a)}
                    isSpecMatch={getSpecMatchScore(booking, a) > 0}
                  />
                ))}
              </div>
            )}
          </div>

          <ModalFooter>
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              ยกเลิก
            </Button>

            <Button
              disabled={!canSubmit}
              leftIcon={isSaving ? <Spinner /> : undefined}
              onClick={async () => {
                if (!booking) return;
                const cid = Number(consultantId);
                if (!Number.isFinite(cid) || cid <= 0) return;

                const selected = assignees.find((a) => a.id === cid);
                await onConfirmAssign(booking.id, cid, selected?.borrowAssignmentId);
                onOpenChange(false);
              }}
            >
              มอบหมาย
            </Button>
          </ModalFooter>
        </div>
      )}
    </Modal>
  );
}
