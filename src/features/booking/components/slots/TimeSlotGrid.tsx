"use client";

import type { ReactNode } from "react";
import { formatThaiDate } from "@/lib/date";
import { TimeSlotCard } from "./TimeSlotCard";
import { LoadingSpinner } from "@/components/ui";
import type { TimeSlotCore } from "@/shared/types/timeSlot";
import { Sunrise, Sun, Moon, CalendarX2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/cn";

export interface TimeSlotGridProps {
  selectedDate: Date;
  slots: TimeSlotCore[];
  onSelectSlot: (slot: TimeSlotCore) => void;
  isLoading?: boolean;
  hasActiveBooking?: boolean;

  /** ✅ เพิ่ม: ใช้ตอน embed ลง card ภายนอก */
  embedded?: boolean;
}

// ✅ helper: ดึงชั่วโมงแบบปลอดภัย (กัน startTime undefined)
function getHourFromStartTime(slot: TimeSlotCore): number | null {
  const t = (slot as any)?.startTime;

  // "09:30"
  if (typeof t === "string" && t.includes(":")) {
    const h = parseInt(t.split(":")[0], 10);
    return Number.isFinite(h) ? h : null;
  }

  // เผื่อบางที startTime เป็น Date หรือ ISO string อื่น ๆ
  // เช่น time_slot_start_datetime หรือ startDatetime ถูก map มาใส่ startTime
  if (t instanceof Date) {
    const h = t.getHours();
    return Number.isFinite(h) ? h : null;
  }

  return null;
}

// ✅ helper: นับ slot ว่างแบบ safe (ถ้า isAvailable ไม่มี ก็ fallback เป็น false)
function isSlotAvailable(slot: TimeSlotCore): boolean {
  const v = (slot as any)?.isAvailable;
  if (typeof v === "boolean") return v;
  return false;
}

export function TimeSlotGrid({
  selectedDate,
  slots,
  onSelectSlot,
  isLoading = false,
  hasActiveBooking = false,
  embedded = false,
}: TimeSlotGridProps) {
  const groupedSlots = {
    morning: slots.filter((s) => {
      const h = getHourFromStartTime(s);
      return h !== null && h < 12;
    }),
    afternoon: slots.filter((s) => {
      const h = getHourFromStartTime(s);
      return h !== null && h >= 12 && h < 17;
    }),
    evening: slots.filter((s) => {
      const h = getHourFromStartTime(s);
      return h !== null && h >= 17;
    }),
  };

  if (isLoading) {
    return (
      <div
        className={cn(
          "bg-white rounded-2xl p-10 flex items-center justify-center",
          embedded && "rounded-none p-10",
        )}
      >
        <LoadingSpinner size="lg" label="กำลังโหลดช่วงเวลา..." />
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div
        className={cn(
          "bg-white rounded-2xl border border-gray-100 p-10 text-center",
          embedded && "rounded-none border-0 p-10",
        )}
      >
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4 mx-auto">
          <CalendarX2 className="w-6 h-6 text-slate-400" />
        </div>
        <h3 className="text-base font-semibold text-gray-800 mb-1">
          ไม่มีช่วงเวลาว่าง
        </h3>
        <p className="text-gray-500 text-sm">
          วันที่ {formatThaiDate(selectedDate)} ไม่มีช่วงเวลาเปิดจอง
          <br />
          กรุณาเลือกวันอื่น
        </p>
      </div>
    );
  }

  const totalAvailable = slots.filter((s) => isSlotAvailable(s)).length;

  const Body = (
    <>
      <div className="px-5 py-4 md:px-6 md:py-4 border-b border-gray-100 bg-gradient-to-r from-primary-50 to-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <h2 className="text-base md:text-lg font-semibold text-gray-900">
              {formatThaiDate(selectedDate, { includeDay: true })}
            </h2>
            <p className="text-xs md:text-sm text-gray-500 mt-0.5">
              ช่วงเวลาว่าง {totalAvailable} รอบ
            </p>
          </div>

          {hasActiveBooking && (
            <div className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-[11px] md:text-xs font-medium self-start md:self-auto">
              <AlertTriangle className="w-3 h-3" />
              <span>คุณมีคิวค้างอยู่</span>
            </div>
          )}
        </div>
      </div>

      <div className="px-5 py-5 md:px-6 md:py-6 space-y-6 md:space-y-7">
        {groupedSlots.morning.length > 0 && (
          <TimeSlotSection
            icon={<Sunrise className="w-4 h-4 text-amber-500" />}
            title="ช่วงเช้า"
            subtitle="08:00 - 12:00"
            slots={groupedSlots.morning}
            onSelectSlot={onSelectSlot}
            disabled={hasActiveBooking}
          />
        )}

        {groupedSlots.afternoon.length > 0 && (
          <TimeSlotSection
            icon={<Sun className="w-4 h-4 text-orange-500" />}
            title="ช่วงบ่าย"
            subtitle="12:00 - 17:00"
            slots={groupedSlots.afternoon}
            onSelectSlot={onSelectSlot}
            disabled={hasActiveBooking}
          />
        )}

        {groupedSlots.evening.length > 0 && (
          <TimeSlotSection
            icon={<Moon className="w-4 h-4 text-indigo-500" />}
            title="ช่วงเย็น"
            subtitle="17:00 - 20:00"
            slots={groupedSlots.evening}
            onSelectSlot={onSelectSlot}
            disabled={hasActiveBooking}
          />
        )}

        {/* ✅ ถ้า startTime ไม่มีจนจัดกลุ่มไม่ได้เลย ให้โชว์ข้อความช่วย debug */}
        {groupedSlots.morning.length === 0 &&
        groupedSlots.afternoon.length === 0 &&
        groupedSlots.evening.length === 0 ? (
          <div className="text-sm text-slate-500">
            ไม่สามารถจัดกลุ่มช่วงเวลาได้ (ข้อมูลเวลา startTime ไม่ถูกต้อง)
          </div>
        ) : null}
      </div>
    </>
  );

  if (embedded) return <div>{Body}</div>;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {Body}
    </div>
  );
}

interface TimeSlotSectionProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  slots: TimeSlotCore[];
  onSelectSlot: (slot: TimeSlotCore) => void;
  disabled?: boolean;
}

function TimeSlotSection({
  icon,
  title,
  subtitle,
  slots,
  onSelectSlot,
  disabled,
}: TimeSlotSectionProps) {
  return (
    <section>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3 gap-2">
        <div className="flex items-start gap-3">
          
          {/* 🔥 icon ผูกกับ text block */}
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center translate-y-[6px]">
              {icon}
            </div>
          </div>

          {/* text */}
          <div className="leading-none">
            <h3 className="text-sm md:text-base font-semibold text-gray-800 leading-none">
              {title}
            </h3>
            <p className="text-[11px] md:text-xs text-gray-400 leading-none -mt-2.5">
              {subtitle}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 grid-rows-2 gap-3 md:gap-2">
        {slots.map((slot) => (
          <TimeSlotCard
            key={slot.id}
            slot={slot}
            onSelect={() => onSelectSlot(slot)}
            disabled={disabled}
          />
        ))}
      </div>
    </section>
  );
}
