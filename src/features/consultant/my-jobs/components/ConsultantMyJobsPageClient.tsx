// src/features/consultant/my-jobs/components/ConsultantMyJobsPageClient.tsx

"use client";

import React, { useState } from "react";
import { CalendarClock, Clock3, PlayCircle, CheckCircle2, ClipboardList, TrendingUp } from "lucide-react";

import { FilterBar } from "@/components/filters/FilterBar";
import { CONSULTANT_MY_JOBS_FILTER_DEFS, type ConsultantMyJobsFilters } from "../filters/defs";

import { useConsultantMyJobs } from "../hooks/useConsultantMyJobs";
import { StatWidget } from "./StatWidget";
import { JobItem } from "./JobItem";
import { ConfirmAcceptModal } from "./ConfirmAcceptModal";
import { OutcomeModal } from "./OutcomeModal";
import { OnlineChannelModal } from "./OnlineChannelModal";

function toISODateString(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function ConsultantMyJobsPageClient() {
  const [filters, setFilters] = useState<ConsultantMyJobsFilters>(() => ({
    date: toISODateString(new Date()),
    status: "ALL",
    search: "",
  }));

  const vm = useConsultantMyJobs(filters);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 font-sans text-slate-900 pb-20 relative overflow-hidden selection:bg-[rgba(var(--ring),0.25)] selection:text-slate-900">
      
      {/* Decorative background (คงของเดิม) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 -left-20 w-72 h-72 bg-gradient-to-tr from-blue-500/5 to-transparent rounded-full blur-3xl"></div>
      </div>

      <main className="relative max-w-[1280px] mx-auto px-4 md:px-8 py-10 space-y-8">

        {/* ================= HEADER ================= */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 bg-gradient-to-br from-white to-blue-50/80 rounded-2xl flex items-center justify-center shadow-lg border border-white/60 shrink-0">
              <div className="w-7 h-7 icon-tenant rounded-xl flex items-center justify-center">
                <ClipboardList className="w-5 h-5" />
              </div>
            </div>

            <div>
              <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                งานของฉัน
              </h1>
              <p className="text-sm font-medium text-slate-500 mt-1">
                ดูคิวที่รับผิดชอบ และจัดการสถานะการให้คำปรึกษา
              </p>
            </div>
          </div>

          <FilterBar
            defs={CONSULTANT_MY_JOBS_FILTER_DEFS}
            value={filters}
            onChange={(next) => {
              if (next.date !== filters.date) vm.setExpandedId(null);
              setFilters(next);
            }}
            dateKey="date"
            searchKey="search"
            searchPlaceholder="ค้นหาชื่อ / หมวด / รายละเอียด..."
          />
        </div>

        {/* ================= STATS ================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatWidget title="นัดหมายวันนี้" value={vm.stats.today} icon={CalendarClock} theme="gradient-blue" />
          <StatWidget title="รอดำเนินการ" value={vm.stats.pending} icon={Clock3} theme="gradient-amber" />
          <StatWidget title="กำลังดำเนินการ" value={vm.stats.inProgress} icon={PlayCircle} theme="gradient-purple" />
          <StatWidget title="ปิดเคสแล้ว" value={vm.stats.completed} icon={CheckCircle2} theme="gradient-green" />
        </div>

        {/* ================= JOB LIST ================= */}
        <div className="relative bg-white/80 backdrop-blur-xl border border-white/80 shadow-[0_10px_40px_rgba(0,0,0,0.06)] rounded-3xl overflow-hidden">

          {/* Header */}
          <div className="px-8 py-5 border-b border-slate-100/80 flex items-center justify-between bg-gradient-to-r from-white/90 to-blue-50/30 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-6 bg-gradient-to-b from-primary to-blue-500 rounded-full shadow-lg"></span>
              <div>
                <p className="text-sm font-bold text-slate-800 leading-none">
                  รายการนัดหมาย
                </p>
                <p className="text-xs text-slate-500 mt-1 leading-none">
                  {vm.jobs.length} รายการ
                </p>
              </div>
            </div>

            {vm.isLoading && (
              <div className="flex items-center gap-1">
                <div className="w-1 h-1 bg-slate-400 rounded-full animate-pulse"></div>
                <div className="w-1 h-1 bg-slate-400 rounded-full animate-pulse delay-150"></div>
                <div className="w-1 h-1 bg-slate-400 rounded-full animate-pulse delay-300"></div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6 bg-gradient-to-b from-slate-50/40 to-white/40 min-h-[420px]">
            {vm.isLoading ? (
              <div className="h-[360px] flex flex-col items-center justify-center text-slate-400 gap-4">
                <div className="w-12 h-12 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
                <p className="text-sm font-medium">กำลังโหลดข้อมูล...</p>
              </div>
            ) : vm.jobs.length === 0 ? (
              <div className="h-[360px] flex flex-col items-center justify-center text-slate-400 gap-4">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center shadow-inner">
                  <ClipboardList className="w-10 h-10 text-slate-300" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-600">
                    ยังไม่มีงานในวันนี้
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    ลองเปลี่ยนวันที่หรือตัวกรองอื่นๆ
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {vm.jobs.map((job, index) => (
                  <div
                    key={job.id}
                    className="animate-in fade-in slide-in-from-bottom-4"
                    style={{
                      animationDelay: `${index * 60}ms`,
                      animationDuration: "400ms",
                      animationFillMode: "both",
                    }}
                  >
                    <JobItem
                      job={job}
                      expanded={vm.expandedId === job.id}
                      onToggle={() =>
                        vm.setExpandedId((cur) =>
                          cur === job.id ? null : job.id
                        )
                      }
                      onAction={() => vm.handleAction(job)}
                      onEditChannel={(j) => vm.handleEditChannel(j)}
                      isActing={vm.actionLoadingId === job.id}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ================= MODALS ================= */}
      <ConfirmAcceptModal
        open={vm.confirmAccept.open}
        job={vm.confirmAccept.job}
        loading={!!vm.confirmAccept.job && vm.actionLoadingId === vm.confirmAccept.job.id}
        onClose={() => vm.setConfirmAccept({ open: false, job: null })}
        onConfirm={vm.confirmAcceptJob}
      />

      <OnlineChannelModal
        open={vm.onlineModal.open}
        job={vm.onlineModal.job}
        draft={vm.onlineDraft}
        setDraft={vm.setOnlineDraft}
        loading={!!vm.onlineModal.job && vm.actionLoadingId === vm.onlineModal.job.id}
        onClose={() => vm.setOnlineModal({ open: false, job: null })}
        onSubmit={vm.submitOnlineChannel}
      />

      <OutcomeModal
        open={vm.outcomeModal.open}
        job={vm.outcomeModal.job}
        draft={vm.outcomeDraft}
        setDraft={vm.setOutcomeDraft}
        loading={!!vm.outcomeModal.job && vm.actionLoadingId === vm.outcomeModal.job.id}
        onClose={() => vm.setOutcomeModal({ open: false, job: null })}
        onSubmit={vm.submitOutcomeAndComplete}
      />
    </div>
  );

}
