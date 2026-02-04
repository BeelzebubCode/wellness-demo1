// src/features/consultant/my-jobs/components/ConsultantMyJobsPageClient.tsx

"use client";

import React, { useState } from "react";
import { CalendarClock, Clock3, PlayCircle, CheckCircle2, ClipboardList } from "lucide-react";

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
    <div className="min-h-screen bg-tenant font-sans text-slate-900 pb-20 relative overflow-hidden selection:bg-[rgba(var(--ring),0.25)] selection:text-slate-900">
      <main className="max-w-[1280px] mx-auto px-4 md:px-6 py-8 space-y-6">
        <div className="flex flex-col gap-4 pb-4 border-b border-slate-200/60">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 shrink-0">
              <div className="w-6 h-6 icon-tenant rounded-lg flex items-center justify-center">
                <ClipboardList className="w-4 h-4" />
              </div>
            </div>
            <div className="flex flex-col space-y-[4px]">
              <p className="text-xl font-extrabold text-slate-800 tracking-tight leading-none">
                งานของฉัน
              </p>
              <p className="text-sm font-medium text-slate-500 leading-none">
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
            dateKey={"date"}
            searchKey={"search"}
            searchPlaceholder="ค้นหาชื่อ / หมวด / รายละเอียด..."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatWidget title="นัดหมายวันนี้" value={vm.stats.today} icon={CalendarClock} theme="tenant" />
          <StatWidget title="รอดำเนินการ" value={vm.stats.pending} icon={Clock3} theme="tenant" />
          <StatWidget title="กำลังดำเนินการ" value={vm.stats.inProgress} icon={PlayCircle} theme="tenant" />
          <StatWidget title="ปิดเคสแล้ว" value={vm.stats.completed} icon={CheckCircle2} theme="tenant" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          <div className="xl:col-span-2 flex flex-col gap-4">
            <div className="relative bg-white/80 backdrop-blur-xl border border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-white/60 backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <span className="w-1 h-4 bg-primary rounded-full"></span>
                  <p className="text-sm font-bold text-slate-800 leading-none">รายการนัดหมาย</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50/50">
                {vm.isLoading ? (
                  <div className="h-[320px] flex items-center justify-center text-slate-400">
                    กำลังโหลด...
                  </div>
                ) : vm.jobs.length === 0 ? (
                  <div className="h-[320px] flex items-center justify-center text-slate-400">
                    ยังไม่มีงาน
                  </div>
                ) : (
                  <div className="space-y-3">
                    {vm.jobs.map((job) => (
                      <JobItem
                        key={job.id}
                        job={job}
                        expanded={vm.expandedId === job.id}
                        onToggle={() => vm.setExpandedId((cur) => (cur === job.id ? null : job.id))}
                        onAction={() => vm.handleAction(job)}
                        isActing={vm.actionLoadingId === job.id}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

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
