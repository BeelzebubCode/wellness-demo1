"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Building2,
  MapPin,
  Calendar,
  Clock,
  X,
  UserCheck,
  ChevronRight,
  Users,
  AlertCircle,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

// ==============================
// Types
// ==============================
type AssignItem = {
  consultantId: number;
  consultantUniversityId: number;
  startAt: string; // ISO
  endAt: string; // ISO
  note?: string;
};

type CandidateShift = {
  shiftId: number;
  startAt: string;
  endAt: string;
  status: string;
  currentBorrowCount: number;
};

type CandidateConsultant = {
  consultantId: number;
  fullName: string;
  nickname?: string | null;
  specializations: string[];
  alreadyAssigned?: boolean;
  shifts: CandidateShift[];
};

type CandidateUniversityGroup = {
  universityId: number;
  universityNameTh: string;
  universityNameEn?: string | null;
  distanceKm: number | null;
  consultants: CandidateConsultant[];
};

type CandidatesResponse = {
  fromUniversityId: number;
  groups: CandidateUniversityGroup[];
};

type ApiOk<T> = { ok: boolean; data?: T; error?: string };

// ==============================
// Helpers
// ==============================
function fmtDist(km: number | null) {
  if (km == null || Number.isNaN(km)) return null;
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

function fmtShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
  });
}

// ==============================
// Component
// ==============================
export function AssignBorrowRequestModal({
  open,
  onOpenChange,
  neededCount,
  borrowRequestId,
  fromUniversityId,
  defaultStartAt,
  defaultEndAt,
  onConfirm,
  loading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  neededCount: number;
  borrowRequestId: number;
  fromUniversityId: number;
  defaultStartAt: string;
  defaultEndAt: string;
  onConfirm: (items: AssignItem[]) => Promise<void> | void;
  loading?: boolean;
}) {
  const [items, setItems] = useState<AssignItem[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [candidatesError, setCandidatesError] = useState<string | null>(null);
  const [groups, setGroups] = useState<CandidateUniversityGroup[]>([]);
  const [activeUniversityId, setActiveUniversityId] = useState<number | null>(
    null,
  );
  const [uniSearch, setUniSearch] = useState("");

  // Reset & fetch on open
  useEffect(() => {
    if (!open) return;
    setItems([]);
    setUniSearch("");
    setCandidatesError(null);

    const run = async () => {
      setCandidatesLoading(true);
      try {
        const res = await fetch(
          `/api/v2/platform/borrow-requests/${borrowRequestId}/candidates?fromUniversityId=${fromUniversityId}`,
        );
        if (!res.ok) {
          const t = await res.text().catch(() => "");
          throw new Error(t || `Failed (${res.status})`);
        }
        const json = (await res.json()) as ApiOk<CandidatesResponse>;
        const sorted = [...(json.data?.groups || [])].sort((a, b) => {
          if (a.distanceKm == null && b.distanceKm == null) return 0;
          if (a.distanceKm == null) return 1;
          if (b.distanceKm == null) return -1;
          return a.distanceKm - b.distanceKm;
        });
        setGroups(sorted);
        setActiveUniversityId(sorted[0]?.universityId ?? null);
      } catch (e: any) {
        setCandidatesError(e?.message || "Load failed");
        setGroups([]);
        setActiveUniversityId(null);
      } finally {
        setCandidatesLoading(false);
      }
    };
    run();
  }, [open, borrowRequestId, fromUniversityId]);

  const needed = neededCount || 1;

  const canSubmit = useMemo(() => {
    if (!items.length || items.length < needed) return false;
    return items.every(
      (it) =>
        Number.isFinite(it.consultantId) &&
        it.consultantId > 0 &&
        Number.isFinite(it.consultantUniversityId) &&
        it.consultantUniversityId > 0,
    );
  }, [items, needed]);

  const selectedKeys = useMemo(
    () =>
      new Set(
        items.map((x) => `${x.consultantUniversityId}:${x.consultantId}`),
      ),
    [items],
  );

  // Filtered university list
  const filteredGroups = useMemo(() => {
    if (!uniSearch.trim()) return groups;
    const q = uniSearch.toLowerCase();
    return groups.filter(
      (g) =>
        g.universityNameTh?.toLowerCase().includes(q) ||
        g.universityNameEn?.toLowerCase().includes(q),
    );
  }, [groups, uniSearch]);

  const activeGroup = useMemo(
    () => groups.find((g) => g.universityId === activeUniversityId) || null,
    [groups, activeUniversityId],
  );

  const addAssignee = (
    u: CandidateUniversityGroup,
    c: CandidateConsultant,
  ) => {
    if (items.length >= needed) {
      alert(`เลือกได้สูงสุด ${needed} คนเท่านั้น`);
      return;
    }
    const key = `${u.universityId}:${c.consultantId}`;
    if (selectedKeys.has(key)) return;
    setItems((p) => [
      ...p,
      {
        consultantId: c.consultantId,
        consultantUniversityId: u.universityId,
        startAt: defaultStartAt || "",
        endAt: defaultEndAt || "",
        note: "",
      },
    ]);
  };

  const removeAssignee = (idx: number) => {
    setItems((p) => p.filter((_, i) => i !== idx));
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="full"
      showCloseButton={false}
    >
      <div className="flex flex-col" style={{ height: "78vh" }}>
        {/* Info bar */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-7 h-7 rounded-lg bg-primary-100 flex items-center justify-center">
              <Users className="w-4 h-4 text-primary-600" />
            </div>
            <span className="text-slate-500">
              ต้องเลือกอย่างน้อย{" "}
              <span className="font-bold text-primary-600">{needed}</span> คน
            </span>
          </div>
          {items.length > 0 && (
            <div className="ml-auto flex items-center gap-1.5 text-sm">
              <span className="font-bold text-primary-600">
                {items.length}
              </span>
              <span className="text-slate-400">/ {needed} เลือกแล้ว</span>
            </div>
          )}
        </div>

        {/* Main content — 2-column layout */}
        <div className="flex-1 min-h-0 flex gap-0 mt-4">
          {/* ── Left panel: University list ── */}
          <div className="w-[360px] shrink-0 flex flex-col border-r border-slate-100 pr-4">
            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={uniSearch}
                onChange={(e) => setUniSearch(e.target.value)}
                placeholder="ค้นหามหาวิทยาลัย..."
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-primary-300 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
              />
            </div>

            <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-2 px-1">
              มหาวิทยาลัย ({filteredGroups.length})
            </div>

            {/* University list */}
            <div className="flex-1 overflow-y-auto space-y-1.5">
              {candidatesLoading && (
                <div className="text-sm text-slate-400 py-8 text-center">
                  กำลังโหลด...
                </div>
              )}

              {candidatesError && (
                <div className="text-sm text-rose-500 py-4 text-center flex flex-col items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  {candidatesError}
                </div>
              )}

              {!candidatesLoading &&
                !candidatesError &&
                filteredGroups.length === 0 && (
                  <div className="text-sm text-slate-400 py-8 text-center">
                    ไม่พบมหาวิทยาลัย
                  </div>
                )}

              {filteredGroups.map((g) => {
                const active = g.universityId === activeUniversityId;
                const dist = fmtDist(g.distanceKm);
                const availCount = g.consultants.filter(
                  (c) => !c.alreadyAssigned,
                ).length;

                return (
                  <button
                    key={g.universityId}
                    type="button"
                    onClick={() => setActiveUniversityId(g.universityId)}
                    className={[
                      "w-full text-left rounded-xl px-3 py-3 transition-all group",
                      active
                        ? "bg-primary-50 border border-primary-200 shadow-sm"
                        : "bg-white hover:bg-slate-50 border border-transparent",
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={[
                          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                          active
                            ? "bg-primary-500 text-white"
                            : "bg-slate-100 text-slate-500 group-hover:bg-slate-200",
                        ].join(" ")}
                      >
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div
                          className={[
                            "text-sm font-bold leading-snug line-clamp-1",
                            active ? "text-primary-700" : "text-slate-800",
                          ].join(" ")}
                        >
                          {g.universityNameTh ||
                            `University #${g.universityId}`}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {dist && (
                            <span className="text-[11px] text-slate-400 flex items-center gap-0.5">
                              <MapPin className="w-3 h-3" />
                              {dist}
                            </span>
                          )}
                          <span
                            className={[
                              "text-[11px] font-semibold",
                              availCount > 0
                                ? "text-emerald-500"
                                : "text-slate-400",
                            ].join(" ")}
                          >
                            {availCount} คนว่าง
                          </span>
                        </div>
                      </div>
                      {active && (
                        <ChevronRight className="w-4 h-4 text-primary-400 shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Right panel: Consultants ── */}
          <div className="flex-1 min-w-0 flex flex-col pl-5">
            {!activeGroup ? (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                <div className="text-center">
                  <Building2 className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p>เลือกมหาวิทยาลัยจากด้านซ้าย</p>
                </div>
              </div>
            ) : (
              <>
                {/* Active university header */}
                <div className="flex items-center gap-3 pb-3 mb-3 border-b border-slate-100">
                  <div className="w-9 h-9 rounded-xl bg-primary-500 flex items-center justify-center shadow-sm">
                    <Building2 className="w-4.5 h-4.5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 leading-tight">
                      {activeGroup.universityNameTh}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {activeGroup.consultants.length} ที่ปรึกษา
                      {fmtDist(activeGroup.distanceKm) &&
                        ` • ระยะทาง ${fmtDist(activeGroup.distanceKm)}`}
                    </p>
                  </div>
                </div>

                {/* Consultant cards */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {activeGroup.consultants.map((c) => {
                    const key = `${activeGroup.universityId}:${c.consultantId}`;
                    const picked = selectedKeys.has(key);
                    const isAssigned = !!c.alreadyAssigned;

                    return (
                      <div
                        key={key}
                        className={[
                          "rounded-xl border p-4 transition-all",
                          picked
                            ? "border-primary-300 bg-primary-50/50 shadow-sm"
                            : isAssigned
                              ? "border-cyan-200 bg-cyan-50/30"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm",
                        ].join(" ")}
                      >
                        <div className="flex items-start justify-between gap-3">
                          {/* Info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-base font-bold text-slate-900">
                                {c.fullName}
                              </span>
                              {c.nickname && (
                                <span className="text-sm text-slate-500">
                                  ({c.nickname})
                                </span>
                              )}
                              {isAssigned && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-700 bg-cyan-100 px-2 py-0.5 rounded-md">
                                  <UserCheck className="w-3 h-3" />
                                  มอบหมายแล้ว
                                </span>
                              )}
                              {picked && !isAssigned && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary-700 bg-primary-100 px-2 py-0.5 rounded-md">
                                  ✓ เลือกแล้ว
                                </span>
                              )}
                            </div>

                            {/* Availability schedule */}
                            {c.shifts && c.shifts.length > 0 && (
                              <div className="mt-2.5 flex flex-wrap gap-1.5">
                                <span className="text-[11px] text-slate-400 font-semibold self-center mr-0.5">
                                  ตารางเวร:
                                </span>
                                {c.shifts.map((shift) => {
                                  const isBorrowed =
                                    shift.currentBorrowCount > 0;
                                  return (
                                    <div
                                      key={shift.shiftId}
                                      className={[
                                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium",
                                        isBorrowed
                                          ? "bg-amber-50 text-amber-700 border border-amber-200/80"
                                          : "bg-emerald-50 text-emerald-700 border border-emerald-200/80",
                                      ].join(" ")}
                                    >
                                      <Calendar className="w-3 h-3" />
                                      <span>
                                        {fmtShortDate(shift.startAt)} –{" "}
                                        {fmtShortDate(shift.endAt)}
                                      </span>
                                      {isBorrowed && (
                                        <span className="text-amber-500 text-[10px]">
                                          (ยืม {shift.currentBorrowCount})
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Specializations */}
                            {c.specializations?.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {c.specializations.slice(0, 6).map((s) => (
                                  <span
                                    key={s}
                                    className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-medium"
                                  >
                                    {s}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Action button */}
                          <Button
                            size="sm"
                            variant={
                              picked || isAssigned ? "outline" : "primary"
                            }
                            className="rounded-lg shrink-0 text-sm"
                            disabled={picked || isAssigned}
                            onClick={() => addAssignee(activeGroup, c)}
                          >
                            {isAssigned
                              ? "มอบหมายแล้ว"
                              : picked
                                ? "เลือกแล้ว"
                                : "เลือก"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Bottom: Selected consultants + actions ── */}
        <div className="pt-4 mt-4 border-t border-slate-200">
          {/* Selected tags */}
          {items.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-xs text-slate-400 font-bold self-center mr-1">
                ที่เลือก:
              </span>
              {items.map((it, idx) => {
                const group = groups.find(
                  (g) => g.universityId === it.consultantUniversityId,
                );
                const consultant = group?.consultants.find(
                  (c) => c.consultantId === it.consultantId,
                );
                return (
                  <div
                    key={`${it.consultantUniversityId}:${it.consultantId}:${idx}`}
                    className="inline-flex items-center gap-2 bg-primary-50 border border-primary-200 rounded-lg pl-3 pr-1.5 py-1.5"
                  >
                    <div className="min-w-0">
                      <span className="text-sm font-bold text-primary-800">
                        {consultant?.fullName ||
                          `Consultant #${it.consultantId}`}
                      </span>
                      <span className="text-[11px] text-primary-500 ml-1.5">
                        {group?.universityNameTh || ""}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAssignee(idx)}
                      className="w-6 h-6 rounded-md hover:bg-primary-200 flex items-center justify-center transition-colors text-primary-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => onOpenChange(false)}
            >
              ปิด
            </Button>

            <Button
              className="rounded-xl px-8 shadow-sm"
              disabled={!canSubmit || loading}
              onClick={() => onConfirm(items)}
            >
              ยืนยันมอบหมาย ({items.length}/{needed})
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
