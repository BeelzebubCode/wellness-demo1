// src/services/aiAgent/bookingPlan/slots.ts
import prisma from "@/lib/prisma";
import { bkkRange, toMinBkk, bkkTodayISO } from "./time";
import { TimeSlotStatus, BookingStatus } from "@prisma/client";

const ACTIVE_BOOKING_STATUSES: BookingStatus[] = [
  BookingStatus.PENDING_ASSIGNMENT,
  BookingStatus.ASSIGNED,
  BookingStatus.IN_PROGRESS,
];

function nowMinBkk() {
  return toMinBkk(new Date().toISOString());
}

const clampDayMin = (m: number) => Math.max(0, Math.min(24 * 60 - 1, m));

export async function listAvailableSlots(params: {
  universityId: number;
  date: string;
  limit?: number;
  minStartMinBkk?: number;
}) {
  const { universityId, date, limit = 8, minStartMinBkk } = params;
  const { start, end } = bkkRange(date);

  const slots = await prisma.timeSlot.findMany({
    where: {
      university_id: universityId,
      time_slot_start_datetime: { gte: start, lt: end },
      NOT: [
        { time_slot_status: TimeSlotStatus.CLOSED },
        { time_slot_status: TimeSlotStatus.CANCELLED },
        { time_slot_status: TimeSlotStatus.FULL },
      ],
    },
    orderBy: { time_slot_start_datetime: "asc" },
    take: 60,
    select: {
      time_slot_id: true,
      time_slot_start_datetime: true,
      time_slot_end_datetime: true,
      time_slot_max_capacity: true,
    },
  });

  if (!slots.length) return [];

  const counts = await prisma.booking.groupBy({
    by: ["time_slot_id"],
    where: {
      university_id: universityId,
      time_slot_id: { in: slots.map((s) => s.time_slot_id) },
      booking_status: { in: ACTIVE_BOOKING_STATUSES },
    },
    _count: { _all: true },
  });

  const countMap = new Map<number, number>();
  for (const c of counts) {
    countMap.set(Number(c.time_slot_id), Number(c._count._all || 0));
  }

  const mapped = slots
    .map((s) => {
      const maxCap = Number(s.time_slot_max_capacity ?? 0);
      const booked = countMap.get(s.time_slot_id) || 0;

      return {
        timeSlotId: s.time_slot_id,
        start: s.time_slot_start_datetime.toISOString(),
        end: s.time_slot_end_datetime.toISOString(),
        remaining: Math.max(0, maxCap - booked),
        ok: maxCap > 0 && booked < maxCap,
      };
    })
    .filter((x) => x.ok);

  const isToday = String(date) === bkkTodayISO();
  const bufferMin = 15;

  const rawMin =
    typeof minStartMinBkk === "number"
      ? minStartMinBkk
      : isToday
        ? nowMinBkk() + bufferMin
        : null;

  const minMin = rawMin == null ? null : clampDayMin(rawMin);

  const filtered =
    minMin == null ? mapped : mapped.filter((s) => toMinBkk(s.start) >= minMin);

  return filtered.slice(0, limit);
}

export function pickBestSlot(slots: any[], timeRange: string) {
  if (!slots.length) return null;

  const tr = String(timeRange || "ANY").trim().toUpperCase();
  if (tr === "AUTO" || tr === "ANY") return slots[0];

  const m = tr.match(/^(\d{2}):(\d{2})-(\d{2}):(\d{2})$/);
  if (!m) return slots[0];

  const targetStartMin = Number(m[1]) * 60 + Number(m[2]);
  const targetEndMin = Number(m[3]) * 60 + Number(m[4]);

  let best = slots[0];
  let bestDist = Infinity;

  for (const s of slots) {
    const st = toMinBkk(s.start);
    const dist =
      st >= targetStartMin && st <= targetEndMin
        ? 0
        : Math.min(Math.abs(st - targetStartMin), Math.abs(st - targetEndMin));

    if (dist < bestDist) {
      bestDist = dist;
      best = s;
    }
  }
  return best;
}
