// src/components/admin/data-center/modals/ConsultantDetailModal.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Star,
  Mail,
  Phone,
  Building2,
  Sparkles,
  Activity,
  CheckCircle2,
  ClipboardList,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import StatusBadge from "@/components/shared/StatusBadge";
import type { ConsultantDetail } from "@/features/data-center/types";

interface Props {
  consultantId: number | null;
  onClose: () => void;
}

function getInitials(name?: string | null) {
  const n = (name ?? "").trim();
  if (!n) return "C";
  const parts = n.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatNumber(n: number | null | undefined) {
  if (n === null || n === undefined) return "-";
  return String(n);
}

export default function ConsultantDetailModal({ consultantId, onClose }: Props) {
  const [data, setData] = useState<ConsultantDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!consultantId) return;

    setLoading(true);

    fetch(`/api/admin/data-center/consultants/${consultantId}`)
      .then(async (res) => {
        const json = await res.json();

        if (!res.ok) {
          console.error("ConsultantDetail API error:", json);
          setData(null);
          return;
        }

        const normalized: ConsultantDetail = {
          ...json,
          specializations: json?.specializations ?? [],
          languages: json?.languages ?? [],
          ratings: json?.ratings ?? [],
          recentBookings: json?.recentBookings ?? [],
        };

        setData(normalized);
      })
      .catch((e) => {
        console.error(e);
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [consultantId]);

  const initials = useMemo(() => getInitials(data?.name), [data?.name]);

  return (
    <Modal
      isOpen={!!consultantId}
      onClose={onClose}
      title="ข้อมูลผู้ให้คำปรึกษา"
      size="lg"
    >
      {loading ? (
        <div className="p-12 flex items-center justify-center">
          <Spinner />
        </div>
      ) : data ? (
        <div className="p-1">
          {/* ===== Header ===== */}
          <div className="rounded-2xl border border-gray-100 bg-gradient-to-b from-gray-50 to-white p-5">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-semibold">
                  {initials}
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-gray-900 truncate">
                    {data.name || "ไม่ระบุชื่อ"}
                  </h2>

                  {(data.specializations?.length ?? 0) > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                      <Sparkles className="h-3.5 w-3.5" />
                      {data.specializations[0]}
                    </span>
                  )}
                </div>

                <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  <span className="truncate">{data.organization || "-"}</span>
                </div>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 rounded-xl bg-white border border-gray-100 px-3 py-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-700 truncate">
                      {data.email || "-"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-white border border-gray-100 px-3 py-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-700 truncate">
                      {data.phone || "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Avg rating pill */}
              <div className="hidden sm:flex items-center gap-2 rounded-2xl bg-white border border-gray-100 px-3 py-2 shadow-sm">
                <Star className="h-4 w-4 text-amber-500 fill-amber-400" />
                <span className="font-semibold text-gray-900">
                  {data.avgRating ?? "-"}
                </span>
                <span className="text-xs text-gray-400">คะแนนเฉลี่ย</span>
              </div>
            </div>

            {/* Tags row */}
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white border border-gray-100 p-4">
                <div className="text-sm font-semibold text-gray-900 mb-2">
                  ความเชี่ยวชาญ
                </div>
                <div className="flex flex-wrap gap-2">
                  {(data.specializations?.length ?? 0) > 0 ? (
                    data.specializations.map((s, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center rounded-full bg-indigo-50 text-indigo-700 px-3 py-1 text-xs font-medium border border-indigo-100"
                      >
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-400">ไม่ระบุ</span>
                  )}
                </div>
              </div>

              <div className="rounded-2xl bg-white border border-gray-100 p-4">
                <div className="text-sm font-semibold text-gray-900 mb-2">
                  ภาษา
                </div>
                <div className="flex flex-wrap gap-2">
                  {(data.languages?.length ?? 0) > 0 ? (
                    data.languages.map((l, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 text-xs font-medium border border-emerald-100"
                      >
                        {l}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-400">ไม่ระบุ</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ===== Stats ===== */}
          <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-gray-100 bg-white p-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium text-gray-500">คิวปัจจุบัน</div>
                <Activity className="h-4 w-4 text-gray-300" />
              </div>
              <div className="mt-2 text-2xl font-semibold text-gray-900">
                {formatNumber(data.activeQueueCount)}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium text-gray-500">ทั้งหมด</div>
                <ClipboardList className="h-4 w-4 text-gray-300" />
              </div>
              <div className="mt-2 text-2xl font-semibold text-gray-900">
                {formatNumber(data.totalBookings)}
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium text-emerald-700">เสร็จสิ้น</div>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="mt-2 text-2xl font-semibold text-emerald-800">
                {formatNumber(data.completedBookings)}
              </div>
            </div>

            <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4 sm:hidden">
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium text-amber-700">คะแนนเฉลี่ย</div>
                <Star className="h-4 w-4 text-amber-500 fill-amber-400" />
              </div>
              <div className="mt-2 text-2xl font-semibold text-amber-800">
                {data.avgRating ?? "-"}
              </div>
            </div>
          </div>

          {/* ===== Ratings ===== */}
          {(data.ratings?.length ?? 0) > 0 && (
            <div className="mt-5 rounded-2xl border border-gray-100 bg-white p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">
                  คะแนนตามเกณฑ์
                </h3>
                <div className="text-xs text-gray-400">
                  (เต็ม 5)
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {data.ratings.map((r, i) => {
                  const pct = Math.max(0, Math.min(100, (r.avgScore / 5) * 100));
                  return (
                    <div key={i} className="grid grid-cols-12 gap-3 items-center">
                      <div className="col-span-12 sm:col-span-5">
                        <div className="text-sm text-gray-700">{r.criterion}</div>
                        <div className="text-xs text-gray-400">{r.count} รายการ</div>
                      </div>

                      <div className="col-span-9 sm:col-span-6">
                        <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-2.5 rounded-full bg-amber-400"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      <div className="col-span-3 sm:col-span-1 text-right">
                        <div className="text-sm font-semibold text-gray-900">
                          {r.avgScore}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===== Recent Bookings ===== */}
          <div className="mt-5 rounded-2xl border border-gray-100 bg-white overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">
                ประวัติการให้คำปรึกษา
              </h3>
              <div className="text-xs text-gray-400">ล่าสุด 10 รายการ</div>
            </div>

            {(data.recentBookings?.length ?? 0) === 0 ? (
              <div className="p-10 text-center text-gray-400 text-sm">
                ไม่มีประวัติ
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-gray-500">
                      <th className="px-5 py-3 text-left font-medium">วันที่</th>
                      <th className="px-5 py-3 text-left font-medium">นิสิต</th>
                      <th className="px-5 py-3 text-left font-medium">เรื่อง</th>
                      <th className="px-5 py-3 text-center font-medium">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.recentBookings?.map((b) => (
                      <tr key={b.id} className="hover:bg-gray-50/60">
                        <td className="px-5 py-3 text-gray-700 whitespace-nowrap">
                          {b.date}
                        </td>
                        <td className="px-5 py-3 text-gray-700">
                          {b.studentName}
                        </td>
                        <td className="px-5 py-3 text-gray-700">
                          {b.problemType}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <StatusBadge status={b.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer hint */}
          <div className="mt-4 text-xs text-gray-400 text-center">
            สร้างเมื่อ: {data.createdAt}
          </div>
        </div>
      ) : (
        <div className="p-10 text-center text-gray-400">ไม่พบข้อมูล</div>
      )}
    </Modal>
  );
}
