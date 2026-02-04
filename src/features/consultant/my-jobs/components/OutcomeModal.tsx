"use client";

import React from "react";
import { Loader2, Send, X } from "lucide-react";
import type { Job, OutcomeDraft } from "../types";

export function OutcomeModal({
  open,
  job,
  draft,
  setDraft,
  loading,
  onClose,
  onSubmit,
}: {
  open: boolean;
  job: Job | null;
  draft: OutcomeDraft;
  setDraft: React.Dispatch<React.SetStateAction<OutcomeDraft>>;
  loading: boolean;
  onClose: () => void;
  onSubmit: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-xl border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <p className="text-sm font-extrabold text-slate-800 truncate">
            {job ? `ส่งงาน: ${job.userName}` : "ส่งงาน"}
          </p>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-500"
            disabled={loading}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
            <p className="text-xs font-bold text-slate-700 truncate">{job?.category ?? "-"}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              เวลา {job?.timeRange ?? "-"} • Booking ID {job?.id ?? "-"}
            </p>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">
              สรุป/รายละเอียดการให้คำปรึกษา <span className="text-rose-600">*</span>
            </label>
            <textarea
              value={draft.consultantNote}
              onChange={(e) => setDraft((d) => ({ ...d, consultantNote: e.target.value }))}
              rows={5}
              placeholder="พิมพ์สรุปประเด็น, แนวทางที่ให้คำแนะนำ, ข้อสังเกต ฯลฯ"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus-tenant"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">ขั้นตอนถัดไป (Next step)</label>
            <input
              value={draft.nextStep}
              onChange={(e) => setDraft((d) => ({ ...d, nextStep: e.target.value }))}
              placeholder='เช่น "นัดติดตามผล 2 สัปดาห์"'
              className="mt-2 w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus-tenant"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">ระดับความเสี่ยง (Risk level)</label>
            <select
              value={draft.riskLevel ?? ""}
              onChange={(e) =>
                setDraft((d) => ({ ...d, riskLevel: e.target.value ? Number(e.target.value) : null }))
              }
              className="mt-2 w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus-tenant"
            >
              <option value="1">1 - ต่ำ</option>
              <option value="2">2 - ค่อนข้างต่ำ</option>
              <option value="3">3 - กลาง</option>
              <option value="4">4 - สูง</option>
              <option value="5">5 - สูงมาก</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1">* ปรับช่วงคะแนนได้ตาม policy ของศูนย์</p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-9 px-4 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              ยกเลิก
            </button>

            <button
              type="button"
              onClick={onSubmit}
              disabled={loading}
              className="h-9 px-4 rounded-lg text-xs font-bold btn-tenant shadow-md active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? (
                <span className="inline-flex items-center">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  กำลังส่งงาน
                </span>
              ) : (
                <span className="inline-flex items-center">
                  <Send className="w-4 h-4 mr-2" />
                  ส่งงาน
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
