// src/features/consultant/my-jobs/components/JobItem.tsx

"use client";

import React from "react";
import { ChevronDown, Loader2, MoreHorizontal, Send, Link as LinkIcon } from "lucide-react";
import type { Job } from "../types";

function StatusBadge({ status }: { status: Job["status"] }) {
  if (status === "PENDING") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-100">
        รอดำเนินการ
      </span>
    );
  }
  if (status === "IN_PROGRESS") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-100">
        กำลังคุย
      </span>
    );
  }
  if (status === "COMPLETED") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100">
        เสร็จสิ้น
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-100">
      ยกเลิก
    </span>
  );
}

function TinyBtn({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center justify-center rounded-lg font-bold transition-all duration-200
                 h-7 px-3 text-[10px]
                 border border-slate-200 bg-white/60 text-slate-700
                 hover:border-primary hover:text-primary hover:bg-white
                 disabled:opacity-50 disabled:pointer-events-none active:scale-95"
    >
      {children}
    </button>
  );
}

export function JobItem({
  job,
  expanded,
  onToggle,
  onAction,
  isActing,
}: {
  job: Job;
  expanded: boolean;
  onToggle: () => void;
  onAction: () => void;
  isActing: boolean;
}) {
  const isDisabled = job.status === "COMPLETED" || job.status === "CANCELLED";

  const actionLabel =
    job.status === "PENDING" ? "รับเคส" : job.status === "IN_PROGRESS" ? "ส่งงาน" : "ดูรายละเอียด";

  return (
    <div
      className={`group relative bg-white rounded-xl border shadow-sm transition-all duration-300 overflow-hidden
        ${expanded ? "border-primary/30 ring-2 ring-[rgba(var(--ring),0.18)]" : "border-slate-100 hover:border-primary/30"}
      `}
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onToggle();
      }}
    >
      <div className="p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-shrink-0 flex md:flex-col items-center justify-center gap-2 md:gap-0 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100 min-w-[90px] text-center">
            <span className="text-slate-400 text-[9px] font-bold uppercase tracking-widest">เวลา</span>
            <span className="text-slate-800 font-bold text-xs whitespace-nowrap">{job.timeRange}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-slate-100 text-slate-600 text-[9px] px-1.5 py-0.5 rounded font-bold border border-slate-200 uppercase tracking-wide">
                {job.category}
              </span>
              {String(job.serviceMode ?? "").toUpperCase() === "ONLINE" && (
                <span className="bg-blue-50 text-blue-700 text-[9px] px-1.5 py-0.5 rounded font-bold border border-blue-100 uppercase tracking-wide">
                  ONLINE
                </span>
              )}
            </div>

            <h4 className="font-bold text-slate-800 text-sm truncate group-hover:text-primary transition-colors">
              {job.userName}
            </h4>

            <p className="text-xs text-primary font-semibold mt-0.5 flex items-center gap-1 opacity-90">
              {expanded ? "ซ่อนรายละเอียด" : "ดูรายละเอียด"}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`} />
            </p>
          </div>

          <div className="flex items-center justify-between md:flex-col md:items-end gap-2 mt-2 md:mt-0 pl-4 md:border-l md:border-slate-100">
            <div className="scale-95 origin-right">
              <StatusBadge status={job.status} />
            </div>

            {!isDisabled ? (
              <TinyBtn
                disabled={isActing}
                onClick={(e) => {
                  e.stopPropagation();
                  onAction();
                }}
              >
                {isActing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                    กำลังอัปเดต
                  </>
                ) : job.status === "IN_PROGRESS" ? (
                  <>
                    <Send className="w-3.5 h-3.5 mr-1" />
                    {actionLabel}
                  </>
                ) : (
                  actionLabel
                )}
              </TinyBtn>
            ) : (
              <button
                type="button"
                disabled
                onClick={(e) => e.stopPropagation()}
                className="h-7 w-7 rounded-full hover:bg-slate-100 text-slate-400 inline-flex items-center justify-center"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden border-t border-slate-100 bg-slate-50/60">
          <div className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-700">รายละเอียดงาน</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Booking ID: <span className="font-semibold">{job.id}</span>
                </p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-white text-slate-600 border-slate-200">
                {job.status}
              </span>
            </div>

            <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <InfoRow label="วันที่" value={job.raw?.date ?? "-"} />
              <InfoRow label="เวลา" value={job.timeRange} />
            </div>

            <div className="rounded-xl border border-slate-100 bg-white/70 p-3">
              <p className="text-[10px] font-bold text-slate-500">รายละเอียดปัญหา</p>
              <p className="mt-1 text-[12px] text-slate-700 leading-relaxed whitespace-pre-wrap">
                {job.bookingDetailText?.trim() ? job.bookingDetailText : "-"}
              </p>
            </div>

            {String(job.serviceMode ?? "").toUpperCase() === "ONLINE" && (
              <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-3">
                <p className="text-[10px] font-bold text-blue-700 flex items-center gap-2">
                  <LinkIcon className="w-3.5 h-3.5" />
                  ช่องทางออนไลน์
                </p>
                <p className="mt-1 text-[12px] text-slate-700 break-all">
                  {job.onlineChannelUrl?.trim() ? job.onlineChannelUrl : "ยังไม่ได้ตั้งค่า"}
                </p>
                {job.onlineChannelNote?.trim() ? (
                  <p className="mt-1 text-[11px] text-slate-600 whitespace-pre-wrap">{job.onlineChannelNote}</p>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 bg-white/70 border border-slate-100 rounded-lg px-3 py-2">
      <span className="text-[10px] font-bold text-slate-500">{label}</span>
      <span className="text-[11px] font-semibold text-slate-700 truncate">{value}</span>
    </div>
  );
}
