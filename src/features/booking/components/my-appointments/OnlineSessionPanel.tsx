// src/features/booking/components/my-appointments/OnlineSessionPanel.tsx
"use client";

import { cn } from "@/lib/cn";
import { Link2, Info } from "lucide-react";
import type { MyBookingDto } from "@/features/booking/types";
import { ONLINE_CHANNEL_META } from "@/lib/constants/booking-service";

export function OnlineSessionPanel({ booking }: { booking: MyBookingDto }) {
  // ✅ ปรับ field ตรงนี้ให้ตรงกับของจริงใน MyBookingDto ของคุณ
  const channel = (booking as any).onlineChannel ?? null;          // เช่น "GOOGLE_MEET"
  const meetingUrl = (booking as any).onlineMeetingUrl ?? null;    // ลิงก์ที่ consultant ส่งมา
  const meetingNote = (booking as any).onlineMeetingNote ?? null;  // note เพิ่มเติม (ถ้ามี)

  // ถ้าไม่ได้เป็นออนไลน์ ไม่ต้องโชว์
  if (booking.serviceMode !== "ONLINE") return null;

  // ✅ map ชื่อให้สวย (ถ้า key ตรงกับ ONLINE_CHANNEL_META)
  const meta = channel ? (ONLINE_CHANNEL_META as any)[channel] : null;
  const channelLabel = meta?.label ?? (channel ? String(channel) : null);

  const isEmpty = !channel && !meetingUrl && !meetingNote;

  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
        <Link2 className="w-4 h-4 text-primary-600" />
        ช่องทางสำหรับออนไลน์
      </div>

      {isEmpty ? (
        <div className="mt-2 rounded-xl bg-amber-50 border border-amber-100 p-3 flex gap-2">
          <Info className="w-4 h-4 text-amber-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              รอผู้ให้คำปรึกษาส่งช่องทางติดต่อ
            </p>
            <p className="text-xs text-amber-700 mt-1">
              เมื่อผู้ให้คำปรึกษาส่งลิงก์/รายละเอียด ระบบจะแสดงตรงนี้ทันที
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-2 space-y-2">
          <div className="text-sm text-gray-700">
            <span className="text-gray-500">ช่องทาง: </span>
            <span className="font-semibold">{channelLabel ?? "-"}</span>
          </div>

          {meetingUrl ? (
            <a
              href={meetingUrl}
              target="_blank"
              rel="noreferrer"
              className={cn(
                "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm",
                "hover:bg-gray-50 transition"
              )}
            >
              <Link2 className="w-4 h-4" />
              เปิดลิงก์เข้าร่วม
            </a>
          ) : (
            <div className="text-xs text-gray-500">
              (ยังไม่มีลิงก์เข้าร่วม)
            </div>
          )}

          {meetingNote ? (
            <div className="text-xs text-gray-500 whitespace-pre-line">
              {meetingNote}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
