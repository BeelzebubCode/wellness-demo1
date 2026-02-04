// src/features/consultant/my-jobs/components/ConfirmAcceptModal.tsx

"use client";

import React from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";
import type { Job } from "../types";

export function ConfirmAcceptModal({
  open,
  job,
  loading,
  onClose,
  onConfirm,
}: {
  open: boolean;
  job: Job | null;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-xl border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <p className="text-sm font-extrabold text-slate-800 truncate">ยืนยันการรับเคส</p>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-500"
            disabled={loading}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-100">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800">ต้องการรับเคสนี้ใช่ไหม?</p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {job ? `รับเคสของ “${job.userName}” • เวลา ${job.timeRange}` : ""}
              </p>
              {String(job?.serviceMode ?? "").toUpperCase() === "ONLINE" ? (
                <p className="text-[11px] text-blue-700 mt-2 font-semibold">
                  * เคสนี้เป็น ONLINE หลังรับเคสจะให้กรอกลิงก์/ช่องทาง
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-5 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-9 px-4 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 border border-transparent"
            >
              ยกเลิก
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="h-9 px-4 rounded-lg text-xs font-bold btn-tenant shadow-md active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? (
                <span className="inline-flex items-center">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  กำลังดำเนินการ
                </span>
              ) : (
                "ยืนยันรับเคส"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
