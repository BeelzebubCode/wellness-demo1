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

export function BookingPage({ universityId }: { universityId?: number }) {
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(() => new Date());

  const [period, setPeriod] = useState<SlotPeriod>("MORNING");
  const [selectedSlot, setSelectedSlot] = useState<TimeSlotCore | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  // ✅ transition
  const [isPending, startTransition] = useTransition();

  // ✅ IMPORTANT: ref ต้องชี้ DOM จริง (อย่าชี้ Card ถ้าไม่ forwardRef)
  const slotsSectionRef = useRef<HTMLDivElement>(null);

  // ✅ กัน scroll ตอน mount + กันยิงซ้ำ
  const didMountRef = useRef(false);
  const prevDateStrRef = useRef<string | null>(null);
  const scrollCooldownRef = useRef<number>(0);

  const dateStr = useMemo(() => toISODate(selectedDate), [selectedDate]);

  const { slots, loading, error, refetch } = useTimeSlots(dateStr, universityId);

  const { submitBooking, loading: bookingLoading, error: bookingError } =
    useBooking(universityId);

  // ✅ Load ONLY active appointments to check for active booking status (Performance Optimized)
  const { activeBooking: existingActiveBooking, isLoading: appointmentsLoading } = useMyAppointments({
    universityId,
    statusGroup: "ACTIVE",
    limit: 5, // We only need enough to see if ANY exist
  });

  const hasActiveBooking = useMemo(() => {
    // 1. Check loaded data
    if (existingActiveBooking) return true;

    // 2. Check error from recent submission (fallback)
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

  // ✅ เปลี่ยนวัน/ช่วง -> เคลียร์ slot ที่เลือก
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
      className="min-h-screen bg-slate-50"
      style={{
        // ✅ ให้ iOS Safari อ่าน safe-area ได้
        ["--sat" as any]: "env(safe-area-inset-top, 0px)",
      }}
    >
      <main className="mx-auto w-full max-w-5xl px-4 pt-4 pb-24 space-y-4">
        <Card className="rounded-2xl bg-primary-50 border border-primary-100 p-4">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-primary-700 mt-1" />
            <ul className="text-sm text-primary-800 list-disc pl-4 space-y-1">
              <li>จองล่วงหน้าได้ไม่เกิน 7 วัน</li>
              <li>หากมีคิวที่ยังไม่เสร็จสิ้น จะไม่สามารถจองเพิ่มได้</li>
            </ul>
          </div>
        </Card>

<section className="grid md:grid-cols-5 gap-4 items-stretch">
  {/* LEFT: Calendar */}
  <div className="md:col-span-2 h-full">
    <Card className="rounded-2xl bg-white shadow-sm overflow-hidden h-full flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-primary-600" />
          <span className="text-sm font-semibold text-gray-900">
            ปฏิทินการจอง
          </span>
          {isPending || appointmentsLoading ? (
            <span className="ml-2 text-[11px] text-gray-400 animate-pulse">
              กำลังตรวจสอบสถานะ...
            </span>
          ) : null}
        </div>

        <button
          type="button"
          onClick={handleToday}
          disabled={isPending}
          className={cn(
            "text-xs px-3 py-1 border border-gray-200 rounded-full",
            "flex items-center gap-1 text-gray-700 hover:bg-gray-50",
            isPending && "opacity-60 cursor-not-allowed",
          )}
        >
          <RotateCcw className="w-3 h-3" />
          วันนี้
        </button>
      </div>

      {/* content กินพื้นที่ที่เหลือ */}
      <div className="p-5 flex-1">
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

{/* RIGHT: Slots */}
<div className="md:col-span-3 h-full">
  <div ref={slotsSectionRef} className="scroll-mt-20 h-full">
    <Card className="rounded-2xl bg-white shadow-sm overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100">
        <TimePeriodTabs value={period} onChange={setPeriod} />
      </div>

      {/* Content */}
      <div className="p-5 pt-4 flex-1 flex flex-col">
        {hasActiveBooking ? (
          <div className="mb-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
            คุณมีการจองที่กำลังดำเนินการอยู่ (คิวค้าง)
            กรุณารอให้เสร็จสิ้นหรือยกเลิกก่อนจองใหม่
          </div>
        ) : null}

        {/* 👇 กินพื้นที่ที่เหลือให้เต็มเท่าฝั่งซ้าย */}
        <div className="flex-1">
          <TimeSlotGrid
            embedded
            selectedDate={selectedDate}
            slots={filtered}
            isLoading={loading || isPending}
            hasActiveBooking={hasActiveBooking}
            onSelectSlot={(s) => {
              if (hasActiveBooking) return;
              setSelectedSlot(s);
              setConfirmOpen(true);
            }}
          />
        </div>

        {error ? (
          <div className="mt-3 text-sm text-red-600">{error}</div>
        ) : null}
      </div>
    </Card>
  </div>
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
                setConfirmOpen(false);
                setSuccessOpen(true);
              }
            } catch {
              await refetch();
            }
          }}
        />

        <BookingSuccessModal
          isOpen={successOpen}
          onClose={() => setSuccessOpen(false)}
        />
      </main>
    </div>
  );
}
