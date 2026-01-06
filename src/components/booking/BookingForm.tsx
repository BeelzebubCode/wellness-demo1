// ==========================================
// 📌 Booking Component: BookingForm (Uses nameTh from API)
// ==========================================

'use client';

import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui';
import {
  AlertTriangle,
  Brain,
  Heart,
  Home,
  MoonStar,
  SmilePlus,
  Users,
  BriefcaseBusiness,
  BookOpen,
  CigaretteOff,
  Sparkles,
} from 'lucide-react';

type ProblemCategory = {
  id: number;
  code: string;
  nameTh: string;
  nameEn?: string | null;
  description?: string | null;
};

export interface BookingFormData {
  // ✅ ส่ง id ตรง DB
  problemCategoryId: number;
  problemTypeOther?: string;
  problemDescription: string;
}

export interface BookingFormProps {
  onSubmit: (data: BookingFormData) => void;
  isLoading?: boolean;
  error?: string | null;
}

export function BookingForm({ onSubmit, isLoading = false, error }: BookingFormProps) {
  const [formData, setFormData] = useState<BookingFormData>({
    problemCategoryId: 0,
    problemTypeOther: '',
    problemDescription: '',
  });

  const [localError, setLocalError] = useState<string | null>(null);

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

        const res = await fetch('/api/v1/problem-categories', { cache: 'no-store' });
        const data = await res.json();

        if (!res.ok || !data?.success) {
          throw new Error(data?.error || 'Failed to load problem categories');
        }

        if (!mounted) return;

        const list: ProblemCategory[] = Array.isArray(data.categories) ? data.categories : [];
        setCategories(list);
      } catch (e: any) {
        if (!mounted) return;
        setCatError(e?.message || 'Failed to load problem categories');
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

  // ---- Icon mapping by DB code ----
  const iconByCode: Record<string, JSX.Element> = {
    stress: <Brain className="h-5 w-5 text-primary-500" />,
    depression: <MoonStar className="h-5 w-5 text-indigo-500" />,
    relationship: <Heart className="h-5 w-5 text-rose-500" />,
    study: <BookOpen className="h-5 w-5 text-emerald-500" />,
    work: <BriefcaseBusiness className="h-5 w-5 text-amber-600" />,
    family: <Users className="h-5 w-5 text-orange-500" />,
    self: <SmilePlus className="h-5 w-5 text-sky-500" />,
    sleep: <MoonStar className="h-5 w-5 text-purple-500" />,
    addiction: <CigaretteOff className="h-5 w-5 text-red-500" />,
    grief: <Sparkles className="h-5 w-5 text-slate-500" />,
    other: <Home className="h-5 w-5 text-gray-500" />,
  };

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === formData.problemCategoryId) || null,
    [categories, formData.problemCategoryId]
  );

  const isOtherSelected = selectedCategory?.code === 'other';

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.problemCategoryId || formData.problemCategoryId <= 0) {
      setLocalError('กรุณาเลือกประเภทปัญหาที่ต้องการปรึกษา');
      return;
    }

    if (isOtherSelected && !formData.problemTypeOther?.trim()) {
      setLocalError('กรุณาระบุประเภทปัญหาที่ต้องการปรึกษา');
      return;
    }

    setLocalError(null);

    onSubmit({
      problemCategoryId: formData.problemCategoryId,
      problemTypeOther: formData.problemTypeOther?.trim(),
      problemDescription: formData.problemDescription.trim(),
    });
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
          <div className="grid grid-cols-2 gap-2">
            {categories.map((c) => {
              const isSelected = formData.problemCategoryId === c.id;
              const icon = iconByCode[c.code] ?? iconByCode.other;

              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      problemCategoryId: c.id,
                      // ถ้าเปลี่ยนหมวดแล้วไม่ใช่ other -> ล้างข้อความอื่นๆ
                      problemTypeOther: c.code === 'other' ? prev.problemTypeOther : '',
                    }))
                  }
                  className={cn(
                    'flex items-center gap-2 rounded-xl border-2 p-3 text-left text-sm transition-all',
                    'bg-white',
                    isSelected
                      ? 'border-primary-500 bg-primary-50 text-primary-800 shadow-sm'
                      : 'border-gray-200 text-gray-700 hover:border-primary-200 hover:bg-primary-50/40'
                  )}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50">
                    {icon}
                  </div>

                  {/* ✅ สำคัญ: แสดงชื่อไทยจาก DB */}
                  <span className="font-medium leading-snug">
                    {c.nameTh}
                  </span>
                </button>
              );
            })}
          </div>
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
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                problemTypeOther: e.target.value,
              }))
            }
            placeholder="เช่น ปัญหาการปรับตัว ปัญหาสุขภาพ ฯลฯ"
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
      )}

      {/* Problem Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          รายละเอียดเพิ่มเติม (ถ้ามี)
        </label>
        <textarea
          value={formData.problemDescription}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              problemDescription: e.target.value,
            }))
          }
          rows={4}
          placeholder="อธิบายปัญหาหรือสิ่งที่ต้องการปรึกษาเพิ่มเติม..."
          className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
        />
        <p className="mt-1 text-xs text-gray-400">
          ข้อมูลนี้จะถูกเก็บรักษาเป็นความลับ และใช้เพื่อการเตรียมตัวของผู้ให้คำปรึกษาเท่านั้น
        </p>
      </div>

      {/* Error Message */}
      {(localError || error) && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3">
          <p className="flex items-start gap-2 text-xs text-red-700">
            <AlertTriangle className="mt-0.5 h-4 w-4" />
            <span>{localError || error}</span>
          </p>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full bg-primary-500 hover:bg-primary-600"
        isLoading={isLoading}
        disabled={isLoading}
      >
        ยืนยันการจอง
      </Button>
    </form>
  );
}
