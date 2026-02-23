// path: src/components/filters/FilterChipsRow.tsx
"use client";

import { X } from "lucide-react";
import type { FilterDef } from "./types";
import { formatDateDMY } from "./utils/date";

function isEmptyValue(v: any) {
  return v === undefined || v === null || v === "" || v === "ALL";
}

function renderPreview(def: any, v: any) {
  if (isEmptyValue(v)) return "ทั้งหมด";
  if (def.type === "boolean") return v ? "ใช่" : "ไม่";
  if (def.type === "date") return formatDateDMY(v) || String(v);
  if (def.type === "select" || def.type === "searchable_select") {
    const hit = def.options?.find((o: any) => String(o.value) === String(v));
    return hit?.label ?? String(v);
  }
  if (def.type === "multi_select") {
    const vals = String(v).split(",").filter(Boolean);
    if (vals.length === 0) return "ทั้งหมด";
    const labels = vals.map((val: string) => {
      const hit = def.options?.find((o: any) => String(o.value) === val);
      return hit?.label ?? val;
    });
    return labels.length <= 2 ? labels.join(", ") : `${labels.length} รายการ`;
  }
  return String(v);
}

export function FilterChipsRow<TFilters extends Record<string, any>>({
  activeDefs,
  value,
  onRemove,
  onClearAll,
}: {
  activeDefs: FilterDef<TFilters>[];
  value: TFilters;
  onRemove: (key: keyof TFilters) => void;
  onClearAll: () => void;
}) {
  if (activeDefs.length === 0) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap">
      {activeDefs.map((def) => {
        const v = (value as any)[def.key];
        const preview = renderPreview(def as any, v);

        return (
          <div
            key={String(def.key)}
            className="inline-flex items-center gap-2 bg-primary-50 border border-primary-200 rounded-full px-3 py-1.5 text-xs shrink-0"
          >
            <span className="font-semibold text-primary-600">{def.label}:</span>
            <span className="text-primary-500 font-medium">{preview}</span>
            <button
              className="p-0.5 hover:bg-primary-100 rounded-full transition-colors"
              onClick={() => onRemove(def.key)}
              type="button"
              title="ลบตัวกรองนี้"
            >
              <X className="w-3.5 h-3.5 text-primary-400" />
            </button>
          </div>
        );
      })}

      <button
        className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 hover:text-gray-700 rounded-lg transition-colors shrink-0"
        onClick={onClearAll}
        type="button"
      >
        <X className="w-3 h-3 mr-1" />
        ล้างทั้งหมด
      </button>
    </div>
  );
}
