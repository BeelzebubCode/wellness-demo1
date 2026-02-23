// src/components/filters/FilterPopover.tsx
"use client";


import type { RefObject } from "react";
import { Check, X, SlidersHorizontal } from "lucide-react";
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
      className={`absolute top-full right-0 mt-3 w-[720px] max-w-[92vw] z-[70] bg-white border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-[2rem] overflow-hidden transition-all duration-500 ease-out origin-top-right ${open ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-4 pointer-events-none"
        }`}
      style={{ maxHeight: "75vh" }}
    >
      <div className="grid grid-cols-[280px_1fr] h-full">
        {/* left: Selection Pane */}
        <div className="border-r border-slate-100 bg-slate-50/50 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="text-xs font-black text-slate-400 uppercase tracking-widest">เลือกตัวกรอง</div>
            <button
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-all duration-300"
              onClick={onClose}
              type="button"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          <div className="space-y-1.5 flex-1 overflow-auto pr-2 -mr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            {defs.map((def) => {
              const isSelected = selectedKeys.has(def.key);
              return (
                <button
                  key={String(def.key)}
                  onClick={() => onToggleKey(def.key)}
                  type="button"
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-left transition-all duration-300 group ${isSelected
                    ? "bg-primary text-white shadow-md shadow-primary/20 translate-x-1"
                    : "bg-white hover:bg-slate-100/80 border border-slate-100 hover:border-slate-200 text-slate-600"
                    }`}
                >
                  <span className={`text-sm font-semibold ${isSelected ? "text-white" : "text-slate-600"}`}>
                    {def.label}
                  </span>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${isSelected ? "bg-white/20 scale-100" : "bg-slate-100 scale-0 group-hover:scale-100"
                    }`}>
                    {isSelected ? <Check className="w-3 h-3 text-white" strokeWidth={3} /> : <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />}
                  </div>
                </button>
              );
            })}
          </div>

          {activeDefs.length > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-200/60">
              <button
                onClick={onClearAll}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all duration-300 uppercase tracking-wider"
              >
                ล้างทั้งหมด
              </button>
            </div>
          )}
        </div>

        {/* right: Settings Pane */}
        <div className="p-8 flex flex-col bg-white">
          <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">ตั้งค่ารายละเอียด</div>

          {activeDefs.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mb-4 border border-slate-100">
                <SlidersHorizontal className="w-8 h-8 text-slate-200" />
              </div>
              <p className="text-sm font-medium text-slate-400 leading-relaxed max-w-[200px]">
                เริ่มต้นโดยการเลือกหัวข้อ<br />ที่ต้องการกรองจากด้านซ้าย
              </p>
            </div>
          ) : (
            <div className="space-y-6 flex-1 overflow-auto pr-4 -mr-4 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent pb-4">
              {activeDefs.map((def) => (
                <div key={String(def.key)} className="space-y-2 animate-in fade-in slide-in-from-right-4 duration-500">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{def.label}</label>
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

      <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <p className="text-[10px] font-medium text-slate-400">เลือก {activeDefs.length} ตัวกรองที่เปิดใช้งานอยู่</p>
        <button
          onClick={onClose}
          className="px-8 py-2.5 bg-primary text-white rounded-2xl text-sm font-black shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300 active:scale-95"
        >
          ยืนยันการเลือก
        </button>
      </div>
    </div>
  );
}
