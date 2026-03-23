"use client";
import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { useToast } from "@/contexts/ToastContext";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/cn";
import { Star, Briefcase, User2, CheckCircle2, Search, AlertCircle, Sparkles, ArrowLeftRight, UserCheck, XCircle } from "lucide-react";
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

function isOutsideBorrowWindow(booking: AdminBookingRow | null, assignee: AssigneeOption): boolean {
  if (!booking?.date || !assignee.borrowWindow) return false;
  const bDayStr = booking.date;
  const cStStr = new Date(assignee.borrowWindow.start).toISOString().split('T')[0];
  const cEndStr = new Date(assignee.borrowWindow.end).toISOString().split('T')[0];
  return bDayStr < cStStr || bDayStr > cEndStr;
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
  isOutsideBorrow,
}: {
  a: AssigneeOption;
  selected: boolean;
  onClick: () => void;
  isClash: boolean;
  isSpecMatch: boolean;
  isOutsideBorrow: boolean;
}) {
  const isDisabled = isClash || isOutsideBorrow;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        "relative w-full text-left rounded-xl border p-3 transition-all duration-200",
        "hover:shadow-md group",
        isDisabled ? "opacity-50 grayscale cursor-not-allowed bg-gray-50 border-gray-100" : "hover:border-primary-300",
        selected
          ? "border-primary-400 bg-primary-50/80 ring-2 ring-primary-400/30 shadow-md"
          : !isDisabled && "border-gray-200 bg-white hover:bg-gray-50/50",
      )}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold shrink-0 transition-colors",
            selected
              ? "bg-primary-500 text-white"
              : isDisabled
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
              {isOutsideBorrow && (
                <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-stone-200 text-[10px] font-bold text-stone-600">
                  <AlertCircle className="h-2.5 w-2.5" />
                  นอกสัญญายืมตัว
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
  const [tab, setTab] = useState<"inhouse" | "borrowed">("inhouse");
  const { warning } = useToast();
  const [countdownModal, setCountdownModal] = useState<{ seconds: number } | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingAssignRef = useRef<{ bookingId: number; cid: number; borrowAssignmentId?: number } | null>(null);

  const cancelCountdown = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = null;
    setCountdownModal(null);
    pendingAssignRef.current = null;
  }, []);

  useEffect(() => {
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, []);

  // ✅ Advanced Ranking Logic
  const sortedAssignees = useMemo(() => {
    if (!booking) return [];

    const q = search.trim().toLowerCase();
    let list = [...assignees];

    if (q) {
      list = list.filter((a) => a.name.toLowerCase().includes(q));
    }

    return list.sort((a, b) => {
      // 0. Borrow Constraint Detection (Hard Penalty)
      const outA = isOutsideBorrowWindow(booking, a);
      const outB = isOutsideBorrowWindow(booking, b);
      if (outA !== outB) return outA ? 1 : -1;

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

  const selectedAssignee = useMemo(() => {
    return assignees.find((a) => a.id === Number(consultantId));
  }, [assignees, consultantId]);

  const canSubmit =
    !!booking &&
    Number.isFinite(Number(consultantId)) &&
    Number(consultantId) > 0 &&
    !isSaving &&
    (!selectedAssignee || !isOutsideBorrowWindow(booking, selectedAssignee)) &&
    (!selectedAssignee || !hasClash(booking, selectedAssignee));

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
            {/* Category Tabs */}
            {(() => {
              const inHouse = sortedAssignees.filter(a => !a.borrowAssignmentId);
              const borrowed = sortedAssignees.filter(a => !!a.borrowAssignmentId);
              const hasBorrowed = borrowed.length > 0;

              return (
                <>
                  {hasBorrowed && (
                    <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5 mb-3">
                      <button
                        type="button"
                        onClick={() => setTab("inhouse")}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-bold transition-all",
                          tab === "inhouse"
                            ? "bg-white text-primary-700 shadow-sm"
                            : "text-gray-400 hover:text-gray-600"
                        )}
                      >
                        <User2 className="h-3.5 w-3.5" />
                        คนของเรา
                        <span className={cn(
                          "px-1.5 py-0.5 rounded-full text-[10px] font-black",
                          tab === "inhouse" ? "bg-primary-100 text-primary-700" : "bg-gray-200 text-gray-500"
                        )}>
                          {inHouse.length}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTab("borrowed")}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-bold transition-all",
                          tab === "borrowed"
                            ? "bg-white text-indigo-700 shadow-sm"
                            : "text-gray-400 hover:text-gray-600"
                        )}
                      >
                        <ArrowLeftRight className="h-3.5 w-3.5" /> คนที่ยืมมา
                        <span className={cn(
                          "px-1.5 py-0.5 rounded-full text-[10px] font-black",
                          tab === "borrowed" ? "bg-indigo-100 text-indigo-700" : "bg-gray-200 text-gray-500"
                        )}>
                          {borrowed.length}
                        </span>
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-600">
                      {tab === "inhouse" ? "รายชื่อที่แนะนำ" : "ที่ปรึกษาจากมหาวิทยาลัยอื่น"}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      {(tab === "inhouse" ? inHouse : borrowed).length} คน • เรียงตามความเหมาะสม
                    </span>
                  </div>

                  {isLoadingAssignees ? (
                    <div className="flex items-center gap-2 py-8 justify-center text-sm text-gray-500">
                      <Spinner /> กำลังโหลดรายชื่อ...
                    </div>
                  ) : (tab === "inhouse" ? inHouse : borrowed).length === 0 ? (
                    <div className="py-8 text-center text-sm text-gray-400">
                      {tab === "inhouse" ? "ไม่พบที่ปรึกษา" : "ไม่มีที่ปรึกษาที่ยืมมา"}
                    </div>
                  ) : (
                    <div className="max-h-[320px] overflow-y-auto space-y-2 pr-2 hide-scrollbar">
                      {(tab === "inhouse" ? inHouse : borrowed).map((a) => (
                        <ConsultantCard
                          key={a.id}
                          a={a}
                          selected={consultantId === a.id}
                          onClick={() => setConsultantId(a.id)}
                          isClash={hasClash(booking, a)}
                          isSpecMatch={getSpecMatchScore(booking, a) > 0}
                          isOutsideBorrow={isOutsideBorrowWindow(booking, a)}
                        />
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
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
              onClick={() => {
                if (!booking) return;
                const cid = Number(consultantId);
                if (!Number.isFinite(cid) || cid <= 0) return;

                if (booking.consultant?.id === cid || booking.consultantId === cid) {
                  warning("ที่ปรึกษาท่านนี้ดูแลเคสนี้อยู่แล้ว กรุณาเลือกท่านอื่น");
                  return;
                }

                const selected = assignees.find((a) => a.id === cid);
                pendingAssignRef.current = { bookingId: booking.id, cid, borrowAssignmentId: selected?.borrowAssignmentId };
                setCountdownModal({ seconds: 3 });
                if (countdownRef.current) clearInterval(countdownRef.current);
                let sec = 3;
                countdownRef.current = setInterval(() => {
                  sec -= 1;
                  if (sec <= 0) {
                    if (countdownRef.current) clearInterval(countdownRef.current);
                    countdownRef.current = null;
                    setCountdownModal(null);
                    const p = pendingAssignRef.current;
                    pendingAssignRef.current = null;
                    if (p) {
                      Promise.resolve(onConfirmAssign(p.bookingId, p.cid, p.borrowAssignmentId)).then(() => onOpenChange(false));
                    }
                  } else {
                    setCountdownModal({ seconds: sec });
                  }
                }, 1000);
              }}
            >
              มอบหมาย
            </Button>
          </ModalFooter>

          {/* Countdown confirmation modal */}
          {countdownModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md mx-4 overflow-hidden">
                <div className="px-6 py-5 bg-gradient-to-r from-primary-50 to-blue-50">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                      <UserCheck className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">มอบหมายที่ปรึกษา</h3>
                      <p className="text-xs text-gray-500 mt-0.5">ระบบจะมอบหมายเคสให้ที่ปรึกษาโดยอัตโนมัติ</p>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-8 flex flex-col items-center">
                  <div className="relative w-24 h-24 mb-4">
                    <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                      <circle cx="48" cy="48" r="42" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                      <circle
                        cx="48" cy="48" r="42" fill="none"
                        stroke="#6366f1"
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 42}`}
                        strokeDashoffset={`${2 * Math.PI * 42 * (1 - countdownModal.seconds / 3)}`}
                        className="transition-all duration-1000 ease-linear"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl font-black tabular-nums text-indigo-600">
                        {countdownModal.seconds}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 text-center">
                    ดำเนินการอัตโนมัติใน <b>{countdownModal.seconds} วินาที</b>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">กดยกเลิกเพื่อหยุดการดำเนินการ</p>
                </div>
                <div className="px-6 pb-6">
                  <button
                    onClick={cancelCountdown}
                    className="w-full py-3 rounded-xl text-sm font-bold border-2 border-gray-200 text-gray-700 bg-white
                               hover:bg-gray-50 hover:border-gray-300 transition-all duration-150 active:scale-[0.98]"
                  >
                    <XCircle className="w-4 h-4" /> ยกเลิก
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
