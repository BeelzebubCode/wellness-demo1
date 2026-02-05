"use client";

import { useEffect, useMemo, useState } from "react";
import { MapPin } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
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
  shifts: CandidateShift[]; // ✅ เพิ่ม shift info
};

type CandidateUniversityGroup = {
  universityId: number;
  universityNameTh: string;
  universityNameEn?: string | null;
  distanceKm: number | null; // null ถ้าคำนวณไม่ได้
  consultants: CandidateConsultant[];
};

type CandidatesResponse = {
  fromUniversityId: number;
  groups: CandidateUniversityGroup[];
};

type ApiOk<T> = {
  ok: boolean;
  data?: T;
  error?: string;
};


// ==============================
// Helpers
// ==============================
function formatDistanceKm(km: number | null) {
  if (km == null || Number.isNaN(km)) return "—";
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

function safeIsoOrEmpty(v: string) {
  return String(v || "").trim();
}

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

  // ✅ เพิ่มเพื่อให้ UI โหลด candidate ได้จริง
  borrowRequestId: number;
  fromUniversityId: number;
  defaultStartAt: string; // ISO
  defaultEndAt: string; // ISO

  onConfirm: (items: AssignItem[]) => Promise<void> | void;
  loading?: boolean;
}) {
  // selected assignees
  const [items, setItems] = useState<AssignItem[]>([]);

  // candidates
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [candidatesError, setCandidatesError] = useState<string | null>(null);
  const [groups, setGroups] = useState<CandidateUniversityGroup[]>([]);
  const [activeUniversityId, setActiveUniversityId] = useState<number | null>(null);

  // reset when modal opened
  useEffect(() => {
    if (!open) return;

    // reset selected on open (ถ้าอยากให้จำค่าเดิม เอา 2 บรรทัดนี้ออก)
    setItems([]);
    setCandidatesError(null);

    const run = async () => {
      setCandidatesLoading(true);
      try {
        /**
         * ✅ คาดหวัง endpoint แบบนี้:
         * GET /api/v2/platform/borrow-requests/[id]/candidates?fromUniversityId=...
         *
         * Response:
         * {
         *   fromUniversityId: number,
         *   groups: [
         *     { universityId, universityNameTh, distanceKm, consultants: [{ consultantId, fullName, nickname, specializations: [] }] }
         *   ]
         * }
         */
        const res = await fetch(
          `/api/v2/platform/borrow-requests/${borrowRequestId}/candidates?fromUniversityId=${fromUniversityId}`,
          { method: "GET" },
        );

        if (!res.ok) {
          const t = await res.text().catch(() => "");
          throw new Error(t || `Failed to load candidates (${res.status})`);
        }

        const json = (await res.json()) as ApiOk<CandidatesResponse>;

        // เรียงจากใกล้ไปไกล (distance null ไปท้าย)
        const payload = json.data;
        const sorted = [...(payload?.groups || [])].sort((a, b) => {
          const ad = a.distanceKm;
          const bd = b.distanceKm;
          if (ad == null && bd == null) return 0;
          if (ad == null) return 1;
          if (bd == null) return -1;
          return ad - bd;
        });

        setGroups(sorted);
        setActiveUniversityId(sorted[0]?.universityId ?? null);
      } catch (e: any) {
        setCandidatesError(e?.message || "Load candidates failed");
        setGroups([]);
        setActiveUniversityId(null);
      } finally {
        setCandidatesLoading(false);
      }
    };

    run();
  }, [open, borrowRequestId, fromUniversityId]);

  const needed = neededCount || 1;

  const can = useMemo(() => {
    if (!items.length) return false;
    if (items.length < needed) return false;
    return items.every((it) => {
      return (
        Number.isFinite(it.consultantId) &&
        it.consultantId > 0 &&
        Number.isFinite(it.consultantUniversityId) &&
        it.consultantUniversityId > 0
      );
    });
  }, [items, needed]);

  const selectedKeySet = useMemo(() => {
    return new Set(items.map((x) => `${x.consultantUniversityId}:${x.consultantId}`));
  }, [items]);

  const activeGroup = useMemo(() => {
    return groups.find((g) => g.universityId === activeUniversityId) || null;
  }, [groups, activeUniversityId]);

  const addAssignee = (u: CandidateUniversityGroup, c: CandidateConsultant) => {
    const key = `${u.universityId}:${c.consultantId}`;
    if (selectedKeySet.has(key)) return;

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
    <Modal open={open} onOpenChange={onOpenChange} title="Assign Consultants">
      {/* ✅ Modal สูงเท่าจอ และ scroll แค่ตัวเดียว */}
      <div className="max-h-[75vh] flex flex-col">
        {/* Header */}
        <div className="pb-3">
          <div className="text-sm text-slate-600">
            ต้อง assign อย่างน้อย: <b>{needed}</b> คน
          </div>
        </div>

        {/* Body (scroll ทั้งหน้า) */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {/* =======================
            SECTION 1: Candidates (FULL WIDTH)
           ======================= */}
          <div className="rounded-3xl border border-slate-200 bg-white/75 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
            <div className="p-4 sm:p-5 border-b border-slate-200/70">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold text-slate-900">
                    มหาลัยที่มีคนว่าง
                  </div>
                  <div className="text-sm text-slate-600 mt-0.5">
                    เลือกมหาลัย → เลือก consultant (แนะนำเรียงใกล้ก่อน)
                  </div>
                </div>

                {candidatesLoading ? (
                  <div className="text-xs text-slate-500 mt-1">กำลังโหลด...</div>
                ) : null}
              </div>

              {candidatesError ? (
                <div className="mt-2 text-sm text-rose-600">{candidatesError}</div>
              ) : null}

              {!candidatesLoading && !candidatesError && groups.length === 0 ? (
                <div className="mt-2 text-sm text-slate-500">
                  ไม่พบ consultant ที่เข้าเงื่อนไข
                </div>
              ) : null}

              {/* University pills */}
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {groups.map((g) => {
                  const active = g.universityId === activeUniversityId;
                  return (
                    <button
                      key={g.universityId}
                      type="button"
                      onClick={() => setActiveUniversityId(g.universityId)}
                      className={[
                        "shrink-0 rounded-2xl border px-4 py-2 text-left transition",
                        "min-w-[240px]",
                        active
                          ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                          : "border-slate-200 bg-white hover:bg-slate-50",
                      ].join(" ")}
                    >
                      <div className="text-sm font-semibold leading-5 line-clamp-1">
                        {g.universityNameTh || `University #${g.universityId}`}
                      </div>
                      <div
                        className={[
                          "text-xs mt-0.5",
                          active ? "text-white/80" : "text-slate-500",
                        ].join(" ")}
                      >
                        ระยะทาง {formatDistanceKm(g.distanceKm)} • {g.consultants.length} คน
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Consultant list */}
            <div className="p-4 sm:p-5">
              {!activeGroup ? (
                <div className="text-sm text-slate-500">เลือกมหาลัยด้านบนก่อน</div>
              ) : (
                <div className="space-y-3">
                  {activeGroup.consultants.map((c) => {
                    const key = `${activeGroup.universityId}:${c.consultantId}`;
                    const picked = selectedKeySet.has(key);

                    return (
                      <div
                        key={key}
                        className="rounded-2xl border-2 border-slate-200 bg-white p-5 flex items-start justify-between gap-4 shadow-[0_6px_18px_rgba(0,0,0,0.04)] hover:border-slate-300 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-lg font-bold text-slate-900 truncate mb-1">
                            {c.fullName}
                            {c.nickname ? (
                              <span className="text-slate-500 font-normal text-base ml-2">
                                ({c.nickname})
                              </span>
                            ) : null}
                          </div>

                          {/* ✅ แสดง shift info */}
                          {c.shifts && c.shifts.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {c.shifts.map((shift) => {
                                const start = new Date(shift.startAt);
                                const end = new Date(shift.endAt);
                                const isBorrowed = shift.currentBorrowCount > 0;

                                return (
                                  <div
                                    key={shift.shiftId}
                                    className={[
                                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium",
                                      isBorrowed
                                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                                        : "bg-emerald-50 text-emerald-700 border border-emerald-200",
                                    ].join(" ")}
                                  >
                                    <span>📅</span>
                                    <span>
                                      {start.toLocaleDateString("th-TH", {
                                        day: "numeric",
                                        month: "short",
                                      })}{" "}
                                      -{" "}
                                      {end.toLocaleDateString("th-TH", {
                                        day: "numeric",
                                        month: "short",
                                      })}
                                    </span>
                                    {isBorrowed && (
                                      <span className="text-amber-600">
                                        (ถูกยืม {shift.currentBorrowCount})
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          <div className="mt-2.5 flex flex-wrap gap-2">
                            {(c.specializations || []).length ? (
                              c.specializations.slice(0, 10).map((s) => (
                                <Badge key={s} variant="outline" className="text-sm">
                                  {s}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-slate-500">
                                ไม่ระบุความเชี่ยวชาญ
                              </span>
                            )}
                          </div>
                        </div>

                        <Button
                          size="md"
                          className="rounded-xl px-5 shadow-sm shrink-0"
                          disabled={picked}
                          onClick={() => addAssignee(activeGroup, c)}
                        >
                          {picked ? "เลือกแล้ว" : "เลือก"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* =======================
            SECTION 2: Selected (FULL WIDTH)
           ======================= */}
          <div className="rounded-3xl border border-slate-200 bg-white/75 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
            <div className="p-4 sm:p-5 border-b border-slate-200/70 flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-semibold text-slate-900">
                  คนที่เลือก ({items.length}/{needed})
                </div>
                <div className="text-sm text-slate-600 mt-0.5">
                  เลือกครบแล้วกดยืนยันได้เลย
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5">
              {items.length === 0 ? (
                <div className="text-sm text-slate-500">
                  ยังไม่ได้เลือก consultant
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((it, idx) => {
                    // Find consultant info
                    const group = groups.find(g => g.universityId === it.consultantUniversityId);
                    const consultant = group?.consultants.find(c => c.consultantId === it.consultantId);

                    const consultantName = consultant?.fullName || `Consultant #${it.consultantId}`;
                    const consultantNickname = consultant?.nickname;
                    const universityName = group?.universityNameTh || `University #${it.consultantUniversityId}`;

                    return (
                      <div
                        key={`${it.consultantUniversityId}:${it.consultantId}:${idx}`}
                        className="rounded-2xl border-2 border-slate-200 bg-white p-5 flex items-center justify-between gap-4 hover:border-primary-300 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-lg font-bold text-slate-900 mb-1.5">
                            {consultantName}
                            {consultantNickname && (
                              <span className="text-slate-500 font-normal text-base ml-2">
                                ({consultantNickname})
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-slate-600 mt-1">
                            <MapPin className="w-4 h-4" />
                            {universityName}
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="md"
                          className="rounded-xl shrink-0"
                          onClick={() => removeAssignee(idx)}
                        >
                          ลบ
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* กัน footer ทับ */}
          <div className="h-6" />
        </div>

        {/* Footer (sticky) */}
        <div className="pt-4 pb-2 border-t border-slate-200 bg-white flex items-center justify-between gap-2">
          <Button variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
            ปิด
          </Button>

          <Button
            className="rounded-xl px-6 shadow-sm"
            disabled={!can || loading}
            onClick={() => onConfirm(items)}
          >
            ยืนยัน Assign
          </Button>
        </div>
      </div>
    </Modal>
  );
}
