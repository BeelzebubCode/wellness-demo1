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
    <div className="bg-white border rounded-2xl p-4">
      <div className="flex items-center gap-3">
        {searchKey && (
          <input
            className="border rounded-xl px-3 py-2 text-sm flex-1 min-w-0"
            value={(value as any)[searchKey] ?? ""}
            onChange={(e) => setFilter(searchKey, e.target.value as any)}
            placeholder={searchPlaceholder}
          />
        )}

        {dateKey && (
          <DateCalendarPopover
            valueYMD={dateYMD}
            onChangeYMD={(ymd) => setFilter(dateKey as any, ymd as any)}
            closeOnSelect={false}
          />
        )}

        <div className="relative shrink-0 ml-auto">
          <Button variant="outline" size="sm" onClick={() => setOpen((o) => !o)}>
            <SlidersHorizontal className="w-4 h-4 mr-1" />
            ตัวกรอง
            {activeDefs.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-primary-100 text-primary-600 rounded-full font-bold">
                {activeDefs.length}
              </span>
            )}
            <ChevronDown className="w-4 h-4 ml-1 opacity-70" />
          </Button>

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
        <div className="mt-3">
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
