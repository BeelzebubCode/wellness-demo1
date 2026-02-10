// src/app/(tenant)/(university)/consultant/shifts/page.tsx

import { ConsultantShiftsPageClient } from "@/features/consultant/shifts";

export const metadata = {
  title: "ตารางเวร | NU Wellness",
  description: "ดูและจัดการตารางเวรประจำของที่ปรึกษา",
};

export default function ConsultantShiftsPage() {
  return (
    <div className="container max-w-5xl mx-auto px-4 py-6">
      <ConsultantShiftsPageClient />
    </div>
  );
}
