// src/components/filters/FilterPopover.tsx
"use client";


import type { RefObject } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui";
import type { FilterDef } from "./types";
import { FilterField } from "./FilterField";

export function FilterPopover<TFilters extends Record<string, any>>({
  defs,
  value,
  open,
  popRef,
  selectedKeys,
  onToggleKey,
  onSetFilter,
  onClearAll,
  onClose,
}: {
  defs: FilterDef<TFilters>[];
  value: TFilters;
  open: boolean;
  popRef: RefObject<HTMLDivElement>;
  selectedKeys: Set<keyof TFilters>;
  onToggleKey: (key: keyof TFilters) => void;
  onSetFilter: <K extends keyof TFilters>(key: K, v: TFilters[K]) => void;
  onClearAll: () => void;
  onClose: () => void;
}) {
  if (!open) return null;

  const activeDefs = defs.filter((d) => selectedKeys.has(d.key));

  return (
    <div
      ref={popRef}
      className="absolute top-full right-0 mt-2 w-[680px] max-w-[92vw] z-50 bg-white border shadow-xl rounded-2xl overflow-hidden"
      style={{ maxHeight: "70vh" }}
    >
      <div className="grid grid-cols-2">
        {/* left */}
        <div className="border-r bg-gray-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-gray-800">เลือกตัวกรอง</div>
            <button className="p-1 rounded hover:bg-gray-200" onClick={onClose} type="button">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1 max-h-[400px] overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 pr-2">
            {defs.map((def) => {
              const isSelected = selectedKeys.has(def.key);
              return (
                <button
                  key={String(def.key)}
                  onClick={() => onToggleKey(def.key)}
                  type="button"
                  className={[
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition",
                    isSelected
                      ? "bg-primary text-white border-primary shadow-sm"
                      : "bg-white hover:bg-gray-50 border-gray-200",
                  ].join(" ")}
                >
                  <span className="text-sm">{def.label}</span>
                  {isSelected && <Check className="w-4 h-4" />}
                </button>
              );
            })}
          </div>

          {activeDefs.length > 0 && (
            <div className="mt-3 pt-3 border-t">
              <Button variant="outline" size="sm" onClick={onClearAll} className="w-full">
                ล้างตัวกรองทั้งหมด
              </Button>
            </div>
          )}
        </div>

        {/* right */}
        <div className="p-4">
          <div className="text-sm font-semibold text-gray-800 mb-3">ตั้งค่าตัวกรอง</div>

          {activeDefs.length === 0 ? (
            <div className="text-sm text-gray-400 py-8 text-center">เลือกตัวกรองจากด้านซ้าย</div>
          ) : (
            <div className="space-y-4 max-h-[400px] overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 pr-2 pb-2">
              {activeDefs.map((def) => (
                <div key={String(def.key)} className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-600">{def.label}</label>
                  <FilterField
                    def={def}
                    value={(value as any)[def.key]}
                    onChange={(v: any) => onSetFilter(def.key as any, v)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-3 bg-gray-50 border-t flex items-center justify-end">
        <Button variant="primary" size="sm" onClick={onClose}>
          เสร็จสิ้น
        </Button>
      </div>
    </div>
  );
}
