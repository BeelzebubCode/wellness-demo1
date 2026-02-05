// src/features/consultant/my-jobs/components/JobItem.tsx

"use client";

import React from "react";
import { ChevronDown, Loader2, Send, Link as LinkIcon, Clock, User, Info, Edit } from "lucide-react";
import type { Job } from "../types";

function StatusBadge({ status }: { status: Job["status"] }) {
  if (status === "PENDING") {
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 text-xs font-bold border border-amber-200/60 shadow-sm">
        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
        รอดำเนินการ
      </span>
    );
  }
  if (status === "IN_PROGRESS") {
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-700 text-xs font-bold border border-indigo-200/60 shadow-sm">
        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
        กำลังคุย
      </span>
    );
  }
  if (status === "COMPLETED") {
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 text-xs font-bold border border-emerald-200/60 shadow-sm">
        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
        เสร็จสิ้น
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-rose-50 to-red-50 text-rose-700 text-xs font-bold border border-rose-200/60 shadow-sm">
      <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
      ยกเลิก
    </span>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  variant = "default",
}: {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
  variant?: "default" | "primary";
}) {
  const baseStyles = "inline-flex items-center justify-center rounded-xl font-bold transition-all duration-200 h-9 px-4 text-xs shadow-sm active:scale-95";
  const variantStyles = variant === "primary"
    ? "bg-gradient-to-r from-primary to-blue-600 text-white hover:shadow-lg hover:shadow-primary/30 disabled:opacity-50 disabled:pointer-events-none border-0"
    : "border border-slate-200 bg-white/80 text-slate-700 hover:border-primary hover:text-primary hover:bg-white hover:shadow-md disabled:opacity-50 disabled:pointer-events-none";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles}`}
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
  onEditChannel,
  isActing,
}: {
  job: Job;
  expanded: boolean;
  onToggle: () => void;
  onAction: () => void;
  onEditChannel?: (job: Job) => void;
  isActing: boolean;
}) {
  const isDisabled = job.status === "COMPLETED" || job.status === "CANCELLED";
  const isPending = job.status === "PENDING";
  const isInProgress = job.status === "IN_PROGRESS";

  const actionLabel = isPending ? "รับเคส" : isInProgress ? "ส่งงาน" : "ดูรายละเอียด";

  return (
    <div
      className={`group relative bg-white/90 backdrop-blur-sm rounded-2xl border shadow-sm transition-all duration-300 overflow-hidden cursor-pointer
        ${expanded ? "border-primary/40 ring-2 ring-primary/20 shadow-lg" : "border-slate-200/60 hover:border-primary/30 hover:shadow-md"}
      `}
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

      <div
        className="relative p-5"
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onToggle();
        }}
        tabIndex={0}
      >
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Time Badge */}
          <div className="flex md:flex-col items-center justify-center gap-2 md:gap-1 px-4 py-3 bg-gradient-to-br from-slate-50 to-blue-50/50 rounded-xl border border-slate-200/60 min-w-[100px] text-center shadow-sm">
            <Clock className="w-4 h-4 text-slate-400 md:mb-1" />
            <span className="text-sm font-bold text-slate-800 whitespace-nowrap">{job.timeRange}</span>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-lg font-bold border border-slate-200">
                {job.category}
              </span>
              {String(job.serviceMode ?? "").toUpperCase() === "ONLINE" && (
                <span className="inline-flex items-center gap-1 bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 text-xs px-2.5 py-1 rounded-lg font-bold border border-blue-200">
                  <LinkIcon className="w-3 h-3" />
                  ONLINE
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-slate-400" />
              <h4 className="font-bold text-slate-800 text-base truncate group-hover:text-primary transition-colors">
                {job.userName}
              </h4>
            </div>

            <p className="text-xs text-primary font-semibold flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
              <Info className="w-3.5 h-3.5" />
              {expanded ? "ซ่อนรายละเอียด" : "ดูรายละเอียด"}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`} />
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between md:flex-col md:items-end gap-3 mt-2 md:mt-0 md:pl-4 md:border-l md:border-slate-100">
            <StatusBadge status={job.status} />

            {!isDisabled ? (
              <ActionButton
                variant={isPending ? "primary" : "default"}
                disabled={isActing}
                onClick={(e) => {
                  e.stopPropagation();
                  onAction();
                }}
              >
                {isActing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                    กำลังอัปเดต
                  </>
                ) : isInProgress ? (
                  <>
                    <Send className="w-4 h-4 mr-1.5" />
                    {actionLabel}
                  </>
                ) : (
                  actionLabel
                )}
              </ActionButton>
            ) : null}
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden border-t border-slate-100 bg-gradient-to-b from-slate-50/60 to-blue-50/20">
          <div className="p-5 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-700 mb-1">รายละเอียดงาน</p>
                <p className="text-xs text-slate-500">
                  Booking ID: <span className="font-semibold text-slate-700">#{String(job.id).padStart(6, "0")}</span>
                </p>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoCard label="วันที่" value={job.raw?.date ?? "-"} />
              <InfoCard label="เวลา" value={job.timeRange} />
            </div>

            {/* Detail Box */}
            <div className="rounded-xl border border-slate-200/80 bg-white/90 p-4 shadow-sm">
              <p className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                รายละเอียดปัญหา
              </p>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {job.bookingDetailText?.trim() ? job.bookingDetailText : "ไม่มีรายละเอียดเพิ่มเติม"}
              </p>
            </div>

            {/* Online Channel Box */}
            {String(job.serviceMode ?? "").toUpperCase() === "ONLINE" && (
              <div className="rounded-xl border border-blue-200/80 bg-gradient-to-br from-blue-50/80 to-cyan-50/40 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-blue-700 flex items-center gap-2">
                    <LinkIcon className="w-4 h-4" />
                    ช่องทางออนไลน์
                  </p>
                  {/* ✅ แสดงปุ่มแก้ไขเมื่อรับเคสแล้ว (PENDING หรือ IN_PROGRESS) */}
                  {onEditChannel && (job.status === "PENDING" || job.status === "IN_PROGRESS") && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditChannel(job);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-blue-300 text-blue-700 hover:bg-blue-50 text-xs font-bold transition-colors active:scale-95"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      {job.onlineChannelUrl?.trim() ? "แก้ไข" : "ตั้งค่า"}
                    </button>
                  )}
                </div>
                {job.onlineChannelUrl?.trim() ? (
                  <>
                    <a
                      href={job.onlineChannelUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-block text-sm text-blue-600 hover:text-blue-700 font-semibold underline break-all mb-2"
                    >
                      {job.onlineChannelUrl}
                    </a>
                    {job.onlineChannelNote?.trim() && (
                      <p className="text-xs text-slate-600 whitespace-pre-wrap mt-2 pl-3 border-l-2 border-blue-300">
                        {job.onlineChannelNote}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-slate-500 italic">ยังไม่ได้ตั้งค่าช่องทางออนไลน์</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 bg-white/90 border border-slate-200/80 rounded-xl px-4 py-3 shadow-sm">
      <span className="text-xs font-bold text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-700 truncate">{value}</span>
    </div>
  );
}
