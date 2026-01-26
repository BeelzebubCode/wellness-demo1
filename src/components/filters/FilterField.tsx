// path: src/components/filters/FilterField.tsx
"use client";

import { DatePickerInput } from "./inputs/DatePickerInput";

export function FilterField({ def, value, onChange }: any) {
  const normalizeSelect = (v: string) => {
    if (v === "") return "";
    if (/^\d+$/.test(v)) return Number(v);
    return v;
  };

  if (def.type === "select") {
    return (
      <select
        className="border rounded-xl px-3 py-2 text-sm w-full bg-white"
        value={value ?? ""}
        onChange={(e) => onChange(normalizeSelect(e.target.value))}
      >
        {(def.options ?? []).map((op: any) => (
          <option key={String(op.value)} value={String(op.value)}>
            {op.label}
          </option>
        ))}
      </select>
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
