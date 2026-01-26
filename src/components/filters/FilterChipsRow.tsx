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
  if (def.type === "select") {
    const hit = def.options?.find((o: any) => String(o.value) === String(v));
    return hit?.label ?? String(v);
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
            className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-full px-3 py-1.5 text-xs shrink-0"
          >
            <span className="font-medium text-indigo-800">{def.label}:</span>
            <span className="text-indigo-600">{preview}</span>
            <button
              className="p-0.5 hover:bg-indigo-100 rounded-full"
              onClick={() => onRemove(def.key)}
              type="button"
              title="ลบตัวกรองนี้"
            >
              <X className="w-3.5 h-3.5 text-indigo-500" />
            </button>
          </div>
        );
      })}

      <button
        className="text-xs text-gray-500 hover:text-gray-700 underline shrink-0"
        onClick={onClearAll}
        type="button"
      >
        ล้างทั้งหมด
      </button>
    </div>
  );
}
