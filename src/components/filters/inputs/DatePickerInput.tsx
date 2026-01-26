// path: src/components/filters/inputs/DatePickerInput.tsx
"use client";

import { Calendar } from "lucide-react";
import { formatDateDMY } from "../utils/date";

export function DatePickerInput({
  value,
  onChange,
  placeholder = "วว/ดด/ปปปป",
}: {
  value?: string;
  onChange: (v?: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      {/* ช่องโชว์ผลลัพธ์ที่ format เอง */}
      <input
        type="text"
        readOnly
        className="border rounded-xl px-3 py-2 pr-10 text-sm w-full bg-white"
        value={value ? formatDateDMY(value) : ""}
        placeholder={placeholder}
      />

      <Calendar className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />

      {/* input date ซ่อนไว้: เปิด picker + เก็บค่าเป็น yyyy-mm-dd */}
      <input
        type="date"
        className="absolute inset-0 opacity-0 cursor-pointer"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || undefined)}
      />
    </div>
  );
}
