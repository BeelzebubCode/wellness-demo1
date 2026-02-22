// src/features/booking/components/BookingPage.tsx
"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { TimeSlotCore } from "@/shared/types/timeSlot";

import { useTimeSlots } from "../hooks/useTimeSlots";
import { useBooking } from "../hooks/useBooking";
import { useMyAppointments } from "../hooks/useMyAppointments";

import { BookingCalendar } from "./calendar/BookingCalendar";
import { TimePeriodTabs } from "./slots/TimePeriodTabs";
import { TimeSlotGrid } from "./slots/TimeSlotGrid";
import { BookingConfirmModal } from "./modals/BookingConfirmModal";
import { BookingSuccessModal } from "./modals/BookingSuccessModal";

import type { SlotPeriod } from "../utils/slotPeriod";
import { isSlotInPeriod } from "../utils/slotPeriod";

import { Card } from "@/components/ui";
import { cn } from "@/lib/cn";
import { addDays } from "@/lib/date";
import { CalendarClock, Info, RotateCcw } from "lucide-react";

// helper: Date -> "YYYY-MM-DD" (ใช้ local date ไม่ใช้ UTC)
function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfDay(d: Date) {
  const nd = new Date(d);
  nd.setHours(0, 0, 0, 0);
  return nd;
}

/**
 * ✅ scroll เฉพาะตอน "หลุดจอ" หรือ "อยู่ไกล"
 * - ถ้า element อยู่ใน viewport แล้ว: ไม่ scroll
 * - ถ้า top ใกล้ๆ (กันกระตุก): ไม่ scroll
 */
function shouldScrollToElement(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;

  const padding = 24;
  const inView = r.top >= padding && r.bottom <= vh - padding;
  if (inView) return false;

  if (r.top > -80 && r.top < 120) return false;

  return true;
}

/** ✅ มือถือเท่านั้น (tailwind md = 768px) */
function isMobileViewport() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(max-width: 767px)")?.matches ?? false;
}

/** อ่านค่า safe-area-inset-top (ถ้าไม่มีจะเป็น 0) จาก CSS var */
function getSafeAreaTopPx() {
  if (typeof window === "undefined") return 0;
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue("--sat")
    .trim();
  const n = Number.parseInt(v || "0", 10);
  return Number.isFinite(n) ? n : 0;
}

import { useRoleAuth } from "@/features/auth/hooks/useRoleAuth";

// ... existing imports ...

export function BookingPage({ universityId }: { universityId?: number }) {
  // ✅ CRITICAL: ALL HOOKS MUST BE AT THE TOP, BEFORE ANY CONDITIONAL RETURNS!

  // State hooks
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(() => new Date());
  const [period, setPeriod] = useState<SlotPeriod>("MORNING");
  const [selectedSlot, setSelectedSlot] = useState<TimeSlotCore | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Ref hooks
  const slotsSectionRef = useRef<HTMLDivElement>(null);
  const didMountRef = useRef(false);
  const prevDateStrRef = useRef<string | null>(null);
  const scrollCooldownRef = useRef<number>(0);

  // Memoized values
  const dateStr = useMemo(() => toISODate(selectedDate), [selectedDate]);

  // Custom hooks
  const { user, isLoading: authLoading } = useRoleAuth({
    allowedRoles: ["STUDENT", "PERSONNEL", "RECTOR", "ADMIN", "SUPER_ADMIN", "CONSULTANT", "HEAD_CONSULTANT"],
    loginToastKey: "booking_login_required",
    guard: true,
  });

  const { slots, loading, error, refetch } = useTimeSlots(dateStr, universityId);
  const { submitBooking, loading: bookingLoading, error: bookingError } = useBooking(universityId);
  const { activeBooking: existingActiveBooking, trustStatus, isLoading: appointmentsLoading, refetch: refetchAppointments } = useMyAppointments({
    universityId,
    statusGroup: "ACTIVE",
    limit: 5,
  });

  const isLocked = useMemo(() => {
    if (!trustStatus?.student_trust_locked_until) return false;
    return new Date(trustStatus.student_trust_locked_until) > new Date();
  }, [trustStatus]);

  // Computed values (memoized)
  const hasActiveBooking = useMemo(() => {
    if (existingActiveBooking) return true;
    const t = String(bookingError ?? "");
    return (
      t.includes("active booking") ||
      t.includes("คิวค้าง") ||
      t.includes("กำลังดำเนินการอยู่") ||
      t.includes("ไม่สามารถจองเพิ่มได้")
    );
  }, [existingActiveBooking, bookingError]);

  const filtered = useMemo(() => {
    return (slots ?? []).filter((s) =>
      isSlotInPeriod((s as any).startTime, period),
    );
  }, [slots, period]);

  // ✅ Effect hooks (must be after all other hooks but before conditional returns)
  // เปลี่ยนวัน/ช่วง -> เคลียร์ slot ที่เลือก
  useEffect(() => {
    setSelectedSlot(null);
  }, [selectedDate, period]);

  /**
   * ✅ มือถือเท่านั้น: เด้งไป slot พร้อม offset กันโดนขอบจอ/URL bar บัง
   * ✅ PC: ไม่เด้ง
   */
  useEffect(() => {
    // ข้ามครั้งแรก (ตอน mount)
    if (!didMountRef.current) {
      didMountRef.current = true;
      prevDateStrRef.current = dateStr;
      return;
    }

    // วันไม่เปลี่ยนจริง => ไม่ทำอะไร
    if (prevDateStrRef.current === dateStr) return;
    prevDateStrRef.current = dateStr;

    // ✅ PC ไม่ต้องเด้ง
    if (!isMobileViewport()) return;

    // รอ transition จบ + รอโหลด slots เสร็จ
    if (isPending) return;
    if (loading) return;

    const el = slotsSectionRef.current;
    if (!el) return;

    // cooldown กันสั่ง scroll รัว ๆ
    const now = Date.now();
    if (now - scrollCooldownRef.current < 250) return;
    scrollCooldownRef.current = now;

    // ถ้าอยู่ในจอ/ใกล้แล้ว => ไม่ scroll
    if (!shouldScrollToElement(el)) return;

    let raf1 = 0;
    let raf2 = 0;

    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const absoluteTop = rect.top + window.scrollY;

        // ✅ offset สำหรับมือถือ (safe-area + เผื่อหัว/ขอบจอ)
        const safeTop = getSafeAreaTopPx();
        const offset = safeTop + 16; // ปรับเป็น 24/32 ได้ตามต้องการ

        window.scrollTo({
          top: Math.max(0, absoluteTop - offset),
          behavior: "smooth",
        });
      });
    });

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [dateStr, isPending, loading]);

  // ✅ NOW it's safe to do conditional returns AFTER all hooks
  if (authLoading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400">Loading...</div>;
  }
  if (!user) return null; // Redirecting...


  const handleToday = () => {
    const today = new Date();
    startTransition(() => {
      setSelectedDate(today);
      setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    });
  };

  const handlePreviousMonth = () => {
    startTransition(() => {
      setCurrentMonth(
        (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
      );
    });
  };

  const handleNextMonth = () => {
    startTransition(() => {
      setCurrentMonth(
        (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
      );
    });
  };

  return (
    <div
      className="h-full flex flex-col bg-slate-50 overflow-hidden"
      style={{
        [("--sat") as any]: "env(safe-area-inset-top, 0px)",
      }}
    >
      {/* ─── Fixed info banner ─── */}
      <div className="shrink-0 px-3 pt-2">
        <Card className="rounded-xl bg-primary-50 border border-primary-100 p-2.5">
          <div className="flex gap-2">
            <Info className="w-4 h-4 text-primary-700 mt-0.5 shrink-0" />
            <ul className="text-xs text-primary-800 list-disc pl-3 space-y-0.5">
              <li>จองล่วงหน้าได้ไม่เกิน 7 วัน</li>
              <li>หากมีคิวที่ยังไม่เสร็จสิ้น จะไม่สามารถจองเพิ่มได้</li>
            </ul>
          </div>
        </Card>
      </div>

      {/* ─── Split panel: fills the remainder ─── */}
      <section className="flex-1 min-h-0 grid md:grid-cols-5 gap-3 px-3 py-3 items-stretch">
        {/* LEFT: Calendar — fixed, no scroll */}
        <div className="md:col-span-2 flex flex-col min-h-0">
          <Card className="rounded-xl bg-white shadow-sm overflow-hidden flex flex-col h-full">
            <div className="shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-primary-600" />
                <span className="text-sm font-semibold text-gray-900">ปฏิทินการจอง</span>
                {isPending || appointmentsLoading ? (
                  <span className="ml-1 text-[10px] text-gray-400 animate-pulse">กำลังตรวจสอบ...</span>
                ) : null}
              </div>
              <button
                type="button"
                onClick={handleToday}
                disabled={isPending}
                className={cn(
                  "text-xs px-2.5 py-1 border border-gray-200 rounded-full",
                  "flex items-center gap-1 text-gray-700 hover:bg-gray-50",
                  isPending && "opacity-60 cursor-not-allowed",
                )}
              >
                <RotateCcw className="w-3 h-3" />
                วันนี้
              </button>
            </div>
            <div className="p-3 flex-1 min-h-0 overflow-hidden">
              <BookingCalendar
                embedded
                selectedDate={selectedDate}
                onSelectDate={(d) => {
                  startTransition(() => {
                    setSelectedDate(d);
                    setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));
                  });
                }}
                currentMonth={currentMonth}
                onPreviousMonth={handlePreviousMonth}
                onNextMonth={handleNextMonth}
                minDate={startOfDay(new Date())}
                maxDate={startOfDay(addDays(new Date(), 7))}
              />
            </div>
          </Card>
        </div>

        {/* RIGHT: Slots — scrolls internally */}
        <div className="md:col-span-3 flex flex-col min-h-0" ref={slotsSectionRef}>
          <Card className="rounded-xl bg-white shadow-sm overflow-hidden flex flex-col h-full">
            {/* Period tabs — fixed */}
            <div className="shrink-0 px-4 py-2.5 border-b border-gray-100">
              <TimePeriodTabs value={period} onChange={setPeriod} />
            </div>
            {/* Slot content — scrollable */}
            <div className="flex-1 min-h-0 overflow-y-auto p-3 scrollbar-thin">
              {isLocked ? (
                <div className="mb-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 shadow-sm flex gap-2 items-start">
                  <Info className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">ท่านถูกระงับสิทธิ์การจองชั่วคราว</span>
                    <br />
                    จนถึงวันที่ {new Date(trustStatus.student_trust_locked_until).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })} เวลา {new Date(trustStatus.student_trust_locked_until).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} น. เนื่องจากผิดนัดหมายหรือยกเลิกกระชั้นชิด เกินจำนวนที่กำหนด
                  </div>
                </div>
              ) : hasActiveBooking ? (
                <div className="mb-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex items-center gap-2">
                  <Info className="w-4 h-4 text-amber-600 shrink-0" />
                  คุณมีการจองที่กำลังดำเนินการอยู่ (คิวค้าง) กรุณารอให้เสร็จสิ้นหรือยกเลิกก่อนจองใหม่
                </div>
              ) : null}
              <TimeSlotGrid
                embedded
                selectedDate={selectedDate}
                slots={filtered}
                isLoading={loading || isPending}
                hasActiveBooking={hasActiveBooking && !isLocked}
                isLocked={isLocked}
                onSelectSlot={(s) => {
                  if (hasActiveBooking || isLocked) return;
                  setSelectedSlot(s);
                  setConfirmOpen(true);
                }}
              />
              {error ? <div className="mt-2 text-xs text-red-600">{error}</div> : null}
            </div>
          </Card>
        </div>
      </section>

      <BookingConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        slot={selectedSlot}
        isLoading={bookingLoading}
        error={bookingError}
        onSubmit={async (payload) => {
          try {
            const res = await submitBooking(payload);
            if (res && res.success === true) {
              await refetch();
              await refetchAppointments();
              if (typeof window !== "undefined") {
                window.dispatchEvent(new Event("booking:changed"));
              }
              setConfirmOpen(false);
              setSuccessOpen(true);
            }
          } catch {
            await refetch();
            await refetchAppointments();
          }
        }}
      />

      <BookingSuccessModal
        isOpen={successOpen}
        onClose={() => setSuccessOpen(false)}
      />
    </div>
  );
}
