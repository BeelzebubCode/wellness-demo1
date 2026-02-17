// src/features/booking/components/my-appointments/OnlineSessionPanel.tsx
"use client";

import { cn } from "@/lib/cn";
import { Link2, Info, Phone } from "lucide-react";
import type { MyBookingDto } from "@/features/booking/types";
import { ONLINE_CHANNEL_META } from "@/lib/constants/booking-service";

export function OnlineSessionPanel({ booking }: { booking: MyBookingDto }) {
  // ✅ อ่านข้อมูลจาก booking.session ตาม type definition
  const session = booking.session;
  const channel = booking.onlineChannel ?? session?.onlineChannel ?? null;
  const meetingUrl = session?.joinUrl ?? null;    // ลิงก์ที่ consultant ส่งมา
  const phoneNumber = session?.phoneNumber ?? null; // เบอร์โทรที่ consultant ส่งมา
  const meetingNote = session?.extraDetail ?? null;  // note เพิ่มเติม (ถ้ามี)

  // ถ้าไม่ได้เป็นออนไลน์ ไม่ต้องโชว์
  if (booking.serviceMode !== "ONLINE") return null;

  // ✅ map ชื่อให้สวย (ถ้า key ตรงกับ ONLINE_CHANNEL_META)
  const meta = channel ? (ONLINE_CHANNEL_META as any)[channel.code] : null;
  const channelLabel = meta?.label ?? (channel ? String(channel.nameTh) : null);

  const isEmpty = !channel && !meetingUrl && !phoneNumber && !meetingNote;

  const isPhone = channel?.code === "PHONE" || !!phoneNumber;

  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
        <Link2 className="w-4 h-4 text-primary-600" />
        ช่องทางติดต่อจากผู้ให้คำปรึกษา
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
        <div className="mt-2 space-y-3">
          <div className="text-sm text-gray-700">
            <span className="text-gray-500">ช่องทาง: </span>
            <span className="font-semibold">{channelLabel ?? (isPhone ? "โทรศัพท์" : "-")}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {meetingUrl && (
              <a
                href={meetingUrl}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/50 px-4 py-2 text-sm text-blue-700 font-bold shadow-sm",
                  "hover:bg-blue-100 transition active:scale-95"
                )}
              >
                <Link2 className="w-4 h-4" />
                เปิดลิงก์เข้าร่วม
              </a>
            )}

            {phoneNumber && (
              <a
                href={`tel:${phoneNumber}`}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50/50 px-4 py-2 text-sm text-indigo-700 font-bold shadow-sm",
                  "hover:bg-indigo-100 transition active:scale-95"
                )}
              >
                <Phone className="w-4 h-4" />
                โทรหาผู้ให้คำปรึกษา ({phoneNumber})
              </a>
            )}
          </div>

          {meetingNote && (
            <div className="text-xs text-gray-600 whitespace-pre-line pl-3 border-l-2 border-primary/20 bg-slate-50/50 py-2 rounded-r-lg">
              <span className="font-bold block mb-1 text-gray-500 uppercase tracking-widest text-[9px]">หมายเหตุ:</span>
              {meetingNote}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
