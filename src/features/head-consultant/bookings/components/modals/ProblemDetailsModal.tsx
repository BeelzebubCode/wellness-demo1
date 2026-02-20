// src/features/head-consultant/bookings/components/modals/ProblemDetailsModal.tsx
"use client";

import { Modal } from "@/components/ui/Modal";
import type { AdminBookingRow } from "../../types";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { cn } from "@/lib/cn";

export function ProblemDetailsModal({
  open,
  onOpenChange,
  booking,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: AdminBookingRow | null;
}) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} title="รายละเอียดปัญหา" size="lg">
      {!booking ? (
        <div className="text-sm text-gray-500">ยังไม่ได้เลือกรายการ</div>
      ) : (
        <div className="space-y-3 text-sm">
          <div className="rounded-2xl border bg-gray-50 p-4">
            <div className="font-medium text-gray-800">
              {booking.problemType ?? "ไม่ระบุประเภท"}
            </div>
            <div className="mt-1 text-gray-600">
              code: <span className="font-mono">{booking.problemCategoryCode ?? "-"}</span>
            </div>
          </div>

          <div className="rounded-2xl border p-4">
            <div className="text-xs font-medium text-gray-500">คำอธิบาย</div>
            <div className="mt-2 whitespace-pre-wrap text-gray-800">
              {booking.problemDescription?.trim() ? booking.problemDescription : "—"}
            </div>
          </div>

          {booking.assignments && booking.assignments.length > 0 && (
            <div className="rounded-2xl border p-4">
              <div className="text-xs font-medium text-gray-500 mb-3">ประวัติการแจกงาน (Assignment History)</div>
              <div className="space-y-3">
                {booking.assignments.map((assign, idx) => (
                  <div key={idx} className={cn("flex flex-col gap-1 rounded-xl p-3 text-xs border relative", assign.isActive ? "border-primary-200 bg-primary-50/50" : "border-gray-100 bg-gray-50/50 opacity-70")}>
                    {assign.isActive && (
                      <span title="ผู้รับผิดชอบปัจจุบัน" className="absolute top-3 right-3 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                      </span>
                    )}
                    <div className="flex items-center flex-wrap gap-2 font-semibold bg-white px-3 py-2 rounded-lg border shadow-sm">
                      {assign.isAutoAssigned ? (
                        <span className="flex items-center gap-1 rounded bg-purple-50 px-2 py-1 text-[11px] text-purple-700 border border-purple-100">
                          🤖 แจกงานอัตโนมัติ
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 rounded bg-blue-50 px-2 py-1 text-[11px] text-blue-700 border border-blue-100">
                          🧑‍💻 โอนย้ายโดย {assign.assignedBy?.name || "ไม่ทราบ"}
                        </span>
                      )}
                      <span className="text-gray-300 text-xs">➔</span>
                      <span className="text-gray-700 text-xs">
                        ให้กับ: <span className="text-primary-600 font-bold ml-1">{assign.consultant?.name || "ไม่ทราบชื่อผู้ให้คำปรึกษา"}</span>
                      </span>
                    </div>
                    <div className="text-gray-500">
                      เมื่อ {format(new Date(assign.assignedAt), "d MMM yyyy HH:mm", { locale: th })} น.
                    </div>
                    {assign.note && (
                      <div className="mt-1 rounded bg-white p-2 text-gray-700 italic border border-gray-100 shadow-sm leading-relaxed">
                        &quot;{assign.note}&quot;
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
