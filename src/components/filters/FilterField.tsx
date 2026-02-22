// path: src/components/filters/FilterField.tsx
"use client";

import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { DatePickerInput } from "./inputs/DatePickerInput";

export function FilterField({ def, value, onChange }: any) {
  const normalizeSelect = (v: string) => {
    if (v === "") return "";
    if (/^\d+$/.test(v)) return Number(v);
    return v;
  };

  if (def.type === "select") {
    return (
      <div className="relative">
        <select
          className="appearance-none w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-800 shadow-sm transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 hover:border-gray-300 font-medium cursor-pointer"
          value={value ?? ""}
          onChange={(e) => onChange(normalizeSelect(e.target.value))}
        >
          {(def.options ?? []).map((op: any) => (
            <option key={String(op.value)} value={String(op.value)} className="bg-white">
              {op.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
      </div>
    );
  }

  if (def.type === "searchable_select") {
    return (
      <SearchableSelect
        options={(def.options || []).map((opt: any) => ({
          value: String(opt.value),
          label: opt.label,
        }))}
        value={value ? String(value) : undefined}
        onValueChange={(val) => {
          onChange(val ? normalizeSelect(val) : undefined);
        }}
        placeholder={def.placeholder || "เลือก..."}
        searchPlaceholder={def.searchPlaceholder || "ค้นหา..."}
      />
    );
  }

  if (def.type === "text") {
    return (
      <input
        className="border rounded-xl px-3 py-2 text-sm w-full"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={def.placeholder ?? ""}
      />
    );
  }

  if (def.type === "numberMin") {
    return (
      <input
        type="number"
        className="border rounded-xl px-3 py-2 text-sm w-full"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
        placeholder={def.placeholder ?? "0"}
      />
    );
  }

  if (def.type === "date") {
    return <DatePickerInput value={value ?? ""} onChange={onChange} />;
  }

  if (def.type === "boolean") {
    return (
      <label className="flex items-center gap-2 text-sm border rounded-xl px-3 py-2 cursor-pointer hover:bg-gray-50">
        <input
          type="checkbox"
          className="w-4 h-4 rounded"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="text-gray-800">เปิดใช้งาน</span>
      </label>
    );
  }

  return null;
}
