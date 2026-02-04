// src/features/booking/components/modals/BookingFeedbackModal.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal, Button, LoadingSpinner } from "@/components/ui";
import { cn } from "@/lib/cn";
import { Star } from "lucide-react";

type Criterion = {
  evaluation_criterion_id: number;
  evaluation_criterion_topic_th: string;
  evaluation_criterion_weight: any;
};

type Props = {
  isOpen: boolean;
  bookingId: number | null;
  onClose: () => void;
  onSuccess: () => void;
};

export function BookingFeedbackModal({ isOpen, bookingId, onClose, onSuccess }: Props) {
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [scores, setScores] = useState<Record<number, number>>({});
  const [comment, setComment] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);

  const [isLoadingCriteria, setIsLoadingCriteria] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = isOpen && !!bookingId;

  useEffect(() => {
    if (!open) return;

    (async () => {
      try {
        setError(null);
        setIsLoadingCriteria(true);

        const res = await fetch("/api/v2/evaluation-criteria", { cache: "no-store" });
        const json = await res.json();
        if (!res.ok || !json?.success) throw new Error(json?.error ?? "load failed");

        const list = (json.criteria ?? []) as Criterion[];
        setCriteria(list);

        // ✅ default score = 1 (เริ่มที่ 1)
        const init: Record<number, number> = {};
        list.forEach((c) => (init[c.evaluation_criterion_id] = 1));
        setScores(init);

        setComment("");
        setIsAnonymous(true);
      } catch (e: any) {
        console.error(e);
        setError(e.message || "โหลดเกณฑ์ประเมินไม่สำเร็จ");
      } finally {
        setIsLoadingCriteria(false);
      }
    })();
  }, [open]);

  const canSubmit = useMemo(() => {
    if (!bookingId) return false;
    if (criteria.length === 0) return false;
    return criteria.every((c) => {
      const s = scores[c.evaluation_criterion_id];
      return Number.isFinite(s) && s >= 1 && s <= 5;
    });
  }, [bookingId, criteria, scores]);

  const setScore = (criterionId: number, score: number) => {
    setScores((prev) => ({ ...prev, [criterionId]: score }));
  };

  const submit = async () => {
    if (!bookingId || !canSubmit) return;

    try {
      setError(null);
      setIsSubmitting(true);

      const ratings = criteria.map((c) => ({
        criterionId: c.evaluation_criterion_id,
        score: scores[c.evaluation_criterion_id],
      }));

      const res = await fetch(`/api/v2/bookings/${bookingId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isAnonymous,
          commentText: comment?.trim() || undefined,
          ratings,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error ?? "submit failed");

      window.dispatchEvent(new Event("points-changed"));

      onSuccess();
      onClose();
    } catch (e: any) {
      console.error(e);
      setError(e.message || "ส่งแบบประเมินไม่สำเร็จ");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="ประเมินบริการ" size="md">
      <div className="space-y-4">
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
            {error}
          </div>
        )}

        {isLoadingCriteria ? (
          <div className="py-10 flex items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {criteria.map((c) => {
                // ✅ fallback เป็น 1 (กันกรณี scores ยังไม่ set)
                const current = scores[c.evaluation_criterion_id] ?? 1;

                return (
                  <div key={c.evaluation_criterion_id} className="rounded-xl border bg-white p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 whitespace-normal break-words">
                          {c.evaluation_criterion_topic_th}
                        </p>
                        <p className="text-xs text-gray-500">ให้คะแนน 1–5</p>
                      </div>

                      {/* ✅ ดาวล้วน ๆ ไม่มีกรอบ */}
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((s) => {
                          const filled = s <= current;

                          return (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setScore(c.evaluation_criterion_id, s)}
                              className={cn(
                                "p-0 m-0 bg-transparent border-0 outline-none",
                                "transition-transform active:scale-95",
                                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30 rounded"
                              )}
                              aria-label={`ให้คะแนน ${s}`}
                            >
                              <Star
                                className={cn(
                                  "w-9 h-9",
                                  filled
                                    ? "text-amber-400 fill-amber-400"
                                    : "text-amber-300 fill-transparent"
                                )}
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="rounded-xl border bg-white p-3">
              <label className="block text-xs text-gray-600 mb-1">
                ความคิดเห็นเพิ่มเติม (ไม่บังคับ)
              </label>
              <textarea
                rows={3}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={isSubmitting}
                placeholder="เช่น ความตรงเวลา / การให้คำแนะนำ / มารยาท ฯลฯ"
              />
              <label className="mt-3 flex items-center gap-2 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  disabled={isSubmitting}
                />
                ส่งแบบไม่ระบุตัวตน
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
                ยกเลิก
              </Button>

              <Button
                size="sm"
                className="text-sm shadow-sm btn-tenant animate-in fade-in zoom-in duration-300 shrink-0"
                disabled={!canSubmit || isSubmitting}
                onClick={submit}
              >
                {isSubmitting ? <LoadingSpinner size="sm" /> : <>ส่งแบบประเมิน</>}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

export default BookingFeedbackModal;
