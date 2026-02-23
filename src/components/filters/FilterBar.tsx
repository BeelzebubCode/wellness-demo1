"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SlidersHorizontal, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui";
import type { FilterDef } from "./types";
import { FilterPopover } from "./FilterPopover";
import { FilterChipsRow } from "./FilterChipsRow";
import { DateCalendarPopover } from "./inputs/DateCalendarPopover";

function isEmptyValue(v: any) {
  return v === undefined || v === null || v === "" || v === "ALL";
}

export function FilterBar<TFilters extends Record<string, any>>({
  defs,
  value,
  onChange,
  searchKey,
  dateKey,
  searchPlaceholder = "ค้นหา...",
}: {
  defs: FilterDef<TFilters>[];
  value: TFilters;
  onChange: (next: TFilters) => void;
  searchKey?: keyof TFilters;
  dateKey?: keyof TFilters;
  searchPlaceholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<keyof TFilters>>(new Set());
  const popRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      for (const def of defs) {
        const v = (value as any)[def.key];
        if (!isEmptyValue(v)) next.add(def.key);
      }
      return next;
    });
  }, [defs, value]);

  const activeDefs = useMemo(
    () => defs.filter((d) => selectedKeys.has(d.key)),
    [defs, selectedKeys],
  );

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!open) return;
      if (popRef.current && !popRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const setFilter = <K extends keyof TFilters>(key: K, v: TFilters[K]) => {
    onChange({ ...(value as any), [key]: v });
  };

  const toggle = (key: keyof TFilters) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      const isOn = next.has(key);

      if (isOn) {
        next.delete(key);
        const copy = { ...(value as any) };
        delete copy[key];
        onChange(copy);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const removeChip = (key: keyof TFilters) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });

    const copy = { ...(value as any) };
    delete copy[key];
    onChange(copy);
  };

  const clearAll = () => {
    setSelectedKeys(new Set());
    const keepSearch = searchKey ? { [searchKey]: (value as any)[searchKey] } : {};
    onChange(keepSearch as any);
  };

  const dateYMD = dateKey ? String((value as any)[dateKey] ?? "").trim() : "";

  return (
    <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-200/60 shadow-inner">
      <div className="flex items-center gap-3">
        {searchKey && (
          <div className="relative flex-1 min-w-0 group">
            <input
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none group-hover:border-slate-300"
              value={(value as any)[searchKey] ?? ""}
              onChange={(e) => setFilter(searchKey, e.target.value as any)}
              placeholder={searchPlaceholder}
            />
          </div>
        )}

        {dateKey && (
          <DateCalendarPopover
            valueYMD={dateYMD}
            onChangeYMD={(ymd) => setFilter(dateKey as any, ymd as any)}
            closeOnSelect={false}
          />
        )}

        <div className="relative shrink-0 ml-auto group">
          <button
            onClick={() => setOpen((o) => !o)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${open
                ? "bg-primary text-white shadow-lg ring-4 ring-primary/10 scale-[0.98]"
                : "bg-white text-slate-700 border border-slate-200 hover:border-primary/50 hover:bg-slate-50 shadow-sm"
              }`}
          >
            <SlidersHorizontal className={`w-4 h-4 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
            <span>ตัวกรอง</span>
            {activeDefs.length > 0 && (
              <span className={`ml-1 px-2 py-0.5 text-[10px] rounded-full transition-colors duration-300 ${open ? "bg-white text-primary" : "bg-primary text-white"
                }`}>
                {activeDefs.length}
              </span>
            )}
            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${open ? 'rotate-180' : 'opacity-50'}`} />
          </button>

          <FilterPopover
            defs={defs}
            value={value}
            open={open}
            popRef={popRef}
            selectedKeys={selectedKeys}
            onToggleKey={toggle}
            onSetFilter={setFilter}
            onClearAll={clearAll}
            onClose={() => setOpen(false)}
          />
        </div>
      </div>

      {activeDefs.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-200/60 transition-all duration-500 animate-in fade-in slide-in-from-top-2">
          <FilterChipsRow
            activeDefs={activeDefs}
            value={value}
            onRemove={removeChip}
            onClearAll={clearAll}
          />
        </div>
      )}
    </div>
  );
}
