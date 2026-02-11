"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/Card";

export function ConsentBlock({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  const docTitle = useMemo(() => "เงื่อนไขการให้บริการและความยินยอม", []);

  return (
    <Card className="p-3">
      <div className="text-sm font-semibold text-slate-800">{docTitle}</div>
      <p className="text-xs text-slate-500 mt-2">
        กรุณายืนยันว่าคุณอ่านและยอมรับเงื่อนไขก่อนทำการจอง (ตอนนี้เป็นเวอร์ชันง่าย ๆ ก่อน เดี๋ยวค่อยต่อให้ดึง doc จริงจากระบบ)
      </p>

      <label className="mt-5 flex items-start gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-1"
        />
        <span>ฉันยอมรับและให้ความยินยอมตามเงื่อนไข</span>
      </label>
    </Card>
  );
}
