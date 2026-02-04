"use client";

import { useEffect, useMemo, useState } from "react";
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

type CandidateConsultant = {
  consultantId: number;
  fullName: string;
  nickname?: string | null;
  specializations: string[];
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
        it.consultantUniversityId > 0 &&
        safeIsoOrEmpty(it.startAt) &&
        safeIsoOrEmpty(it.endAt)
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
      <div className="h-[82vh] max-h-[82vh] flex flex-col">
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
                        className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 flex items-start justify-between gap-4 shadow-[0_6px_18px_rgba(0,0,0,0.04)]"
                      >
                        <div className="min-w-0">
                          <div className="text-base font-semibold text-slate-900 truncate">
                            {c.fullName}
                            {c.nickname ? (
                              <span className="text-slate-500 font-normal">
                                {" "}
                                ({c.nickname})
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {(c.specializations || []).length ? (
                              c.specializations.slice(0, 10).map((s) => (
                                <Badge key={s} variant="outline">
                                  {s}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-slate-500">
                                ไม่ระบุความเชี่ยวชาญ
                              </span>
                            )}
                          </div>
                        </div>

                        <Button
                          size="sm"
                          className={[
                            "rounded-xl px-4 shadow-sm",
                            picked ? "opacity-60" : "",
                          ].join(" ")}
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
                  เลื่อนลงมาแก้ช่วงเวลา/หมายเหตุ แล้วค่อยกดยืนยัน
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
                  {items.map((it, idx) => (
                    <div
                      key={`${it.consultantUniversityId}:${it.consultantId}:${idx}`}
                      className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 space-y-3 shadow-[0_6px_18px_rgba(0,0,0,0.04)]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-semibold text-slate-900">
                          consultantId: {it.consultantId} • universityId:{" "}
                          {it.consultantUniversityId}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl"
                          onClick={() => removeAssignee(idx)}
                        >
                          ลบ
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <div className="text-xs text-slate-500 mb-1">
                            startAt (ISO)
                          </div>
                          <Input
                            value={it.startAt}
                            onChange={(e) =>
                              setItems((p) =>
                                p.map((x, i) =>
                                  i === idx ? { ...x, startAt: e.target.value } : x
                                )
                              )
                            }
                            placeholder="2026-01-26T10:00:00.000Z"
                          />
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 mb-1">
                            endAt (ISO)
                          </div>
                          <Input
                            value={it.endAt}
                            onChange={(e) =>
                              setItems((p) =>
                                p.map((x, i) =>
                                  i === idx ? { ...x, endAt: e.target.value } : x
                                )
                              )
                            }
                            placeholder="2026-01-26T12:00:00.000Z"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-slate-500 mb-1">note</div>
                        <Input
                          value={it.note || ""}
                          onChange={(e) =>
                            setItems((p) =>
                              p.map((x, i) =>
                                i === idx ? { ...x, note: e.target.value } : x
                              )
                            )
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* กัน footer ทับ */}
          <div className="h-2" />
        </div>

        {/* Footer (sticky) */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
          <Button variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
            ปิด
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                setItems((p) => [
                  ...p,
                  {
                    consultantId: 0,
                    consultantUniversityId: 0,
                    startAt: defaultStartAt || "",
                    endAt: defaultEndAt || "",
                    note: "",
                  },
                ]);
              }}
            >
              + เพิ่มเอง
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
      </div>
    </Modal>
  );
}
