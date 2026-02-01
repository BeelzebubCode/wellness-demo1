// ==========================================
// src/components/booking/BookingForm.tsx
// ==========================================

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui";
import { AlertTriangle } from "lucide-react";
import {
  PROBLEM_CATEGORY_CONFIG,
  ProblemCategoryCode,
} from "@/lib/problem-category.config";
import { AlertBox } from "../notification/AlertBox";

type ProblemCategory = {
  id: number;
  code: string;
  nameTh: string;
  nameEn?: string | null;
  description?: string | null;
};

export interface BookingFormData {
  problemCategoryId: number;
  problemTypeOther?: string;
  problemDescription: string;
}

export interface BookingFormProps {
  onSubmit: (data: BookingFormData) => void | Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export function BookingForm({
  onSubmit,
  isLoading = false,
  error,
}: BookingFormProps) {
  const [formData, setFormData] = useState<BookingFormData>({
    problemCategoryId: 0,
    problemTypeOther: "",
    problemDescription: "",
  });

  type FormErrors = {
    problemCategoryId?: string;
    problemTypeOther?: string;
    problemDescription?: string;
  };

  const [errors, setErrors] = useState<FormErrors>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // ✅ กัน submit ซ้อนในระดับฟอร์ม (เผื่อ state isLoading ยังไม่ทันอัปเดต)
  const submitLockRef = useRef(false);

  // ---- Load categories from API (nameTh) ----
  const [categories, setCategories] = useState<ProblemCategory[]>([]);
  const [isCatLoading, setIsCatLoading] = useState(true);
  const [catError, setCatError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setIsCatLoading(true);
        setCatError(null);

        const res = await fetch("/api/v1/problem-categories", {
          cache: "no-store",
        });
        const data = await res.json();

        if (!res.ok || !data?.success) {
          throw new Error(data?.error || "Failed to load problem categories");
        }

        if (!mounted) return;

        const list: ProblemCategory[] = Array.isArray(data.categories)
          ? data.categories
          : [];
        setCategories(list);
      } catch (e: any) {
        if (!mounted) return;
        setCatError(e?.message || "Failed to load problem categories");
        setCategories([]);
      } finally {
        if (!mounted) return;
        setIsCatLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === formData.problemCategoryId) || null,
    [categories, formData.problemCategoryId],
  );

  const isOtherSelected = selectedCategory?.code?.toUpperCase() === "OTHER";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // ✅ กันยิงซ้ำตอนกำลังส่ง (กดรัว / กด Enter ซ้ำ)
    if (isLoading || submitLockRef.current) return;

    setHasSubmitted(true);

    const nextErrors: FormErrors = {};

    if (!formData.problemCategoryId || formData.problemCategoryId <= 0) {
      nextErrors.problemCategoryId = "กรุณาเลือกประเภทปัญหาที่ต้องการปรึกษา";
    }

    if (isOtherSelected && !formData.problemTypeOther?.trim()) {
      nextErrors.problemTypeOther = "กรุณาระบุประเภทปัญหาที่ต้องการปรึกษา";
    }

    if (!formData.problemDescription?.trim()) {
      nextErrors.problemDescription = "กรุณากรอกรายละเอียดเพิ่มเติม";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    submitLockRef.current = true;
    try {
      await onSubmit({
        problemCategoryId: formData.problemCategoryId,
        problemTypeOther: formData.problemTypeOther?.trim(),
        problemDescription: formData.problemDescription.trim(),
      });
    } finally {
      submitLockRef.current = false;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Problem Category Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          ประเภทปัญหาที่ต้องการปรึกษา <span className="text-red-500">*</span>
        </label>

        {isCatLoading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500">
            กำลังโหลดประเภทปัญหา...
          </div>
        ) : catError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3">
            <p className="flex items-start gap-2 text-xs text-red-700">
              <AlertTriangle className="mt-0.5 h-4 w-4" />
              <span>{catError}</span>
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((c) => {
                const isSelected = formData.problemCategoryId === c.id;

                const code = c.code as ProblemCategoryCode;
                const config =
                  PROBLEM_CATEGORY_CONFIG[code] ??
                  PROBLEM_CATEGORY_CONFIG.OTHER;

                const Icon = config.icon;

                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      if (isLoading) return; // ✅ กันเปลี่ยนค่าระหว่างกำลังส่ง

                      setFormData((prev) => ({
                        ...prev,
                        problemCategoryId: c.id,
                        problemTypeOther:
                          code === "OTHER" ? prev.problemTypeOther : "",
                      }));

                      setErrors((prev) => ({
                        ...prev,
                        problemCategoryId: undefined,
                      }));
                      setHasSubmitted(false);
                    }}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border-2 p-3 text-left text-sm transition-all",
                      isSelected
                        ? "border-primary-500 bg-primary-50 text-primary-800 shadow-sm"
                        : "border-gray-200 text-gray-700 hover:border-primary-200 hover:bg-primary-50/40",
                      isLoading && "opacity-60 cursor-not-allowed",
                    )}
                    disabled={isLoading}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50">
                      <Icon className={cn("h-5 w-5", config.color)} />
                    </div>

                    <span className="font-medium leading-snug">{c.nameTh}</span>
                  </button>
                );
              })}
            </div>

            {hasSubmitted && errors.problemCategoryId && (
              <div className="mt-3">
                <AlertBox type="error" message={errors.problemCategoryId} />
              </div>
            )}
          </>
        )}
      </div>

      {/* Other Problem Type Input */}
      {isOtherSelected && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            กรุณาระบุประเภทปัญหา
          </label>

          <input
            type="text"
            value={formData.problemTypeOther}
            disabled={isLoading}
            onChange={(e) => {
              if (isLoading) return;

              setFormData((prev) => ({
                ...prev,
                problemTypeOther: e.target.value,
              }));

              if (hasSubmitted) {
                setErrors((prev) => ({ ...prev, problemTypeOther: undefined }));
              }
            }}
            placeholder="เช่น ปัญหาการปรับตัว ปัญหาสุขภาพ ฯลฯ"
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 disabled:opacity-60"
          />

          {hasSubmitted && errors.problemTypeOther && (
            <div className="mt-2">
              <AlertBox type="error" message={errors.problemTypeOther} />
            </div>
          )}
        </div>
      )}

      {/* Problem Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          รายละเอียดเพิ่มเติม <span className="text-red-500">*</span>
        </label>

        <textarea
          value={formData.problemDescription}
          disabled={isLoading}
          onChange={(e) => {
            if (isLoading) return;

            setFormData((prev) => ({
              ...prev,
              problemDescription: e.target.value,
            }));
            if (hasSubmitted) {
              setErrors((prev) => ({ ...prev, problemDescription: undefined }));
            }
          }}
          rows={4}
          placeholder="อธิบายปัญหาหรือสิ่งที่ต้องการปรึกษาเพิ่มเติม..."
          className="
            w-full resize-none rounded-xl border border-gray-200
            px-4 py-3 text-sm outline-none transition
            focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20
            disabled:opacity-60
          "
        />

        {hasSubmitted && errors.problemDescription && (
          <div className="mt-3">
            <AlertBox type="error" message={errors.problemDescription} />
          </div>
        )}

        <p className="mt-1 text-xs text-gray-400">
          ข้อมูลนี้จะถูกเก็บรักษาเป็นความลับ
          และใช้เพื่อการเตรียมตัวของผู้ให้คำปรึกษาเท่านั้น
        </p>
      </div>

      {error && <AlertBox type="error" message={error} />}

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full bg-primary-500 hover:bg-primary-600"
        isLoading={isLoading}
        disabled={isLoading}
        aria-disabled={isLoading}
        aria-busy={isLoading}
      >
        ยืนยันการจอง
      </Button>
    </form>
  );
}
