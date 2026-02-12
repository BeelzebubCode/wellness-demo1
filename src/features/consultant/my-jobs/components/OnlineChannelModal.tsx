// src/features/consultant/my-jobs/components/OnlineChannelModal.tsx

"use client";

import React from "react";
import { Loader2, Link as LinkIcon, Send, X } from "lucide-react";
import type { Job, OnlineChannelDraft } from "../types";

export function OnlineChannelModal({
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
  draft: OnlineChannelDraft;
  setDraft: React.Dispatch<React.SetStateAction<OnlineChannelDraft>>;
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
            {job ? `ตั้งค่าช่องทางออนไลน์: ${job.userName}` : "ตั้งค่าช่องทางออนไลน์"}
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
          <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-3">
            <p className="text-xs font-bold text-blue-800 flex items-center gap-2">
              <LinkIcon className="w-4 h-4" />
              เคสนี้เป็น ONLINE
            </p>
            {job?.preferredOnlineChannel && (
              <p className="text-xs font-bold text-indigo-700 mt-2 bg-indigo-50/50 rounded-lg p-2 border border-indigo-100 flex items-center gap-2">
                📌 ช่องทางที่นิสิตเลือก: {job.preferredOnlineChannel}
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">
              ลิงก์/ช่องทางออนไลน์ <span className="text-rose-600">*</span>
            </label>
            <input
              value={draft.url}
              onChange={(e) => setDraft((d) => ({ ...d, url: e.target.value }))}
              placeholder="เช่น https://meet.google.com/xxx-xxxx-xxx"
              className="mt-2 w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus-tenant"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">หมายเหตุ (ถ้ามี)</label>
            <textarea
              value={draft.note}
              onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
              rows={3}
              placeholder='เช่น "เข้าก่อนเวลา 5 นาที"'
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus-tenant"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-9 px-4 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              ข้ามก่อน
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
                  กำลังบันทึก
                </span>
              ) : (
                <span className="inline-flex items-center">
                  <Send className="w-4 h-4 mr-2" />
                  บันทึกช่องทาง
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
