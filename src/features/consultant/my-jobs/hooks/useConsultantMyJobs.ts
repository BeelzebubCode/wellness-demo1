// src/features/consultant/my-jobs/hooks/useConsultantMyJobs.ts

"use client";

import { useEffect, useMemo, useState } from "react";
import type { ConsultantMyJobsFilters } from "../filters/defs";
import type {
  Job,
  BookingStatusUI,
  MyBookingApiRow,
  OutcomeDraft,
  OnlineChannelDraft,
} from "../types";
import {
  fetchMyBookings,
  startBooking,
  completeBooking,
  setOnlineChannel,
} from "../api/myJobs";
import { normalizeYMD, fromYMD } from "@/lib/date";

function mapStatus(dbStatus: string): BookingStatusUI {
  const s = String(dbStatus || "").toUpperCase();
  if (s === "ASSIGNED") return "PENDING";
  if (s === "IN_PROGRESS") return "IN_PROGRESS";
  if (s === "COMPLETED") return "COMPLETED";
  if (s === "CANCELLED") return "CANCELLED";
  return "PENDING";
}

// ✅ กัน API ส่ง field วันไม่เหมือนกัน
function getRowYmd(r: any) {
  // ลองหา field ที่เป็นวัน/เวลาให้ได้ก่อน
  const candidates = [
    r?.date, // "2026-02-05" หรือ "2569-02-05"
    r?.startAt, // "2026-02-05T..."
    r?.startDateTime, // "2026-02-05T..."
    r?.raw?.date,
    r?.raw?.startAt,
    r?.raw?.startDateTime,
  ]
    .filter(Boolean)
    .map((x) => String(x));

  // ถ้ามีซักตัว เอาอันแรก
  return candidates.length ? normalizeYMD(candidates[0]) : "";
}

export function useConsultantMyJobs(filters: ConsultantMyJobsFilters) {
  const selectedDateStr = filters.date; // อาจเป็น พ.ศ.
  const selectedDateStrNorm = useMemo(
    () => normalizeYMD(selectedDateStr),
    [selectedDateStr],
  );

  const statusFilter = filters.status;
  const search = filters.search ?? "";

  const selectedDate = useMemo(() => fromYMD(selectedDateStr), [selectedDateStr]);

  const [isLoading, setIsLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [stats, setStats] = useState({
    today: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
  });

  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = () => setRefreshKey((x) => x + 1);

  const [confirmAccept, setConfirmAccept] = useState<{ open: boolean; job: Job | null }>({
    open: false,
    job: null,
  });

  const [outcomeModal, setOutcomeModal] = useState<{ open: boolean; job: Job | null }>({
    open: false,
    job: null,
  });

  const [outcomeDraft, setOutcomeDraft] = useState<OutcomeDraft>({
    consultantNote: "",
    nextStep: "",
    riskLevel: 2,
  });

  const [onlineModal, setOnlineModal] = useState<{ open: boolean; job: Job | null }>({
    open: false,
    job: null,
  });

  const [onlineDraft, setOnlineDraft] = useState<OnlineChannelDraft>({
    url: "",
    note: "",
  });

  useEffect(() => {
    let alive = true;

    async function run() {
      setIsLoading(true);
      try {
        const rows = await fetchMyBookings();

        // ✅ FIX: normalize วันทั้งสองฝั่ง + รองรับ date field ไม่ตรงกัน
        const dayRows = rows.filter((r) => getRowYmd(r) === selectedDateStrNorm);

        const byStatus =
          statusFilter === "ALL"
            ? dayRows
            : dayRows.filter((r) => mapStatus(r.status) === statusFilter);

        const q = search.trim().toLowerCase();
        const filteredRows = !q
          ? byStatus
          : byStatus.filter((r) => {
            const hay = [r.studentName, r.problemType, r.bookingDetailText, r.status]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();
            return hay.includes(q);
          });

        const mapped: Job[] = filteredRows.map((r: MyBookingApiRow) => {
          const detailFull = (r.bookingDetailText ?? "").trim();
          const preview = detailFull.length > 70 ? detailFull.slice(0, 70) + "..." : detailFull;

          return {
            id: r.id,
            timeRange: `${r.startTime ?? "--:--"} - ${r.endTime ?? "--:--"}`,
            status: mapStatus(r.status),
            userName: r.studentName ?? "ไม่ระบุชื่อ",
            category: r.problemType ?? "-",
            detail: preview || "-",
            bookingDetailText: r.bookingDetailText ?? null,

            serviceMode: r.serviceMode ?? null,
            onlineChannelUrl: r.onlineChannelUrl ?? null,
            onlineChannelNote: r.onlineChannelNote ?? null,

            universityName: r.universityName ?? null,
            universityCode: r.universityCode ?? null,

            raw: {
              date: r.date,
              startTime: r.startTime,
              endTime: r.endTime,
              createdAt: r.createdAt,
              updatedAt: r.updatedAt,
            },
          };
        });

        const statuses = dayRows.map((r) => mapStatus(r.status));
        const nextStats = {
          today: statuses.length,
          pending: statuses.filter((s) => s === "PENDING").length,
          inProgress: statuses.filter((s) => s === "IN_PROGRESS").length,
          completed: statuses.filter((s) => s === "COMPLETED").length,
        };

        if (!alive) return;
        setJobs(mapped);
        setStats(nextStats);
      } catch {
        if (!alive) return;
        setJobs([]);
        setStats({ today: 0, pending: 0, inProgress: 0, completed: 0 });
      } finally {
        if (alive) setIsLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [selectedDateStrNorm, statusFilter, search, refreshKey]);

  const handleAction = (job: Job) => {
    if (actionLoadingId) return;

    if (job.status === "PENDING") {
      setConfirmAccept({ open: true, job });
      return;
    }
    if (job.status === "IN_PROGRESS") {
      setOutcomeDraft({ consultantNote: "", nextStep: "", riskLevel: 2 });
      setOutcomeModal({ open: true, job });
      return;
    }
    alert("เคสนี้ปิดแล้ว/ยกเลิกแล้ว");
  };

  // ✅ เพิ่ม: สำหรับแก้ไขช่องทางออนไลน์
  const handleEditChannel = (job: Job) => {
    if (actionLoadingId) return;
    if (String(job.serviceMode ?? "").toUpperCase() !== "ONLINE") return;

    // เปิด modal พร้อมข้อมูลเดิม (ถ้ามี)
    setOnlineDraft({
      url: job.onlineChannelUrl ?? "",
      note: job.onlineChannelNote ?? "",
    });
    setOnlineModal({ open: true, job });
  };

  const confirmAcceptJob = async () => {
    const job = confirmAccept.job;
    if (!job) return;

    setActionLoadingId(job.id);
    try {
      const started = await startBooking(job.id);

      setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, status: "IN_PROGRESS" } : j)));
      setStats((s) => ({
        ...s,
        pending: Math.max(0, s.pending - 1),
        inProgress: s.inProgress + 1,
      }));

      setConfirmAccept({ open: false, job: null });

      const shouldAskChannel =
        (job.serviceMode ?? "").toString().toUpperCase() === "ONLINE" ||
        started.requireOnlineChannel === true;

      if (shouldAskChannel) {
        setOnlineDraft({ url: job.onlineChannelUrl ?? "", note: job.onlineChannelNote ?? "" });
        setOnlineModal({ open: true, job: { ...job, status: "IN_PROGRESS" } });
      }
    } catch (e: any) {
      alert(e?.message ?? "เริ่มงานไม่สำเร็จ");
    } finally {
      setActionLoadingId(null);
    }
  };

  const submitOnlineChannel = async () => {
    const job = onlineModal.job;
    if (!job) return;

    const url = String(onlineDraft.url ?? "").trim();
    if (!url) {
      alert("กรุณากรอกช่องทาง/ลิงก์สำหรับออนไลน์");
      return;
    }

    setActionLoadingId(job.id);
    try {
      await setOnlineChannel(job.id, { url, note: onlineDraft.note?.trim() || "" });

      // ✅ Refresh ข้อมูลจาก API เพื่อดึง session ข้อมูลที่บันทึกลง BookingSession
      triggerRefresh();

      setOnlineModal({ open: false, job: null });
    } catch (e: any) {
      alert(e?.message ?? "ส่งช่องทางออนไลน์ไม่สำเร็จ");
    } finally {
      setActionLoadingId(null);
    }
  };

  const submitOutcomeAndComplete = async () => {
    const job = outcomeModal.job;
    if (!job) return;

    if (!outcomeDraft.consultantNote.trim()) {
      alert("กรุณากรอกสรุป/รายละเอียดการให้คำปรึกษา");
      return;
    }

    setActionLoadingId(job.id);
    try {
      await completeBooking(job.id, {
        consultantNote: outcomeDraft.consultantNote,
        nextStep: outcomeDraft.nextStep?.trim() ? outcomeDraft.nextStep.trim() : null,
        riskLevel: outcomeDraft.riskLevel,
      });

      setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, status: "COMPLETED" } : j)));
      setStats((s) => ({
        ...s,
        inProgress: Math.max(0, s.inProgress - 1),
        completed: s.completed + 1,
      }));

      setOutcomeModal({ open: false, job: null });
      setExpandedId(job.id);
      triggerRefresh();
    } catch (e: any) {
      alert(e?.message ?? "ส่งงานไม่สำเร็จ");
    } finally {
      setActionLoadingId(null);
    }
  };

  return {
    selectedDate,
    jobs,
    expandedId,
    setExpandedId,

    isLoading,
    actionLoadingId,

    stats,

    confirmAccept,
    setConfirmAccept,
    confirmAcceptJob,

    outcomeModal,
    setOutcomeModal,
    outcomeDraft,
    setOutcomeDraft,
    submitOutcomeAndComplete,

    onlineModal,
    setOnlineModal,
    onlineDraft,
    setOnlineDraft,
    submitOnlineChannel,

    handleAction,
    handleEditChannel,
    triggerRefresh,
  };
}
