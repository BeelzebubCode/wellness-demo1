"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

export function ConsentBlock({
  checked,
  onChange,
  className,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  className?: string;
}) {
  const docTitle = useMemo(() => "เงื่อนไขการให้บริการและความยินยอม", []);

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="text-sm font-semibold text-slate-800">{docTitle}</div>
      <p className="text-xs text-slate-500 mt-5 leading-relaxed space-y-2">
        <span className="block italic font-medium text-slate-600 mb-1">
          เงื่อนไขและข้อตกลงการรับบริการ (Terms and Conditions)
        </span>
        ข้าพเจ้ายินยอมปฏิบัติตามเงื่อนไขการให้บริการของศูนย์ฯ และยืนยันว่าข้อมูลที่ให้ไว้เป็นความจริงทุกประการ โดยยินยอมให้มีการรวบรวมและประมวลผลข้อมูลส่วนบุคคล ข้อมูลสุขภาพ รวมถึงประวัติการรักษา เพื่อประโยชน์ในการดูแลสุขภาพและการร่วมมือกับทีมผู้เชี่ยวชาญภายใต้มาตรฐานความปลอดภัยข้อมูล (PDPA)
        <br /><br />
        ทั้งนี้ ข้าพเจ้ารับทราบว่าข้อมูลการให้บริการจะถูกนำไปใช้เพื่อวัตถุประสงค์ทางการแพทย์และการพัฒนาคุณภาพการบริการเท่านั้น โดยศูนย์ฯ จะเก็บรักษาความลับของข้อมูลอย่างเคร่งครัด และจะไม่เปิดเผยต่อบุคคลภายนอกโดยไม่ได้รับอนุญาต เว้นแต่เป็นไปตามข้อบังคับของกฎหมายหรือกรณีฉุกเฉิน
        <br /><br />
        ข้าพเจ้าเข้าใจและยอมรับว่าสามารถขอเข้าถึง ตรวจสอบ หรือเพิกถอนความยินยอมในการเก็บข้อมูลได้ตลอดเวลาตามความประสงค์ผ่านช่องทางติดต่อที่ทางศูนย์ฯ กำหนดไว้
      </p>

      <div className="mt-auto mb-1">
        <label className="flex items-start gap-2 text-sm text-slate-700 cursor-pointer leading-relaxed">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="mt-1"
          />
          <span>ข้าพเจ้ายอมรับเงื่อนไขการให้บริการ นโยบายความเป็นส่วนตัว ยินยอมให้บันทึกข้อมูลการปรึกษา และการนำข้อมูลไปใช้ตามระเบียบของศูนย์ฯ</span>
        </label>
      </div>
    </div>
  );
}
